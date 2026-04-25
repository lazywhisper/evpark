import { eq } from "drizzle-orm";
import type { DB } from "../database";
import {
  listings,
  photos,
  scoring,
  type TextFindings,
  type VisionFindings,
} from "../database/schema";
import type { Env } from "../env";
import { visionModel } from "../lib/ai";
import { analyzePhotos } from "./vision";
import { analyzeText } from "./text";

export type ScoreOutcome = {
  overallScore: number;
  visionScore: number | null;
  textScore: number | null;
  visionFindings: VisionFindings | null;
  textFindings: TextFindings | null;
  sellerType: "caring_owner" | "flipper" | "concealer" | "unknown";
  redFlags: string[];
  tokensUsed: number;
};

const SELLER_RISK: Record<string, number> = {
  caring_owner: 0,
  unknown: 15,
  concealer: 55,
  flipper: 35,
};

// Стрейч 4..10 → 30..100, шум 0..3 коллапсим в 30.
const stretch = (x: number) => Math.max(0, ((Math.min(10, Math.max(0, x)) - 4) / 6) * 70 + 30);

function visionToScore(v: VisionFindings): number {
  // База 50; M-package +8; диски OEM/M-OEM +5, aftermarket -5, сталь -8;
  // сидения и оригинальность через стрейч с малыми весами.
  let base = 50;
  if (v.mPackage) base += 8;
  switch (v.wheelsCategory) {
    case "oem":
    case "m_oem":
      base += 5;
      break;
    case "aftermarket":
      base -= 5;
      break;
    case "steel":
      base -= 8;
      break;
  }
  const seats = stretch(v.seatsCondition ?? 5);
  const orig = stretch(v.originalityVisible ?? 5);
  // Сдвиг от базы: каждый аспект +/-15 от 50
  const seatsDelta = (seats - 50) * 0.3;
  const origDelta = (orig - 50) * 0.2;
  return Math.max(0, Math.min(100, Math.round(base + seatsDelta + origDelta)));
}

function textToScore(t: TextFindings, sellerType: NonNullable<ScoreOutcome["sellerType"]>): number {
  // База: bodyConditionFromText (стрейч 4..10 → 30..100)
  let score = stretch(t.bodyConditionFromText ?? 5);

  // Заботливый владелец заметно поднимает; перекуп/скрывающий снижает
  score -= SELLER_RISK[sellerType] ?? 15;

  // Бонусы по типу описания
  if (t.ownershipDuration === "long") score += 8;
  if (t.ownershipDuration === "short") score -= 4;
  if (t.mileageHonesty === "honest") score += 4;
  if (t.mileageHonesty === "suspicious") score -= 12;
  if ((t.ownersCount ?? 0) === 1) score += 6;

  // Работы — done положительно, needed отрицательно
  score += Math.min((t.workDone?.length ?? 0) * 3, 12);
  score -= Math.min((t.workNeeded?.length ?? 0) * 4, 20);

  // Флаги-маркеры
  if (t.rustMentioned) score -= 8;
  if (t.urgency) score -= 4;
  if (t.exchange) score -= 3;
  if (t.abroad) score -= 6;
  if (t.polishUp) score -= 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function combineScores(visionScore: number | null, textScore: number | null, hasRichText: boolean): number {
  if (visionScore == null && textScore == null) return 50;
  if (visionScore == null) return textScore!;
  if (textScore == null) return visionScore;
  // Текст — основной сигнал. Если описание богатое, weight 70/30, иначе 50/50.
  const wText = hasRichText ? 0.7 : 0.5;
  return Math.round(textScore * wText + visionScore * (1 - wText));
}

function deriveRedFlags(t: TextFindings | null, sellerType: ScoreOutcome["sellerType"]): string[] {
  const out: string[] = [];
  if (t?.rustMentioned) out.push("ржавчина упомянута");
  if (t?.workNeeded && t.workNeeded.length > 0) out.push(`нужно: ${t.workNeeded.slice(0, 2).join(", ")}`);
  if (t?.mileageHonesty === "suspicious") out.push("пробег подозрительный");
  if (t?.urgency) out.push("срочная продажа");
  if (t?.abroad) out.push("за границей");
  if (t?.polishUp) out.push("шаблонные фразы");
  if (sellerType === "concealer") out.push("уклончивые формулировки");
  if (sellerType === "flipper") out.push("перекуп");
  return out.slice(0, 8);
}

export async function scoreListing(env: Env, d: DB, listingId: string): Promise<ScoreOutcome> {
  const lst = await d.select().from(listings).where(eq(listings.id, listingId)).limit(1);
  const listing = lst[0];
  if (!listing) throw new Error(`listing ${listingId} not found`);

  const ph = await d.select().from(photos).where(eq(photos.listingId, listingId)).limit(6);
  const urls = ph.map((p) => p.url).filter(Boolean);

  let visionFindings: VisionFindings | null = null;
  let visionScore: number | null = null;
  let textFindings: TextFindings | null = null;
  let textScore: number | null = null;
  let sellerType: ScoreOutcome["sellerType"] = "unknown";
  let tokens = 0;

  if (urls.length > 0) {
    try {
      const v = await analyzePhotos(env, urls);
      visionFindings = v.result;
      tokens += v.tokens;
      visionScore = visionToScore(v.result);
    } catch (err) {
      console.warn("[scoring] vision failed", err);
    }
  }

  const desc = (listing.description ?? "").trim();
  const hasRichText = desc.length >= 200;

  if (desc.length > 0) {
    try {
      const t = await analyzeText(env, desc);
      textFindings = t.result;
      sellerType = t.result.sellerType;
      tokens += t.tokens;
      textScore = textToScore(t.result, sellerType);
    } catch (err) {
      console.warn("[scoring] text failed", err);
    }
  }

  const overall = combineScores(visionScore, textScore, hasRichText);
  const redFlags = deriveRedFlags(textFindings, sellerType);

  await d
    .insert(scoring)
    .values({
      listingId,
      overallScore: overall,
      visionScore,
      textScore,
      visionFindingsJson: visionFindings,
      textFindingsJson: textFindings,
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
        textFindingsJson: textFindings,
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
    textFindings,
    sellerType,
    redFlags,
    tokensUsed: tokens,
  };
}
