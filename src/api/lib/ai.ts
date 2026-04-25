import { createAnthropic } from "@ai-sdk/anthropic";
import type { Env } from "../env";

export const VISION_MODEL = "claude-sonnet-4-6";
export const TEXT_MODEL = "claude-sonnet-4-6";

export function getAnthropic(env: Env) {
  const baseURL = env.AI_GATEWAY_BASE_URL?.trim();
  return createAnthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    ...(baseURL ? { baseURL } : {}),
    headers: env.AI_GATEWAY_API_KEY
      ? { authorization: `Bearer ${env.AI_GATEWAY_API_KEY}` }
      : undefined,
  });
}
