import type { Env } from "../env";
import { ALL_SOURCES } from "../parsers/registry";

export async function runDailyScan(env: Env) {
  for (const source of ALL_SOURCES) {
    await env.QUEUE_FETCH.send({ kind: "scan", source, mode: "daily" });
  }
}

export async function runBootstrap(env: Env) {
  // av.by — основной источник, кидаем без задержки, чтобы он начал первым.
  // Остальные источники с возрастающим delay чтобы av.by успел захватить
  // консьюмер-слоты и пройтись по своим страницам.
  for (let i = 0; i < ALL_SOURCES.length; i++) {
    const source = ALL_SOURCES[i]!;
    const delaySeconds = source === "av" ? 0 : 60 * (i - ALL_SOURCES.indexOf("av"));
    await env.QUEUE_FETCH.send({ kind: "scan", source, mode: "bootstrap" }, { delaySeconds });
  }
}
