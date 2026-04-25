import type { ListingRow } from "./api";

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
};

export function applyFilters(rows: ListingRow[], f: Filters): ListingRow[] {
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
