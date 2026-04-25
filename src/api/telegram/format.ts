import type { listings as listingsTable, scoring as scoringTable } from "../database/schema";

type Listing = typeof listingsTable.$inferSelect;
type Score = typeof scoringTable.$inferSelect;

const SOURCE_NAME: Record<string, string> = {
  av: "av.by",
  onliner: "onliner",
  abw: "abw.by",
  kufar: "kufar",
};

function escape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function formatListingCaption(l: Listing, s: Score | null): string {
  const lines: string[] = [];
  lines.push(`<b>${escape(l.title)}</b>`);
  if (l.priceEur != null) lines.push(`💶 ~${l.priceEur} EUR · ${escape(l.priceRaw ?? "")}`);
  if (l.year) lines.push(`📅 ${l.year}${l.mileageKm ? ` · ${l.mileageKm.toLocaleString("ru")} км` : ""}`);
  if (l.region) lines.push(`📍 ${escape(l.region)}`);
  lines.push(`🏷 ${SOURCE_NAME[l.source] ?? l.source}`);
  if (s) {
    lines.push("");
    lines.push(`⭐ <b>Скор: ${s.overallScore}</b>${s.visionScore != null ? ` (vision ${s.visionScore})` : ""}${s.textScore != null ? ` (text ${s.textScore})` : ""}`);
    if (s.sellerType && s.sellerType !== "unknown") {
      const sellerLabel: Record<string, string> = {
        caring_owner: "🟢 заботливый владелец",
        flipper: "🟡 перекуп",
        concealer: "🔴 скрывает дефекты",
      };
      lines.push(sellerLabel[s.sellerType] ?? s.sellerType);
    }
    const v = s.visionFindingsJson;
    if (v) {
      lines.push(`Кузов ${v.rust}/10 · салон ${v.interior}/10 · ориг. ${v.originality}/10`);
      if (v.defects?.length) lines.push(`⚠ ${v.defects.slice(0, 3).map(escape).join(", ")}`);
    }
    if (s.redFlagsJson?.length) {
      lines.push(`🚩 ${s.redFlagsJson.slice(0, 4).map(escape).join(" · ")}`);
    }
  }
  return lines.join("\n");
}
