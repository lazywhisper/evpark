import type { Env } from "../env";
import type { SourceName } from "../database/schema";
import { kufarParser } from "./kufar";
import { onlinerParser } from "./onliner";
import { abwParser } from "./abw";
import { makeAvbyParser } from "./avby";
import type { SourceParser } from "./types";

// Порядок имеет значение: av.by — самый большой и важный источник, его кидаем
// в очередь первым. Остальные за ним.
export const ALL_SOURCES: SourceName[] = ["av", "kufar", "onliner", "abw"];

export function getParser(env: Env, source: SourceName): SourceParser {
  switch (source) {
    case "kufar":
      return kufarParser;
    case "onliner":
      return onlinerParser;
    case "abw":
      return abwParser;
    case "av":
      return makeAvbyParser(env);
  }
}
