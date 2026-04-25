import { fetchWithRetry } from "../lib/http";
import { extractPhone, extractVin, toEur } from "./normalize";
import type { NormalizedListing, ScanResult, SourceParser } from "./types";

// ar.onliner.by — старая Барахолка автомобилей (слиты в "Автобарахолку").
// Публичный JSON: ar.onliner.by/sdapi/ar.api/search/vehicles
// car[manufacturer]=22 (BMW), car[model]=4218 (5 серия). ID-шники нашёл в их фронтенде.
const BASE = "https://ar.onliner.by/sdapi/ar.api/search/vehicles";
const BMW_BRAND_ID = 22;
const BMW_5_MODEL_ID = 4218;

async function fetchPage(page: number) {
  const params = new URLSearchParams({
    "car[0][manufacturer]": String(BMW_BRAND_ID),
    "car[0][model]": String(BMW_5_MODEL_ID),
    "car[0][generation]": "318", // E39
    "currency": "USD",
    "order": "created_at:desc",
    "page": String(page),
  });
  const res = await fetchWithRetry(`${BASE}?${params.toString()}`, {
    headers: {
      accept: "application/json",
      origin: "https://ar.onliner.by",
      referer: "https://ar.onliner.by/",
    },
  });
  if (!res.ok) throw new Error(`onliner ${res.status}`);
  return (await res.json()) as OnlinerResponse;
}

export const onlinerParser: SourceParser = {
  source: "onliner",
  async scan({ cursor, mode }) {
    const page = cursor ? Number(cursor) : 1;
    const json = await fetchPage(page);
    const listings = (json.adverts ?? []).map(toNormalized);
    const totalPages = json.page?.last ?? 1;
    const next = mode === "bootstrap" && page < totalPages ? String(page + 1) : null;
    return { listings, nextCursor: next } satisfies ScanResult;
  },
};

function toNormalized(a: OnlinerAdvert): NormalizedListing {
  const usd = a.price?.converted?.USD?.amount ?? a.price?.amount ?? null;
  const priceEur = usd != null ? toEur(Number(usd), "USD") : null;
  return {
    source: "onliner",
    sourceId: String(a.id),
    url: a.html_url ?? `https://ar.onliner.by/car/${a.id}`,
    title: `${a.specs?.manufacturer?.name ?? ""} ${a.specs?.model?.name ?? ""} ${a.specs?.year ?? ""}`.trim() || `BMW 5er`,
    priceEur,
    priceRaw: usd != null ? `${usd} USD` : null,
    currencyRaw: "USD",
    year: a.specs?.year ?? null,
    mileageKm: a.specs?.odometer?.value ?? null,
    transmission: a.specs?.transmission ?? null,
    bodyColor: a.specs?.color ?? null,
    region: a.location?.region ?? a.location?.address ?? null,
    vin: extractVin(a.description ?? null),
    phoneNorm: extractPhone(a.description ?? null),
    description: a.description ?? null,
    photos: (a.photos ?? []).map((p) => ({ url: p.large ?? p.medium ?? p.small ?? "" })).filter((p) => p.url),
    raw: a,
  };
}

type OnlinerResponse = {
  adverts?: OnlinerAdvert[];
  page?: { current: number; last: number };
};

type OnlinerAdvert = {
  id: number;
  html_url?: string;
  description?: string;
  specs?: {
    manufacturer?: { name?: string };
    model?: { name?: string };
    year?: number;
    odometer?: { value?: number };
    transmission?: string;
    color?: string;
  };
  price?: {
    amount?: string | number;
    converted?: Record<string, { amount: string | number }>;
  };
  location?: { region?: string; address?: string };
  photos?: Array<{ small?: string; medium?: string; large?: string }>;
};
