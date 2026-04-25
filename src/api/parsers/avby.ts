import { parse } from "node-html-parser";
import type { Env } from "../env";
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

// av.by защищён Cloudflare Bot Management. Прямой fetch с CF Workers получает
// 503/468. JSON-эндпоинт /api/v1/items больше не отдаёт listing'и для нашего
// поколения, но HTML-страница `/filter?brands[0][brand]=8&...&page=N` отдаёт
// 24 карточки на страницу с разметкой listing-item__*. Парсим через ScrapFly.
//
// SEO-URL `/bmw/5-seriya/e39-restajling-2000-2004` параметр page игнорирует —
// нужен именно `/filter?...&page=N`.
//
// Cursor format: "<gen>:<page>". Bootstrap идёт facelift → pre-facelift.
// Daily — только первая страница facelift.

const BMW = 8;
const MODEL_5_SERIES = 5865;
const E39_FACELIFT = 12786; // (E39) Рестайлинг 2000-2004
const E39_PREFACELIFT = 4439; // E39 1995-2000

type Generation = typeof E39_FACELIFT | typeof E39_PREFACELIFT;

function buildUrl(generation: Generation, page: number): string {
  const params = new URLSearchParams();
  params.set("brands[0][brand]", String(BMW));
  params.set("brands[0][model]", String(MODEL_5_SERIES));
  params.set("brands[0][generation]", String(generation));
  if (page > 1) params.set("page", String(page));
  return `https://cars.av.by/filter?${params.toString()}`;
}

async function rawFetch(env: Env, url: string): Promise<string | null> {
  // Strategy 1: ScrapFly (основной канал — без него av.by нам недоступен)
  if (env.SCRAPFLY_KEY) {
    const sf = new URL("https://api.scrapfly.io/scrape");
    sf.searchParams.set("key", env.SCRAPFLY_KEY);
    sf.searchParams.set("url", url);
    sf.searchParams.set("asp", "true");
    sf.searchParams.set("country", "by,pl,lt");
    sf.searchParams.set("render_js", "false");
    try {
      const res = await fetchWithRetry(sf.toString(), { retries: 1, timeoutMs: 60_000 });
      if (res.ok) {
        const json = (await res.json()) as { result?: { content?: string; status_code?: number } };
        if (json.result?.status_code && json.result.status_code >= 400) return null;
        return json.result?.content ?? null;
      }
    } catch (err) {
      console.warn("[avby] scrapfly failed:", err);
    }
  }

  // Strategy 2: пробуем прямо (на случай если когда-нибудь повезёт)
  try {
    const res = await fetchWithRetry(url, {
      headers: { accept: "text/html", "user-agent": "Mozilla/5.0" },
      retries: 1,
    });
    if (res.ok) return await res.text();
  } catch {
    // ignore
  }

  console.warn("[avby] all fetch strategies failed for", url);
  return null;
}

function parseCursor(cursor: string | undefined): { gen: Generation; page: number } {
  if (!cursor) return { gen: E39_FACELIFT, page: 1 };
  const idx = cursor.indexOf(":");
  if (idx < 0) return { gen: E39_FACELIFT, page: Math.max(1, Number(cursor) || 1) };
  const gen = Number(cursor.slice(0, idx)) === E39_PREFACELIFT ? E39_PREFACELIFT : E39_FACELIFT;
  return { gen, page: Math.max(1, Number(cursor.slice(idx + 1)) || 1) };
}

function nextCursor(
  cur: { gen: Generation; page: number },
  total: number,
  pageSize: number,
  mode: "daily" | "bootstrap",
): string | null {
  if (mode !== "bootstrap") return null;
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  if (cur.page < lastPage) return `${cur.gen}:${cur.page + 1}`;
  if (cur.gen === E39_FACELIFT) return `${E39_PREFACELIFT}:1`;
  return null;
}

export function makeAvbyParser(env: Env): SourceParser {
  return {
    source: "av",
    async scan({ cursor, mode, rates }) {
      const cur = parseCursor(cursor);
      const html = await rawFetch(env, buildUrl(cur.gen, cur.page));
      if (!html) return { listings: [], nextCursor: null };
      const { items, total } = parseListPage(html, rates);
      return { listings: items, nextCursor: nextCursor(cur, total, 24, mode) };
    },
    async fetchDetail(sourceId, url): Promise<ListingDetail | null> {
      const detailUrl = url.startsWith("http") ? url : `https://cars.av.by/bmw/5-seriya/${sourceId}`;
      const html = await rawFetch(env, detailUrl);
      if (!html) return null;
      return parseDetailPage(html);
    },
  };
}

