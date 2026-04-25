import type { Env } from "../env";
import { fetchWithRetry } from "../lib/http";
import { extractPhone, extractVin, parsePrice, toEur } from "./normalize";
import type { NormalizedListing, RawPhoto, ScanResult, SourceParser } from "./types";

// av.by защищён Cloudflare Bot Management. Исходящие IP Cloudflare Workers
// почти наверняка получат challenge от того же CF. Стратегия:
//   1. Пробуем напрямую (вдруг повезёт — иногда отдаёт без challenge на /api).
//   2. Если есть SCRAPFLY_KEY — идём через ScrapFly (asp=true, render_js=true).
//   3. Если есть FLY_FALLBACK_URL — идём в свой Camoufox-контейнер.
//   4. Иначе — пропускаем источник и логируем предупреждение.
//
// av.by фронт использует JSON эндпоинт /api/v1/items?brand=2&model=259&generation=2701
// (числовые ID для BMW 5er E39). Подтвердить вручную из DevTools при первой настройке.

const BASE = "https://av.by/api/v1/items";
const BMW_BRAND = 2;
const BMW_5_MODEL = 259;
const E39_GENERATION = 2701;

async function rawFetch(env: Env, url: string, headers: Record<string, string>): Promise<string | null> {
  // Strategy 1: direct
  try {
    const res = await fetchWithRetry(url, { headers, retries: 1 });
    if (res.ok) return await res.text();
    if (res.status !== 403 && res.status !== 503 && res.status !== 468) return null;
  } catch {
    // fallthrough
  }

  // Strategy 2: ScrapFly
  if (env.SCRAPFLY_KEY) {
    const sf = new URL("https://api.scrapfly.io/scrape");
    sf.searchParams.set("key", env.SCRAPFLY_KEY);
    sf.searchParams.set("url", url);
    sf.searchParams.set("asp", "true");
    sf.searchParams.set("country", "by,pl,lt");
    sf.searchParams.set("render_js", "false");
    const res = await fetchWithRetry(sf.toString(), { retries: 1, timeoutMs: 60_000 });
    if (res.ok) {
      const json = (await res.json()) as { result?: { content?: string } };
      return json.result?.content ?? null;
    }
  }

  // Strategy 3: Fly.io fallback
  if (env.FLY_FALLBACK_URL && env.FLY_FALLBACK_HMAC) {
    const body = JSON.stringify({ url, headers });
    const sig = await hmac(env.FLY_FALLBACK_HMAC, body);
    const res = await fetchWithRetry(env.FLY_FALLBACK_URL, {
      method: "POST",
      headers: { "content-type": "application/json", "x-signature": sig },
      body,
      timeoutMs: 60_000,
      retries: 1,
    });
    if (res.ok) {
      const json = (await res.json()) as { content?: string };
      return json.content ?? null;
    }
  }

  console.warn("[avby] all fetch strategies failed for", url);
  return null;
}

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function makeAvbyParser(env: Env): SourceParser {
  return {
    source: "av",
    async scan({ cursor, mode }) {
      const page = cursor ? Number(cursor) : 1;
      const params = new URLSearchParams({
        "brands[0][brand]": String(BMW_BRAND),
        "brands[0][model]": String(BMW_5_MODEL),
        "brands[0][generation]": String(E39_GENERATION),
        "page": String(page),
        "sort": "1",
      });
      const url = `${BASE}?${params.toString()}`;
      const headers = {
        accept: "application/json",
        origin: "https://cars.av.by",
        referer: "https://cars.av.by/",
      };
      const text = await rawFetch(env, url, headers);
      if (!text) return { listings: [], nextCursor: null } satisfies ScanResult;

      let json: AvbyResponse;
      try {
        json = JSON.parse(text) as AvbyResponse;
      } catch {
        return { listings: [], nextCursor: null };
      }
      const listings = (json.adverts ?? []).map(toNormalized);
      const totalPages = json.pagination?.pageCount ?? 1;
      const next = mode === "bootstrap" && page < totalPages ? String(page + 1) : null;
      return { listings, nextCursor: next };
    },
  };
}

function toNormalized(a: AvbyAdvert): NormalizedListing {
  const usd = a.price?.usd?.amount ?? null;
  const byn = a.price?.byn?.amount ?? null;
  const priceEur = usd != null ? toEur(Number(usd), "USD") : byn != null ? toEur(Number(byn), "BYN") : null;

  const photos: RawPhoto[] = (a.photos ?? [])
    .map((p) => ({ url: p.big?.url ?? p.medium?.url ?? p.small?.url ?? "" }))
    .filter((x) => x.url);

  const desc = a.description ?? null;

  return {
    source: "av",
    sourceId: String(a.id),
    url: a.publicUrl ?? `https://cars.av.by/bmw/5-series/${a.id}`,
    title: `${a.metadata?.brandName ?? "BMW"} ${a.metadata?.modelName ?? "5er"} ${a.metadata?.year ?? ""}`.trim(),
    priceEur,
    priceRaw: usd != null ? `${usd} USD` : byn != null ? `${byn} BYN` : null,
    currencyRaw: usd != null ? "USD" : byn != null ? "BYN" : null,
    year: a.metadata?.year ?? null,
    mileageKm: a.metadata?.mileage ?? null,
    transmission: a.metadata?.transmissionTypeName ?? null,
    bodyColor: a.metadata?.colorName ?? null,
    region: a.locationName ?? a.metadata?.locationName ?? null,
    vin: a.vin ?? extractVin(desc),
    phoneNorm: extractPhone(desc),
    description: desc,
    photos,
    raw: a,
  };
}

type AvbyResponse = {
  adverts?: AvbyAdvert[];
  pagination?: { pageCount?: number };
};

type AvbyAdvert = {
  id: number;
  publicUrl?: string;
  description?: string;
  vin?: string;
  locationName?: string;
  price?: {
    usd?: { amount: string | number };
    byn?: { amount: string | number };
  };
  metadata?: {
    brandName?: string;
    modelName?: string;
    year?: number;
    mileage?: number;
    transmissionTypeName?: string;
    colorName?: string;
    locationName?: string;
  };
  photos?: Array<{
    small?: { url: string };
    medium?: { url: string };
    big?: { url: string };
  }>;
};

export const _parsePrice = parsePrice;
