import type { ListingRow } from "./api";

export type SortKey =
  | "score_desc"
  | "score_asc"
  | "price_asc"
  | "price_desc"
  | "year_desc"
  | "year_asc"
  | "mileage_asc"
  | "mileage_desc"
  | "newest";

export type Filters = {
  minScore?: number;
  priceMin?: number;
  priceMax?: number;
  yearMin?: number;
  yearMax?: number;
  mileageMax?: number;
  sources?: Array<"av" | "kufar" | "onliner" | "abw">;
  sellerTypes?: Array<"caring_owner" | "flipper" | "concealer" | "unknown">;
  regions?: string[];
  mPackageOnly?: boolean;
  hideRust?: boolean;
  hideAbroad?: boolean;
  sortBy?: SortKey;
};

export const SORT_LABELS: Record<SortKey, string> = {
  score_desc: "скор ↓",
  score_asc: "скор ↑",
  price_asc: "цена ↑",
  price_desc: "цена ↓",
  year_desc: "год ↓",
  year_asc: "год ↑",
  mileage_asc: "пробег ↑",
  mileage_desc: "пробег ↓",
  newest: "новые сверху",
};

export function applyFilters(rows: ListingRow[], f: Filters): ListingRow[] {
  return sortRows(filterRows(rows, f), f.sortBy ?? "score_desc");
}

export function filterRows(rows: ListingRow[], f: Filters): ListingRow[] {
  return rows.filter((r) => {
    const score = r.s?.overallScore ?? 0;
    if (f.minScore != null && f.minScore > 0 && score < f.minScore) return false;

    const price = r.l.priceUsd ?? 0;
    if (f.priceMin != null && price < f.priceMin) return false;
    if (f.priceMax != null && price > f.priceMax) return false;

    const year = r.l.year ?? 0;
    if (f.yearMin != null && year < f.yearMin) return false;
    if (f.yearMax != null && year > f.yearMax) return false;

    if (f.mileageMax != null && (r.l.mileageKm ?? 0) > f.mileageMax) return false;

    if (f.sources?.length && !f.sources.includes(r.l.source)) return false;

    if (f.sellerTypes?.length && !f.sellerTypes.includes(r.s?.sellerType ?? "unknown")) return false;

    if (f.regions?.length) {
      const region = r.l.region ?? "";
      const hit = f.regions.some((rr) => region.includes(rr));
      if (!hit) return false;
    }

    if (f.mPackageOnly && !r.s?.visionFindingsJson?.mPackage) return false;
    if (f.hideRust && r.s?.textFindingsJson?.rustMentioned) return false;
    if (f.hideAbroad && r.s?.textFindingsJson?.abroad) return false;

    return true;
  });
}

function sortRows(rows: ListingRow[], by: SortKey): ListingRow[] {
  const arr = [...rows];
  const num = (v: number | null | undefined, fallback: number) =>
    v == null || !Number.isFinite(v) ? fallback : v;
  switch (by) {
    case "score_desc":
      arr.sort((a, b) => num(b.s?.overallScore, 0) - num(a.s?.overallScore, 0));
      break;
    case "score_asc":
      arr.sort((a, b) => num(a.s?.overallScore, 999) - num(b.s?.overallScore, 999));
      break;
    case "price_asc":
      arr.sort((a, b) => num(a.l.priceUsd, Infinity) - num(b.l.priceUsd, Infinity));
      break;
    case "price_desc":
      arr.sort((a, b) => num(b.l.priceUsd, -1) - num(a.l.priceUsd, -1));
      break;
    case "year_desc":
      arr.sort((a, b) => num(b.l.year, 0) - num(a.l.year, 0));
      break;
    case "year_asc":
      arr.sort((a, b) => num(a.l.year, 9999) - num(b.l.year, 9999));
      break;
    case "mileage_asc":
      arr.sort((a, b) => num(a.l.mileageKm, Infinity) - num(b.l.mileageKm, Infinity));
      break;
    case "mileage_desc":
      arr.sort((a, b) => num(b.l.mileageKm, -1) - num(a.l.mileageKm, -1));
      break;
    case "newest":
      arr.sort((a, b) => {
        const ta = a.l.firstSeenAt ? new Date(a.l.firstSeenAt).getTime() : 0;
        const tb = b.l.firstSeenAt ? new Date(b.l.firstSeenAt).getTime() : 0;
        return tb - ta;
      });
      break;
  }
  return arr;
}

// Извлекаем уникальные регионы (область) из списка
export function uniqueRegions(rows: ListingRow[]): string[] {
  const set = new Set<string>();
  for (const r of rows) {
    const region = r.l.region;
    if (!region) continue;
    // Берём первую часть до запятой (область)
    const main = region.split(",")[0]!.trim();
    if (main) set.add(main);
  }
  return [...set].sort();
}
