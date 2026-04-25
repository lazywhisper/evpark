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
  trustSignals: z.array(z.string()).max(5),
});

const schema = z.object({
  sellerType: z.enum(["caring_owner", "flipper", "concealer", "unknown"]),
  sellerProfile: sellerProfileSchema,
  ownershipDuration: z.enum(["long", "short", "unknown"]),
  ownersCount: z.number().int().nullable(),
  rustMentioned: z.boolean(),
  workDone: z.array(z.string()).max(10),
  workNeeded: z.array(z.string()).max(10),
  mileageHonesty: z.enum(["honest", "suspicious", "unknown"]),
  exchange: z.boolean(),
  urgency: z.boolean(),
  abroad: z.boolean(),
  polishUp: z.boolean(),
  bodyConditionFromText: z.number().min(0).max(10),
  positiveQuotes: z.array(z.string()).max(3),
  negativeQuotes: z.array(z.string()).max(3),
  keyFacts: z.array(z.string()).max(4),
  psychSummary: z.string().max(300),
});

export type TextResult = z.infer<typeof schema>;

export async function analyzeText(
  env: Env,
  description: string,
): Promise<{ result: TextResult; tokens: number }> {
  const anthropic = getAnthropic(env);
  const { object, usage } = await generateObject({
    model: anthropic(textModel(env)),
    schema,
    messages: [
      { role: "system", content: TEXT_PROMPT },
      { role: "user", content: description.slice(0, 6000) },
    ],
  });
  return { result: object, tokens: (usage?.totalTokens ?? 0) | 0 };
}
