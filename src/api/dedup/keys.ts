import type { NormalizedListing } from "../parsers/types";

export function fuzzyKey(l: Pick<NormalizedListing, "year" | "mileageKm" | "priceUsd" | "bodyColor">): string {
  // округление в bucket'ы для приблизительного совпадения
  const year = l.year ?? 0;
  const km = l.mileageKm != null ? Math.round(l.mileageKm / 10_000) : -1; // ±10k
  const price = l.priceUsd != null ? Math.round(l.priceUsd / 500) : -1; // ±$500
  const color = (l.bodyColor ?? "").toLowerCase().slice(0, 6);
  return `${year}|${km}|${price}|${color}`;
}
