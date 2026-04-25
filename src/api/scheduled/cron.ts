import type { Env } from "../env";
import { ALL_SOURCES } from "../parsers/registry";

export async function runDailyScan(env: Env) {
  for (const source of ALL_SOURCES) {
    await env.QUEUE_FETCH.send({ kind: "scan", source, mode: "daily" });
  }
}

export async function runBootstrap(env: Env) {
  for (const source of ALL_SOURCES) {
    await env.QUEUE_FETCH.send({ kind: "scan", source, mode: "bootstrap" });
  }
}
