import { generateObject } from "ai";
import { z } from "zod";
import type { Env } from "../env";
import { getAnthropic, VISION_MODEL } from "../lib/ai";
import { VISION_PROMPT } from "./prompts";

const schema = z.object({
  rust: z.number().min(0).max(10),
  interior: z.number().min(0).max(10),
  originality: z.number().min(0).max(10),
  defects: z.array(z.string()).max(10),
  redFlags: z.array(z.string()).max(10),
  notes: z.string().optional(),
});

export type VisionResult = z.infer<typeof schema>;

export async function analyzePhotos(env: Env, photoUrls: string[]): Promise<{ result: VisionResult; tokens: number }> {
  const top = photoUrls.slice(0, 6);
  const anthropic = getAnthropic(env);
  const { object, usage } = await generateObject({
    model: anthropic(VISION_MODEL),
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
