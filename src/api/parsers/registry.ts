import type { Env } from "../env";
import type { SourceName } from "../database/schema";
import { kufarParser } from "./kufar";
import { onlinerParser } from "./onliner";
import { abwParser } from "./abw";
import { makeAvbyParser } from "./avby";
import type { SourceParser } from "./types";

export const ALL_SOURCES: SourceName[] = ["kufar", "onliner", "abw", "av"];

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