function parseDetailPage(html: string): ListingDetail {
  const root = parse(html);
  // Описание: блок ".advert-info__description" или meta og:description
  const descBlock =
    root.querySelector(".advert-description__text") ||
    root.querySelector(".js-description") ||
    root.querySelector("[itemprop='description']");
  const description = descBlock?.text?.trim() || null;

  // VIN: либо в meta-блоках, либо в badge
  const vinBlock = root.querySelector("[data-vin]") || root.querySelector(".vin");
  const vin = vinBlock?.getAttribute("data-vin") || extractVin(description ?? "");

  // Фото детальной — больше превью из карусели
  const photos: RawPhoto[] = root
    .querySelectorAll("img.gallery__img, .gallery img, .carousel__wrapper img")
    .map((img) => {
      const dataSrc = img.getAttribute("data-src") || img.getAttribute("src") || "";
      return { url: dataSrc };
    })
    .filter((p) => p.url.startsWith("http") && /avcdn\.av\.by/.test(p.url));

  const region =
    root.querySelector(".advert-info__region")?.text?.trim() ||
    root.querySelector(".advert__location")?.text?.trim() ||
    null;

  return {
    description,
    vin,
    phoneNorm: extractPhone(description ?? ""),
    region,
    extraPhotos: photos,
  };
}

function parseListPage(html: string, rates: Rates): { items: NormalizedListing[]; total: number } {
  const root = parse(html);
  const cards = root.querySelectorAll(".listing-item__wrap");
  const items: NormalizedListing[] = [];
  for (const card of cards) {
    const item = parseCard(card, rates);
    if (item) items.push(item);
  }
  // Найти "317 объявлений" в тексте
  const totalMatch = root.text.match(/(\d[\d\s]*)\s*объявлен/u);
  const total = totalMatch ? Number(totalMatch[1]!.replace(/\s/g, "")) : items.length;
  return { items, total };
}

function parseCard(card: ReturnType<ReturnType<typeof parse>["querySelector"]> & {}, rates: Rates): NormalizedListing | null {
  if (!card) return null;
  const linkEl = card.querySelector(".listing-item__link");
  const href = linkEl?.getAttribute("href");
  const idMatch = href?.match(/\/bmw\/5-seriya\/(\d+)/);
  if (!href || !idMatch) return null;
  const sourceId = idMatch[1]!;

  const title = (linkEl?.text || "BMW 5 серия").replace(/\s+/g, " ").trim();
  const url = href.startsWith("http") ? href : `https://cars.av.by${href}`;

  // params: [ "2001 г.", "автомат, 2,5 л, дизель, седан", "417 000 км" ]
  const params = card.querySelectorAll(".listing-item__params > div").map((d) => d.text.trim());
  const yearMatch = params[0]?.match(/(\d{4})/);
  const year = yearMatch ? Number(yearMatch[1]) : null;
  const transmission = /автомат/i.test(params[1] ?? "")
    ? "automatic"
    : /механ/i.test(params[1] ?? "")
      ? "mechanical"
      : null;
  const mileageMatch = params[2]?.match(/(\d[\d\s]*)/u);
  const mileageKm = mileageMatch ? Number(mileageMatch[1]!.replace(/\s/g, "")) : null;

  const priceText = card.querySelector(".listing-item__price-primary")?.text || "";
  const priceMatch = priceText.match(/(\d[\d\s]*)/u);
  const priceByn = priceMatch ? Number(priceMatch[1]!.replace(/\s/g, "")) : null;
  const priceUsd = priceByn != null ? toUsd(priceByn, "BYN", rates) : null;

  const region = card.querySelector(".listing-item__location")?.text?.trim() || null;
  const description = card.querySelector(".listing-item__message")?.text?.trim() || null;

  const photos: RawPhoto[] = card
    .querySelectorAll(".carousel__wrapper img")
    .map((img) => {
      const dataSrcset = img.getAttribute("data-srcset") || "";
      const dataSrc = img.getAttribute("data-src") || "";
      // Берём 2x (advertmedium) если есть, иначе 1x (advertpreview)
      const x2 = dataSrcset.match(/(https:\/\/avcdn\.av\.by\/[^\s"]+)/);
      return { url: x2?.[1] ?? dataSrc };
    })
    .filter((p) => p.url && p.url.startsWith("http"));

  const hasVinBadge = card.querySelectorAll(".badge").some((b) => /vin/i.test(b.text));
  const vin = hasVinBadge ? extractVin(description) : extractVin(description);

  return {
    source: "av",
    sourceId,
    url,
    title,
    priceUsd,
    priceRaw: priceByn != null ? `${priceByn} BYN` : null,
    currencyRaw: "BYN",
    year,
    mileageKm,
    transmission,
    bodyColor: null,
    region,
    vin,
    phoneNorm: extractPhone(description),
    description,
    photos,
    raw: { id: sourceId, hasVinBadge },
  };
}
