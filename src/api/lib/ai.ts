import { createAnthropic } from "@ai-sdk/anthropic";
import type { Env } from "../env";

// Дефолт — Haiku 4.5: ~3-5x дешевле Sonnet 4.6, для классификации и базового
// vision-анализа кузов/салон/оригинальность — достаточно.
// Переопределить можно vars VISION_MODEL / TEXT_MODEL в wrangler.json без
// передеплоя кода.
const DEFAULT_MODEL = "claude-haiku-4-5";

export function visionModel(env: Env): string {
  return env.VISION_MODEL?.trim() || DEFAULT_MODEL;
}

export function textModel(env: Env): string {
  return env.TEXT_MODEL?.trim() || DEFAULT_MODEL;
}

// Совместимость со старыми импортами (constant'ы, без env)
export const VISION_MODEL = DEFAULT_MODEL;
export const TEXT_MODEL = DEFAULT_MODEL;

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
