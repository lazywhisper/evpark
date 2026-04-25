import { XMLParser } from "fast-xml-parser";
import { parse } from "node-html-parser";
import { fetchWithRetry } from "../lib/http";
import type { Rates } from "../lib/rates";
import { toUsd } from "../lib/rates";
import { extractPhone, extractVin, parsePrice } from "./normalize";
import type { NormalizedListing, RawPhoto, ScanResult, SourceParser } from "./types";

// abw.by — sitemap.xml содержит индекс sub-sitemap'ов;
// нас интересуют те, что для объявлений авто (cars/<id>).
// HTML страницы /cars/<id> публично доступны (robots запрещает /car/, не /cars/).
const ROOT_SITEMAP = "https://abw.by/sitemap.xml";
const xml = new XMLParser();

async function listSitemaps(): Promise<string[]> {
  const res = await fetchWithRetry(ROOT_SITEMAP);
  if (!res.ok) throw new Error(`abw sitemap ${res.status}`);
  const root = xml.parse(await res.text()) as { sitemapindex?: { sitemap?: Array<{ loc: string }> | { loc: string } } };
  const arr = root.sitemapindex?.sitemap;
  const list = Array.isArray(arr) ? arr : arr ? [arr] : [];
  return list.map((s) => s.loc).filter((u) => /cars?[-_]?(?:ads|adverts|sitemap)/i.test(u));
}

async function listAdUrls(sitemapUrl: string): Promise<string[]> {
  const res = await fetchWithRetry(sitemapUrl);
  if (!res.ok) throw new Error(`abw subsitemap ${res.status}`);
  const root = xml.parse(await res.text()) as { urlset?: { url?: Array<{ loc: string }> | { loc: string } } };
  const arr = root.urlset?.url;
  const list = Array.isArray(arr) ? arr : arr ? [arr] : [];
  return list.map((u) => u.loc).filter((u) => /\/cars\/\d+/.test(u));
}

async function fetchDetail(url: string, rates: Rates): Promise<NormalizedListing | null> {
  const res = await fetchWithRetry(url);
  if (!res.ok) return null;
  const html = await res.text();
  const root = parse(html);

  const title = root.querySelector("h1")?.text?.trim() || "BMW";
  // ABW кладёт ключевые поля в dl/dt/dd блоки и в meta-теги
  const ogTitle = root.querySelector('meta[property="og:title"]')?.getAttribute("content") ?? title;
  const description = root.querySelector(".js-description, .description, [itemprop='description']")?.text?.trim() ?? null;
  const priceText = root.querySelector(".price, .ads-price, [itemprop='price']")?.text?.trim() ?? null;
  const parsed = parsePrice(priceText ?? "");
  const priceUsd = parsed ? toUsd(parsed.value, parsed.currency, rates) : null;

  const specText = root.text;
  const yearMatch = specText.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? Number(yearMatch[0]) : null;
  const mileageMatch = specText.match(/(\d{2,3}\s?\d{3})\s*км/i);
  const mileageKm = mileageMatch ? Number(mileageMatch[1]!.replace(/\s/g, "")) : null;

  const photos: RawPhoto[] = root
    .querySelectorAll("img[src*='cars/']")
    .map((i) => ({ url: i.getAttribute("src") ?? "" }))
    .filter((p) => p.url.startsWith("http"));

  const idMatch = url.match(/\/cars\/(\d+)/);
  if (!idMatch) return null;

  return {
    source: "abw",
    sourceId: idMatch[1]!,
    url,
    title: ogTitle,
    priceUsd,
    priceRaw: priceText,
    currencyRaw: parsed?.currency ?? null,
    year,
    mileageKm,
    transmission: null,
    bodyColor: null,
    region: null,
    vin: extractVin(description ?? specText),
    phoneNorm: extractPhone(description ?? specText),
    description,
    photos,
    raw: { url, html_length: html.length },
  };
}

export const abwParser: SourceParser = {
  source: "abw",
  async scan({ cursor, mode, rates }) {
    // ABW не поддерживает list-фильтр через JSON, поэтому в bootstrap-режиме
    // обходим sitemap и берём все BMW; в daily — только последние URL по дате.
    const sitemaps = await listSitemaps();
    if (sitemaps.length === 0) return { listings: [], nextCursor: null };

    const subIdx = cursor ? Number(cursor) : 0;
    const sub = sitemaps[subIdx];
    if (!sub) return { listings: [], nextCursor: null };

    const allUrls = await listAdUrls(sub);
    // Без полного индекса BMW мы не отличим E39 от других, поэтому делаем
    // лёгкий префильтр: тянем только страницы где в URL есть bmw или 5
    // (URL'ы abw обычно содержат slug). Для надёжности — детекция в scoring.
    const candidates = allUrls.filter((u) => /bmw|\/5\b|\b5er\b|\be39\b/i.test(u));

    const limit = mode === "bootstrap" ? candidates.length : Math.min(candidates.length, 20);
    const listings: NormalizedListing[] = [];
    for (const u of candidates.slice(0, limit)) {
      try {
        const l = await fetchDetail(u, rates);
        if (l) listings.push(l);
      } catch {
        // игнорируем единичные ошибки
      }
    }
    const next = mode === "bootstrap" && subIdx + 1 < sitemaps.length ? String(subIdx + 1) : null;
    return { listings, nextCursor: next };
  },
};
