import { eq } from "drizzle-orm";
import type { DB } from "../database";
import { listings, photos, scoring, type VisionFindings } from "../database/schema";
import type { Env } from "../env";
import { visionModel } from "../lib/ai";
import { analyzePhotos } from "./vision";
import { analyzeRedFlags, analyzeSeller } from "./text";

export type ScoreOutcome = {
  overallScore: number;
  visionScore: number | null;
  textScore: number | null;
  visionFindings: VisionFindings | null;
  sellerType: "caring_owner" | "flipper" | "concealer" | "unknown";
  redFlags: string[];
  tokensUsed: number;
};

// "unknown" — это нейтраль, не штраф: большинство объявлений короткие, нет описания.
const SELLER_RISK: Record<string, number> = {
  caring_owner: 0,
  unknown: 20,
  concealer: 60,
  flipper: 45,
};

export async function scoreListing(env: Env, d: DB, listingId: string): Promise<ScoreOutcome> {
  const lst = await d.select().from(listings).where(eq(listings.id, listingId)).limit(1);
  const listing = lst[0];
  if (!listing) throw new Error(`listing ${listingId} not found`);

  const ph = await d.select().from(photos).where(eq(photos.listingId, listingId)).limit(6);
  const urls = ph.map((p) => p.url).filter(Boolean);

  let visionFindings: VisionFindings | null = null;
  let visionScore: number | null = null;
  let tokens = 0;

  if (urls.length > 0) {
    try {
      const v = await analyzePhotos(env, urls);
      visionFindings = v.result;
      tokens += v.tokens;
      // Калибровка: rust=6/interior=6/originality=6 → 60 (типичный E39).
      // rust=8/interior=7/originality=8 → 78 (отличный экземпляр).
      // Растягиваем шкалу 4..10 → 30..100, чтобы исключить шум 0-3.
      const stretch = (x: number) => Math.max(0, ((Math.min(10, x) - 4) / 6) * 70 + 30);
      visionScore = Math.round(
        stretch(v.result.rust) * 0.5 +
          stretch(v.result.interior) * 0.3 +
          stretch(v.result.originality) * 0.2,
      );
    } catch (err) {
      console.warn("[scoring] vision failed", err);
    }
  }

  let sellerType: ScoreOutcome["sellerType"] = "unknown";
  let redFlags: string[] = [];
  let textScore: number | null = null;

  if (listing.description) {
    try {
      const [s, r] = await Promise.all([
        analyzeSeller(env, listing.description),
        analyzeRedFlags(env, listing.description),
      ]);
      sellerType = s.result.category;
      redFlags = r.result.flags;
      tokens += s.tokens + r.tokens;
      const sellerRisk = SELLER_RISK[sellerType] ?? 20;
      const flagPenalty = Math.min(redFlags.length * 7, 35);
      textScore = Math.max(0, 100 - sellerRisk - flagPenalty);
    } catch (err) {
      console.warn("[scoring] text failed", err);
    }
  }

  // Если описания нет (текст-скоринг невозможен), не штрафуем — fallback на vision.
  const overall =
    visionScore != null && textScore != null
      ? Math.round(visionScore * 0.65 + textScore * 0.35)
      : (visionScore ?? textScore ?? 55);

  await d
    .insert(scoring)
    .values({
      listingId,
      overallScore: overall,
      visionScore,
      textScore,
      visionFindingsJson: visionFindings,
      sellerType,
      redFlagsJson: redFlags,
      modelVersion: visionModel(env),
      tokensUsed: tokens,
    })
    .onConflictDoUpdate({
      target: scoring.listingId,
      set: {
        overallScore: overall,
        visionScore,
        textScore,
        visionFindingsJson: visionFindings,
        sellerType,
        redFlagsJson: redFlags,
        modelVersion: visionModel(env),
        scoredAt: new Date(),
        tokensUsed: tokens,
      },
    });

  return {
    overallScore: overall,
    visionScore,
    textScore,
    visionFindings,
    sellerType,
    redFlags,
    tokensUsed: tokens,
  };
}
