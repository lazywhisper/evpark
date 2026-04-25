import { fetchWithRetry } from "../lib/http";
import type { Rates } from "../lib/rates";
import { toUsd } from "../lib/rates";
import { extractPhone, extractVin } from "./normalize";
import type {
  ListingDetail,
  NormalizedListing,
  RawPhoto,
  ScanResult,
  SourceParser,
} from "./types";

// kufar разделил легковые на отдельный домен auto.kufar.by с Next.js SSR.
// Их публичный API api.kufar.by/search-api для категории 2010 не отдаёт фильтр
// поколения E39, поэтому идём через SSR-страницу и парсим __NEXT_DATA__:
//   https://auto.kufar.by/l/cars/bmw-5-serii-iv-e39-restajling
//   https://auto.kufar.by/l/cars/bmw-5-serii-iv-e39
//
// Cursor format: "<slug>:<token>". Пустой token = первая страница.
// Bootstrap идёт facelift → pre-facelift; daily — только первая страница facelift.

const FACELIFT_SLUG = "bmw-5-serii-iv-e39-restajling";
const PREFACELIFT_SLUG = "bmw-5-serii-iv-e39";

type Slug = typeof FACELIFT_SLUG | typeof PREFACELIFT_SLUG;

const NEXT_DATA_RE = /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/;

function buildUrl(slug: Slug, cursorToken: string): string {
  const base = `https://auto.kufar.by/l/cars/${slug}`;
  return cursorToken ? `${base}?cursor=${encodeURIComponent(cursorToken)}` : base;
}

