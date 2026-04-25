import { fetchWithRetry } from "../lib/http";
import { detectCurrency, extractPhone, extractVin, normalizePhoneBy, parsePrice, toEur } from "./normalize";
import type { NormalizedListing, ScanResult, SourceParser, RawPhoto } from "./types";

// Публичный API kufar.by, используемый их же фронтом.
// Категория 2010 = "Транспорт → Легковые".
// Параметр rgn (region) пустой = вся Беларусь. ms_brand=bmw, ms_model=5er.
// Сортировка lst.d (по дате) — новые сверху.
const BASE = "https://api.kufar.by/search-api/v2/search/rendered-paginated";

// Один запрос отдаёт ~30 объявлений + cursor для следующей страницы.
async function fetchPage(cursor?: string): Promise<{ ads: KufarAd[]; nextCursor: string | null }> {
  const params = new URLSearchParams({
    cat: "2010",
    typ: "sell",
    "ms_brand.eq": "bmw",
    "ms_model.eq": "5er",
    sort: "lst.d",
    lang: "ru",
    size: "30",
  });
  if (cursor) params.set("cursor", cursor);

  const res = await fetchWithRetry(`${BASE}?${params.toString()}`, {
    headers: {
      accept: "application/json",
      origin: "https://www.kufar.by",
      referer: "https://www.kufar.by/",
    },
  });
  if (!res.ok) throw new Error(`kufar ${res.status}`);
  const json = (await res.json()) as KufarResponse;
  return {
    ads: json.ads ?? [],
    nextCursor: json.pagination?.cursors?.next ?? null,
  };
}

export const kufarParser: SourceParser = {
  source: "kufar",
  async scan({ cursor, mode }) {
    const page = await fetchPage(cursor);
    const listings = page.ads.map(toNormalized);
    // в daily-режиме собираем только первую страницу (~30 свежих),
    // в bootstrap — отдаём nextCursor чтобы продолжить
    const next = mode === "bootstrap" ? page.nextCursor : null;
    return { listings, nextCursor: next };
  },
};

function toNormalized(ad: KufarAd): NormalizedListing {
  const params = Object.fromEntries((ad.ad_parameters ?? []).map((p) => [p.p, p]));
  const yearStr = String(params["year"]?.v ?? params["yr"]?.v ?? "");
  const year = /^\d{4}$/.test(yearStr) ? Number(yearStr) : null;
  const mileageStr = String(params["mileage_km"]?.v ?? params["mileage"]?.v ?? "");
  const mileageKm = /^\d+$/.test(mileageStr) ? Number(mileageStr) : null;

  const priceVal = ad.price_byn ? Number(ad.price_byn) / 100 : null;
  const priceEur = priceVal != null ? toEur(priceVal, "BYN") : null;
  const photos: RawPhoto[] = (ad.images ?? [])
    .filter((i) => i.path)
    .map((i) => ({ url: imageUrl(i) }));

  const phoneNorm = ad.phone ? normalizePhoneBy(ad.phone) : extractPhone(ad.body ?? null);
  const description = ad.body ?? null;

  return {
    source: "kufar",
    sourceId: String(ad.ad_id),
    url: ad.ad_link ?? `https://www.kufar.by/item/${ad.ad_id}`,
    title: ad.subject ?? "(без названия)",
    priceEur,
    priceRaw: priceVal != null ? `${priceVal} BYN` : null,
    currencyRaw: "BYN",
    year,
    mileageKm,
    transmission: String(params["transmission"]?.v ?? "") || null,
    bodyColor: String(params["color"]?.v ?? "") || null,
    region: ad.region_name ?? ad.area_name ?? null,
    vin: extractVin(description),
    phoneNorm,
    description,
    photos,
    raw: ad,
  };
}

function imageUrl(img: KufarImage): string {
  if (img.path?.startsWith("http")) return img.path;
  // pattern: https://rms.kufar.by/v1/list_thumbs_2x/<path>
  const tail = img.path ?? img.id ?? "";
  return `https://rms.kufar.by/v1/gallery/${tail}`;
}

// === API types (минимальные, ровно то что используем) ========================

type KufarResponse = {
  ads?: KufarAd[];
  pagination?: { cursors?: { next?: string | null } };
};

type KufarAd = {
  ad_id: number | string;
  ad_link?: string;
  subject?: string;
  body?: string;
  price_byn?: string | number;
  region_name?: string;
  area_name?: string;
  phone?: string;
  images?: KufarImage[];
  ad_parameters?: Array<{ p: string; v: string | number }>;
};

type KufarImage = { id?: string; path?: string; media_storage?: string };

// helper for price without raw byn if currency unknown — kept for future use
export const _parsePrice = parsePrice;
export const _detectCurrency = detectCurrency;
