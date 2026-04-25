import puppeteer from "@cloudflare/puppeteer";
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

// av.by защищён Cloudflare Bot Management. Идём через ScrapFly.
//
// SEO-URL `/bmw/5-seriya/<gen-slug>` отдаёт 25 карточек + total. Pagination
// в виде `?page=N` НЕ работает (всегда возвращает первую страницу). Кнопка
// "Показать ещё" ведёт на /filter URL с подвешенными параметрами; без
// session/cookie /filter возвращает generic-страницу всех авто.
//
// Поэтому работаем по упрощённой схеме:
//   - Берём первые 25 карточек facelift
//   - В bootstrap — переходим на pre-facelift slug
//   - Дальше pagination не делаем (получаем 25 facelift + 25 pre-facelift = 50)
//
// 50 объявлений с av.by лучше чем 0. Если позже найдём способ пагинации
// (rendered_js + click "Показать ещё" в ScrapFly), вернёмся к большим объёмам.

const FACELIFT_SLUG = "e39-restajling-2000-2004";
const PREFACELIFT_SLUG = "e39-1995-2000";
type Slug = typeof FACELIFT_SLUG | typeof PREFACELIFT_SLUG;

function buildUrl(slug: Slug): string {
  return `https://cars.av.by/bmw/5-seriya/${slug}`;
}

async function browserFetchAllCards(env: Env, url: string, maxClicks = 30): Promise<string | null> {
  // Cloudflare Browser Rendering: открываем SEO URL, кликаем "Показать ещё"
  // пока не закончатся объявления. Возвращаем итоговый HTML.
  if (!env.BROWSER) return null;
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;
  try {
    browser = await puppeteer.launch(env.BROWSER);
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );
    await page.goto(url, { waitUntil: "networkidle0", timeout: 30_000 });
    // Кликаем "Показать ещё" пока кнопка существует
    for (let i = 0; i < maxClicks; i++) {
      const btn = await page.$(".paging__button a");
      if (!btn) break;
      try {
        await btn.click();
        // Ждём пока появятся новые карточки
        await page.waitForFunction(
          (oldCount: number) =>
            document.querySelectorAll(".listing-item__wrap").length > oldCount,
          { timeout: 10_000, polling: 500 },
          (await page.$$(".listing-item__wrap")).length,
        );
      } catch {
        break;
      }
    }
    const html = await page.content();
    return html;
  } catch (err) {
    console.warn("[avby] browser-rendering failed:", err);
    return null;
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {
        // ignore
      }
    }
  }
}

async function rawFetch(env: Env, url: string): Promise<string | null> {
  // Strategy 1: Cloudflare Browser Rendering — кликает "Показать ещё" чтобы
  // собрать всю выдачу. Платная фича Workers (включена при BROWSER binding).
  const browserHtml = await browserFetchAllCards(env, url);
  if (browserHtml) return browserHtml;

  // Strategy 2: ScrapFly (fallback — может быть исчерпан квотой)
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
  // Описание: блок .card__comment-text внутри .card__comment-body.
  const descBlock = root.querySelector(".card__comment-text");
  const descParagraphs = descBlock
    ? descBlock.querySelectorAll("p").map((p) => p.text.trim()).filter(Boolean)
    : [];
  let description = descParagraphs.length > 0 ? descParagraphs.join("\n\n") : descBlock?.text?.trim() ?? null;

  // Дополнительно подкладываем перечень опций (комплектация) — это тоже сигнал для текста.
  const optsTitle = root.querySelectorAll(".card__options-category").map((e) => e.text.trim());
  const optsItems = root.querySelectorAll(".card__options li").map((e) => e.text.trim());
  if (optsTitle.length > 0 || optsItems.length > 0) {
    const optsLine = optsItems.slice(0, 50).join(", ");
    if (description) description = `${description}\n\n[комплектация]\n${optsLine}`;
    else description = `[комплектация]\n${optsLine}`;
  }

  // VIN
  const vinBlock = root.querySelector("[data-vin]") || root.querySelector(".vin");
  const vin = vinBlock?.getAttribute("data-vin") || extractVin(description ?? "");

  // Фото
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
