import { generateObject } from "ai";
import { z } from "zod";
import type { Env } from "../env";
import { getAnthropic, textModel } from "../lib/ai";
import { TEXT_PROMPT } from "./prompts";

const sellerProfileSchema = z.object({
  communicationStyle: z.enum(["warm_owner", "professional", "salesy", "terse", "evasive"]),
  knowledgeLevel: z.enum(["expert", "informed", "basic", "unclear"]),
  negotiationPosture: z.enum(["firm", "open", "aggressive", "needs_quick_sale", "unknown"]),
  emotionalTone: z.enum(["proud", "neutral", "rushed", "defensive", "salesy"]),
  reasonForSelling: z.string().nullable(),
  storyCoherence: z.enum(["consistent", "gaps", "contradictions"]),
  trustSignals: z.array(z.string()),
});

const schema = z.object({
  sellerType: z.enum(["caring_owner", "flipper", "concealer", "unknown"]),
  sellerProfile: sellerProfileSchema,
  ownershipDuration: z.enum(["long", "short", "unknown"]),
  ownersCount: z.number().int().nullable(),
  rustMentioned: z.boolean(),
  workDone: z.array(z.string()),
  workNeeded: z.array(z.string()),
  mileageHonesty: z.enum(["honest", "suspicious", "unknown"]),
  exchange: z.boolean(),
  urgency: z.boolean(),
  abroad: z.boolean(),
  polishUp: z.boolean(),
  bodyConditionFromText: z.number().min(0).max(10),
  positiveQuotes: z.array(z.string()),
  negativeQuotes: z.array(z.string()),
  keyFacts: z.array(z.string()),
  psychSummary: z.string(),
});

export type TextResult = z.infer<typeof schema>;

export async function analyzeText(
  env: Env,
  description: string,
): Promise<{ result: TextResult; tokens: number }> {
  const anthropic = getAnthropic(env);
  try {
    const { object, usage } = await generateObject({
      model: anthropic(textModel(env)),
      schema,
      system: TEXT_PROMPT,
      prompt: description.slice(0, 6000),
    });
    return { result: object, tokens: (usage?.totalTokens ?? 0) | 0 };
  } catch (err) {
    console.error("[analyzeText] failed:", String(err).slice(0, 500));
    throw err;
  }
}
