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
  SourceParser,
} from "./types";

// av.by защищён Cloudflare Bot Management — только ScrapFly (residential proxy)
// проходит надёжно.
//
// SEO-URL `/bmw/5-seriya/<gen-slug>` отдаёт 25 карточек. Pagination через
// ?page=N не работает (всегда первая страница). Поэтому:
//   - daily: берём 25 facelift карточек
//   - bootstrap: facelift (25) → pre-facelift (25) = 50 итого

const FACELIFT_SLUG = "e39-restajling-2000-2004";
const PREFACELIFT_SLUG = "e39-1995-2000";
type Slug = typeof FACELIFT_SLUG | typeof PREFACELIFT_SLUG;

function buildUrl(slug: Slug): string {
  return `https://cars.av.by/bmw/5-seriya/${slug}`;
}

async function rawFetch(env: Env, url: string): Promise<string | null> {
  // Strategy 1: ScrapFly с residential proxy + ASP bypass
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
        if (json.result?.status_code && json.result.status_code >= 400) {
          console.warn("[avby] scrapfly returned", json.result.status_code, "for", url);
          return null;
        }
        if (json.result?.content) return json.result.content;
      }
    } catch (err) {
      console.warn("[avby] scrapfly error:", err);
    }
  }

  // Strategy 2: прямой запрос с браузерными заголовками (редко проходит CF BM)
  try {
    const res = await fetchWithRetry(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "ru-BY,ru;q=0.9,en;q=0.8",
        "cache-control": "no-cache",
      },
      retries: 1,
    });
    if (res.ok) {
      const html = await res.text();
      // Если Cloudflare вернул challenge-страницу — отбрасываем
      if (!html.includes("cf-browser-verification") && html.includes("listing-item")) {
        return html;
      }
    }
  } catch {
    // ignore
  }

  console.warn("[avby] all fetch strategies failed for", url);
  return null;
}

function parseCursor(cursor: string | undefined): Slug {
  if (cursor === PREFACELIFT_SLUG) return PREFACELIFT_SLUG;
  return FACELIFT_SLUG;
}

function nextCursor(slug: Slug, mode: "daily" | "bootstrap"): string | null {
  if (mode !== "bootstrap") return null;
  return slug === FACELIFT_SLUG ? PREFACELIFT_SLUG : null;
}

export function makeAvbyParser(env: Env): SourceParser {
  return {
    source: "av",
    async scan({ cursor, mode, rates }) {
      const slug = parseCursor(cursor);
      const html = await rawFetch(env, buildUrl(slug));
      if (!html) return { listings: [], nextCursor: null };
      const { items } = parseListPage(html, rates);
      return { listings: items, nextCursor: nextCursor(slug, mode) };
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
  const descBlock = root.querySelector(".card__comment-text");
  const descParagraphs = descBlock
    ? descBlock.querySelectorAll("p").map((p) => p.text.trim()).filter(Boolean)
    : [];
  let description = descParagraphs.length > 0 ? descParagraphs.join("\n\n") : descBlock?.text?.trim() ?? null;

  const optsItems = root.querySelectorAll(".card__options li").map((e) => e.text.trim());
  if (optsItems.length > 0) {
    const optsLine = optsItems.slice(0, 50).join(", ");
    if (description) description = `${description}\n\n[комплектация]\n${optsLine}`;
    else description = `[комплектация]\n${optsLine}`;
  }

  const vinBlock = root.querySelector("[data-vin]") || root.querySelector(".vin");
  const vin = vinBlock?.getAttribute("data-vin") || extractVin(description ?? "");

  const photos: RawPhoto[] = root
    .querySelectorAll("img.gallery__img, .gallery img, .card-gallery img, img[data-src*='avcdn']")
    .map((img) => {
      const dataSrcset = img.getAttribute("data-srcset") || "";
      const dataSrc = img.getAttribute("data-src") || img.getAttribute("src") || "";
      const x2 = dataSrcset.match(/(https:\/\/avcdn\.av\.by\/[^\s"]+)/);
      return { url: x2?.[1] ?? dataSrc };
    })
    .filter((p) => p.url.startsWith("http") && /avcdn\.av\.by/.test(p.url));

  const region =
    root.querySelector(".card__location")?.text?.trim() ||
    root.querySelector(".advert-info__region")?.text?.trim() ||
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
      const x2 = dataSrcset.match(/(https:\/\/avcdn\.av\.by\/[^\s"]+)/);
      return { url: x2?.[1] ?? dataSrc };
    })
    .filter((p) => p.url && p.url.startsWith("http"));

  const vin = extractVin(description);

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
    raw: { id: sourceId },
  };
}