async function fetchSlug(slug: Slug, cursorToken: string): Promise<KufarPage> {
  const url = buildUrl(slug, cursorToken);
  const res = await fetchWithRetry(url, {
    headers: {
      accept: "text/html,application/xhtml+xml",
      "accept-language": "ru,en;q=0.5",
      "user-agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
  if (!res.ok) throw new Error(`kufar ${res.status}`);
  const html = await res.text();
  const m = NEXT_DATA_RE.exec(html);
  if (!m) throw new Error("kufar __NEXT_DATA__ not found");
  const data = JSON.parse(m[1]!) as { props?: { initialState?: { listing?: KufarListing } } };
  const listing = data.props?.initialState?.listing;
  if (!listing) return { ads: [], next: null };
  const next = (listing.pagination ?? []).find((p) => p.label === "next")?.token ?? null;
  return { ads: listing.ads ?? [], next };
}

function parseCursor(cursor: string | undefined): { slug: Slug; token: string } {
  if (!cursor) return { slug: FACELIFT_SLUG, token: "" };
  const idx = cursor.indexOf(":");
  if (idx < 0) return { slug: FACELIFT_SLUG, token: cursor };
  const slugPart = cursor.slice(0, idx);
  const slug = slugPart === PREFACELIFT_SLUG ? PREFACELIFT_SLUG : FACELIFT_SLUG;
  return { slug, token: cursor.slice(idx + 1) };
}

function nextCursor(
  slug: Slug,
  page: KufarPage,
  mode: "daily" | "bootstrap",
): string | null {
  if (mode !== "bootstrap") return null;
  if (page.next) return `${slug}:${page.next}`;
  if (slug === FACELIFT_SLUG) return `${PREFACELIFT_SLUG}:`;
  return null;
}

export const kufarParser: SourceParser = {
  source: "kufar",
  async scan({ cursor, mode, rates }) {
    const { slug, token } = parseCursor(cursor);
    const page = await fetchSlug(slug, token);
    const listings = page.ads.map((a) => toNormalized(a, rates));
    return { listings, nextCursor: nextCursor(slug, page, mode) } satisfies ScanResult;
  },
  async fetchDetail(sourceId): Promise<ListingDetail | null> {
    // Используем тот же __NEXT_DATA__ pattern на странице объявления
    const url = `https://auto.kufar.by/vi/${sourceId}`;
    try {
      const res = await fetchWithRetry(url, {
        headers: {
          accept: "text/html,application/xhtml+xml",
          "user-agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        retries: 1,
      });
      if (!res.ok) return null;
      const html = await res.text();
      const m = NEXT_DATA_RE.exec(html);
      if (!m) return null;
      const data = JSON.parse(m[1]!) as { props?: { initialState?: { adView?: KufarAdView } } };
      const adView = data.props?.initialState?.adView;
      // Структура: adView.data.{body, description, subject, images, ad_parameters...}
      // На list-page это adView напрямую, но детальная вкладывает в .data
      const ad = adView?.data ?? adView?.ad ?? adView;
      if (!ad) return null;
      const adAny = ad as Record<string, unknown>;
      const params = new Map(
        ((adAny.ad_parameters as KufarAd["ad_parameters"]) ?? []).map((p) => [p.p, p]),
      );
      const region = String(params.get("region")?.vl ?? "") || null;
      const area = String(params.get("area")?.vl ?? "") || null;
      const images = (adAny.images as KufarImage[] | undefined) ?? [];
      const photos: RawPhoto[] = images
        .filter((i) => i.path || i.id)
        .map((i) => ({ url: imageUrl(i) }));
      const description =
        (adAny.body as string | undefined) ??
        (adAny.description as string | undefined) ??
        (adAny.body_short as string | undefined) ??
        null;
      return {
        description,
        vin: String(params.get("full_vehicle_vin")?.v ?? "") || null,
        phoneNorm: null,
        region: [region, area].filter(Boolean).join(", ") || null,
        extraPhotos: photos,
      };
    } catch {
      return null;
    }
  },
};

type KufarAdView = {
  ad?: KufarAd;
} & KufarAd;

function imageUrl(img: KufarImage): string {
  if (img.path?.startsWith("http")) return img.path;
  // gallery → 302 на CDN с полным разрешением (нужно для Vision и pHash).
  return `https://rms.kufar.by/v1/gallery/${img.path ?? img.id ?? ""}`;
}

function toNormalized(ad: KufarAd, rates: Rates): NormalizedListing {
  const params = new Map((ad.ad_parameters ?? []).map((p) => [p.p, p]));
  const get = (k: string) => params.get(k);

  const yearStr = String(get("regdate")?.v ?? "");
  const year = /^\d{4}$/.test(yearStr) ? Number(yearStr) : null;
  const mileageVal = get("mileage")?.v;
  const mileageKm =
    typeof mileageVal === "number"
      ? mileageVal
      : /^\d+$/.test(String(mileageVal ?? ""))
        ? Number(mileageVal)
        : null;

  // 1 = автомат, 2 = механика
  const gearbox = String(get("cars_gearbox")?.v ?? "");
  const transmission = gearbox === "1" ? "automatic" : gearbox === "2" ? "mechanical" : null;
  const bodyColor =
    String(get("cars_color")?.vl ?? get("cars_color")?.v ?? "") || null;
  const vinFromParams = String(get("full_vehicle_vin")?.v ?? "") || null;

  const region = String(get("region")?.vl ?? "") || null;
  const area = String(get("area")?.vl ?? "") || null;
  const regionFull = [region, area].filter(Boolean).join(", ") || null;

  // price_usd хранится в копейках USD (790000 = $7900)
  const priceUsdCents = ad.price_usd != null ? Number(ad.price_usd) : null;
  const priceUsd =
    priceUsdCents != null && Number.isFinite(priceUsdCents) ? priceUsdCents / 100 : null;
  const priceBynCents = ad.price_byn != null ? Number(ad.price_byn) : null;
  const priceByn =
    priceBynCents != null && Number.isFinite(priceBynCents) ? priceBynCents / 100 : null;
  const priceUsdFinal =
    priceUsd != null ? toUsd(priceUsd, "USD", rates) : priceByn != null ? toUsd(priceByn, "BYN", rates) : null;

  const photos: RawPhoto[] = (ad.images ?? [])
    .filter((i) => i.path || i.id)
    .map((i) => ({ url: imageUrl(i) }))
    .filter((p) => p.url);

  const description = ad.body ?? ad.body_short ?? null;
  const phoneNorm = description ? extractPhone(description) : null;

  return {
    source: "kufar",
    sourceId: String(ad.ad_id ?? ad.list_id),
    url: ad.ad_link ?? `https://auto.kufar.by/vi/${ad.ad_id ?? ad.list_id}`,
    title: ad.subject ?? "BMW",
    priceUsd: priceUsdFinal,
    priceRaw:
      priceUsd != null ? `${priceUsd} USD` : priceByn != null ? `${priceByn} BYN` : null,
    currencyRaw: ad.currency ?? "USD",
    year,
    mileageKm,
    transmission,
    bodyColor,
    region: regionFull,
    vin: vinFromParams ?? extractVin(description),
    phoneNorm,
    description,
    photos,
    raw: ad,
  };
}

// === types =================================================================

type KufarPage = { ads: KufarAd[]; next: string | null };

type KufarListing = {
  ads?: KufarAd[];
  pagination?: Array<{ label: string; num: number; token: string | null }>;
  total?: number;
};

type KufarAd = {
  ad_id?: number | string;
  list_id?: number | string;
  ad_link?: string;
  subject?: string;
  body?: string;
  body_short?: string;
  category?: number | string;
  currency?: string;
  price_byn?: string | number;
  price_usd?: string | number;
  price_eur?: string | number | null;
  images?: KufarImage[];
  ad_parameters?: Array<{ p: string; v: string | number; vl?: string; pl?: string; pu?: string }>;
};

type KufarImage = {
  id?: string;
  path?: string;
  media_storage?: string;
  yams_storage?: boolean;
};
