import { generateObject } from "ai";
import { z } from "zod";
import type { Env } from "../env";
import { getAnthropic, visionModel } from "../lib/ai";
import { VISION_PROMPT } from "./prompts";

const schema = z.object({
  mPackage: z.boolean(),
  wheelsModel: z.string().nullable(),
  wheelsCategory: z.enum(["oem", "m_oem", "aftermarket", "steel", "unknown"]),
  wheelsConfidence: z.number().min(0).max(1),
  seatsCondition: z.number().min(0).max(10),
  originalityVisible: z.number().min(0).max(10),
  notes: z.string().nullable().optional(),
});

export type VisionResult = z.infer<typeof schema>;

export async function analyzePhotos(
  env: Env,
  photoUrls: string[],
): Promise<{ result: VisionResult; tokens: number }> {
  const top = photoUrls.slice(0, 6);
  const anthropic = getAnthropic(env);
  const { object, usage } = await generateObject({
    model: anthropic(visionModel(env)),
    schema,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: VISION_PROMPT },
          ...top.map((url) => ({ type: "image" as const, image: new URL(url) })),
        ],
      },
    ],
  });
  return { result: object, tokens: (usage?.totalTokens ?? 0) | 0 };
}
