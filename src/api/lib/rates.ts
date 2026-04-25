import type { Env } from "../env";

// Курсы НБРБ к BYN. Cur_OfficialRate * Cur_Scale BYN = X единиц валюты.
// Например USD: rate=3.21, scale=1 → 1 USD = 3.21 BYN.
// Кешируем в KV на 12 часов — официальный курс публикуется раз в день.

const KV_KEY = "nbrb:rates:v1";
const TTL_SECONDS = 12 * 60 * 60;

// Fallback на случай если NBRB API недоступен.
const FALLBACK: Rates = { USD: 3.2, EUR: 3.5, RUB: 0.035, fetchedAt: 0 };

export type Rates = {
  USD: number; // BYN per 1 USD
  EUR: number; // BYN per 1 EUR
  RUB: number; // BYN per 1 RUB
  fetchedAt: number;
};

export async function getRates(env: Env): Promise<Rates> {
  try {
    const cached = await env.KV.get(KV_KEY, "json");
    if (cached) {
      const r = cached as Rates;
      if (Date.now() - r.fetchedAt < TTL_SECONDS * 1000) return r;
    }
  } catch {
    // ignore
  }

  const fresh = await fetchAllRates();
  if (fresh) {
    try {
      await env.KV.put(KV_KEY, JSON.stringify(fresh), { expirationTtl: TTL_SECONDS });
    } catch {
      // ignore KV write fail
    }
    return fresh;
  }

  // Если NBRB не отдал — пытаемся отдать кеш даже устаревший
  try {
    const stale = await env.KV.get(KV_KEY, "json");
    if (stale) return stale as Rates;
  } catch {
    // ignore
  }
  return FALLBACK;
}

async function fetchAllRates(): Promise<Rates | null> {
  try {
    const res = await fetch("https://api.nbrb.by/exrates/rates?periodicity=0", {
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    const list = (await res.json()) as Array<{
      Cur_Abbreviation: string;
      Cur_OfficialRate: number;
      Cur_Scale: number;
    }>;
    const find = (code: string) => {
      const r = list.find((x) => x.Cur_Abbreviation === code);
      if (!r || !r.Cur_OfficialRate || !r.Cur_Scale) return null;
      return r.Cur_OfficialRate / r.Cur_Scale;
    };
    const usd = find("USD");
    const eur = find("EUR");
    const rub = find("RUB");
    if (!usd) return null;
    return {
      USD: usd,
      EUR: eur ?? FALLBACK.EUR,
      RUB: rub ?? FALLBACK.RUB,
      fetchedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

/** Конвертирует цену в USD по курсу НБРБ. Возвращает целое число. */
export function toUsd(value: number, currency: string, rates: Rates): number | null {
  if (!Number.isFinite(value) || value <= 0) return null;
  const cur = currency.toUpperCase();
  switch (cur) {
    case "USD":
      return Math.round(value);
    case "BYN":
      return Math.round(value / rates.USD);
    case "EUR":
      return Math.round((value * rates.EUR) / rates.USD);
    case "RUB":
      return Math.round((value * rates.RUB) / rates.USD);
    default:
      return null;
  }
}
