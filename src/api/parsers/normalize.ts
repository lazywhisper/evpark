// Курсы для конвертации в EUR. Грубо — обновляются вручную при необходимости.
// Цель — единая шкала для сортировки, точность ±5% некритична.
const EUR_RATES: Record<string, number> = {
  EUR: 1,
  USD: 0.92,
  BYN: 0.28,
  RUB: 0.0098,
};

export function toEur(value: number, currency: string): number | null {
  const rate = EUR_RATES[currency.toUpperCase()];
  if (!rate) return null;
  return Math.round(value * rate);
}

export function detectCurrency(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.toLowerCase();
  if (s.includes("€") || s.includes("eur")) return "EUR";
  if (s.includes("$") || s.includes("usd")) return "USD";
  if (s.includes("byn") || s.includes("р.") || s.includes("руб") || s.includes("br")) return "BYN";
  if (s.includes("rub") || s.includes("₽")) return "RUB";
  return null;
}

export function parsePrice(raw: string | null | undefined): { value: number; currency: string } | null {
  if (!raw) return null;
  const cur = detectCurrency(raw);
  if (!cur) return null;
  const cleaned = raw.replace(/[^\d.,]/g, "").replace(/,/g, ".");
  const num = Number.parseFloat(cleaned);
  if (!Number.isFinite(num)) return null;
  return { value: num, currency: cur };
}

const VIN_RE = /\b[A-HJ-NPR-Z0-9]{17}\b/i;
export function extractVin(text: string | null | undefined): string | null {
  if (!text) return null;
  const m = VIN_RE.exec(text);
  return m ? m[0]!.toUpperCase() : null;
}

// E.164 для Беларуси: +375 XX XXXXXXX
export function normalizePhoneBy(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 9) return null;
  let core = digits;
  if (digits.startsWith("375")) core = digits.slice(3);
  else if (digits.startsWith("8")) core = digits.slice(1);
  if (core.length !== 9) return null;
  return `+375${core}`;
}

const PHONE_RE = /(?:\+?375|8)?\s*\(?\s*(?:17|25|29|33|44)\s*\)?\s*\d{3}[-\s]?\d{2}[-\s]?\d{2}/;
export function extractPhone(text: string | null | undefined): string | null {
  if (!text) return null;
  const m = PHONE_RE.exec(text);
  return m ? normalizePhoneBy(m[0]) : null;
}
