import { fetchWithRetry } from "../lib/http";
import { extractVin, normalizePhoneBy, toEur } from "./normalize";
import type { NormalizedListing, RawPhoto, ScanResult, SourceParser } from "./types";

// Автобарахолка переехала с ar.onliner.by на ab.onliner.by.
// API: ab.onliner.by/sdapi/ab.api/search/vehicles
// ID-шники брал из реального ответа /manufacturers и /search:
//   manufacturer  = 5     (BMW)
//   model         = 3075  (5 серия)
//   generation    = 6264  (E39 рестайлинг), 6265 (E39 дорест)
const BASE = "https://ab.onliner.by/sdapi/ab.api/search/vehicles";
const BMW = 5;
const MODEL_5_SERIES = 3075;
const E39_FACELIFT = 6264;
const E39_PREFACELIFT = 6265;

type Generation = typeof E39_FACELIFT | typeof E39_PREFACELIFT;

async function fetchPage(generation: Generation, page: number): Promise<OnlinerResponse> {
  const params = new URLSearchParams();
  params.set("car[0][manufacturer]", String(BMW));
  params.set("car[0][model]", String(MODEL_5_SERIES));
  params.set("car[0][generation]", String(generation));
  params.set("page", String(page));
  const res = await fetchWithRetry(`${BASE}?${params.toString()}`, {
    headers: {
      accept: "application/json",
      origin: "https://ab.onliner.by",
      referer: "https://ab.onliner.by/bmw/5-seriya/e39-restayling",
    },
  });
  if (!res.ok) throw new Error(`onliner ${res.status}`);
  return (await res.json()) as OnlinerResponse;
}

// Cursor format: "<gen>:<page>". Bootstrap walks facelift → pre-facelift; daily — только facelift, страница 1.
function parseCursor(cursor: string | undefined): { gen: Generation; page: number } {
  if (!cursor) return { gen: E39_FACELIFT, page: 1 };
  const [genStr, pageStr] = cursor.split(":");
  const gen = Number(genStr) === E39_PREFACELIFT ? E39_PREFACELIFT : E39_FACELIFT;
  const page = Math.max(1, Number(pageStr) || 1);
  return { gen, page };
}

function nextCursor(
  cur: { gen: Generation; page: number },
  json: OnlinerResponse,
  mode: "daily" | "bootstrap",
): string | null {
  if (mode !== "bootstrap") return null;
  const last = json.page?.last ?? 1;
  if (cur.page < last) return `${cur.gen}:${cur.page + 1}`;
  if (cur.gen === E39_FACELIFT) return `${E39_PREFACELIFT}:1`;
  return null;
}

export const onlinerParser: SourceParser = {
  source: "onliner",
  async scan({ cursor, mode }) {
    const { gen, page } = parseCursor(cursor);
    const json = await fetchPage(gen, page);
    const listings = (json.adverts ?? []).map(toNormalized);
    return { listings, nextCursor: nextCursor({ gen, page }, json, mode) } satisfies ScanResult;
  },
};

function toNormalized(a: OnlinerAdvert): NormalizedListing {
  const eur = a.price?.converted?.EUR?.amount;
  const usd = a.price?.converted?.USD?.amount;
  const priceEur =
    eur != null ? Math.round(Number(eur)) : usd != null ? toEur(Number(usd), "USD") : null;

  const photos: RawPhoto[] = (a.images ?? [])
    .map((img) => ({ url: img["lg@x2"] ?? img["lg@x1"] ?? img.original ?? "" }))
    .filter((p) => p.url);

  const region = a.location?.region?.name ?? a.location?.city?.name ?? null;
  const phoneFromSeller = a.seller?.phones?.find((p) => /\d/.test(p) && !p.includes("*"));
  const phoneNorm = phoneFromSeller ? normalizePhoneBy(phoneFromSeller) : null;

  // Список не отдаёт description — Vision получит фото, текстовый scoring возьмёт title.
  const title =
    `${a.manufacturer?.name ?? "BMW"} ${a.model?.name ?? "5"} ${a.generation?.name ?? ""} ${a.specs?.modification ?? ""}`
      .replace(/\s+/g, " ")
      .trim();

  return {
    source: "onliner",
    sourceId: String(a.id),
    url: a.html_url ?? `https://ab.onliner.by/bmw/5-seriya/${a.id}`,
    title,
    priceEur,
    priceRaw: usd != null ? `${usd} USD` : eur != null ? `${eur} EUR` : null,
    currencyRaw: a.price?.currency ?? null,
    year: a.specs?.year ?? null,
    mileageKm: a.specs?.odometer?.value ?? null,
    transmission: a.specs?.transmission ?? null,
    bodyColor: a.specs?.color ?? null,
    region,
    vin: extractVin(title),
    phoneNorm,
    description: null,
    photos,
    raw: a,
  };
}

type OnlinerResponse = {
  adverts?: OnlinerAdvert[];
  page?: { current: number; last: number };
  total?: number;
};

type OnlinerAdvert = {
  id: number;
  title?: string;
  html_url?: string;
  url?: string;
  manufacturer?: { id: number; name: string; slug?: string };
  model?: { id: number; name: string; slug?: string };
  generation?: { id: number; name: string; slug?: string };
  specs?: {
    year?: number;
    color?: string;
    transmission?: string;
    modification?: string;
    odometer?: { value?: number; unit?: string };
    has_vin?: boolean;
  };
  price?: {
    amount?: string | number;
    currency?: string;
    converted?: Record<string, { amount: string | number; currency: string }>;
  };
  location?: {
    country?: { id?: number; name?: string };
    region?: { id?: number; name?: string };
    city?: { id?: number; name?: string };
  };
  seller?: { phones?: string[]; type?: string };
  images?: Array<Record<string, string>>;
};
