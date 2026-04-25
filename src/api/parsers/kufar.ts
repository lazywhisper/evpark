import { fetchWithRetry } from "../lib/http";
import { extractPhone, extractVin, toEur } from "./normalize";
import type { NormalizedListing, RawPhoto, ScanResult, SourceParser } from "./types";

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
  async scan({ cursor, mode }) {
    const { slug, token } = parseCursor(cursor);
    const page = await fetchSlug(slug, token);
    const listings = page.ads.map(toNormalized);
    return { listings, nextCursor: nextCursor(slug, page, mode) } satisfies ScanResult;
  },
};

function imageUrl(img: KufarImage): string {
  if (img.path?.startsWith("http")) return img.path;
  // gallery → 302 на CDN с полным разрешением (нужно для Vision и pHash).
  return `https://rms.kufar.by/v1/gallery/${img.path ?? img.id ?? ""}`;
}

function toNormalized(ad: KufarAd): NormalizedListing {
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
  const priceEur =
    priceUsd != null ? toEur(priceUsd, "USD") : priceByn != null ? toEur(priceByn, "BYN") : null;

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
    priceEur,
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
