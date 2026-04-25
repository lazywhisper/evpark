import { generateObject } from "ai";
import { z } from "zod";
import type { Env } from "../env";
import { getAnthropic, TEXT_MODEL } from "../lib/ai";
import { REDFLAGS_PROMPT, SELLER_PROMPT } from "./prompts";

const sellerSchema = z.object({
  category: z.enum(["caring_owner", "flipper", "concealer", "unknown"]),
  confidence: z.number().min(0).max(1),
  evidenceQuotes: z.array(z.string()).max(5),
});

const redFlagsSchema = z.object({
  flags: z.array(z.string()).max(10),
});

export type SellerResult = z.infer<typeof sellerSchema>;
export type RedFlagsResult = z.infer<typeof redFlagsSchema>;

export async function analyzeSeller(env: Env, description: string): Promise<{ result: SellerResult; tokens: number }> {
  const anthropic = getAnthropic(env);
  const { object, usage } = await generateObject({
    model: anthropic(TEXT_MODEL),
    schema: sellerSchema,
    messages: [
      { role: "system", content: SELLER_PROMPT },
      { role: "user", content: description.slice(0, 4000) },
    ],
  });
  return { result: object, tokens: (usage?.totalTokens ?? 0) | 0 };
}

export async function analyzeRedFlags(
  env: Env,
  description: string,
): Promise<{ result: RedFlagsResult; tokens: number }> {
  const anthropic = getAnthropic(env);
  const { object, usage } = await generateObject({
    model: anthropic(TEXT_MODEL),
    schema: redFlagsSchema,
    messages: [
      { role: "system", content: REDFLAGS_PROMPT },
      { role: "user", content: description.slice(0, 4000) },
    ],
  });
  return { result: object, tokens: (usage?.totalTokens ?? 0) | 0 };
}
