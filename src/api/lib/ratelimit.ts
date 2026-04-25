import type { KVNamespace } from "@cloudflare/workers-types";

// Token-bucket per-source в KV. Возвращает true если можно делать запрос,
// иначе ждёт нужное время (но не дольше maxWaitMs) и возвращает false если так и не дождались.
export async function acquireToken(
  kv: KVNamespace,
  source: string,
  rps: number,
  maxWaitMs = 5_000,
): Promise<boolean> {
  const key = `rl:${source}`;
  const intervalMs = Math.ceil(1000 / rps);
  const start = Date.now();

  while (Date.now() - start < maxWaitMs) {
    const lastStr = await kv.get(key);
    const last = lastStr ? Number(lastStr) : 0;
    const now = Date.now();
    const next = last + intervalMs;
    if (now >= next) {
      // best-effort, без CAS — для single-worker нагрузки достаточно
      await kv.put(key, String(now), { expirationTtl: 60 });
      return true;
    }
    const wait = Math.min(next - now, 250);
    await new Promise((r) => setTimeout(r, wait));
  }
  return false;
}

export async function withLock<T>(
  kv: KVNamespace,
  key: string,
  ttlSec: number,
  fn: () => Promise<T>,
): Promise<T | null> {
  const existing = await kv.get(key);
  if (existing) return null;
  await kv.put(key, "1", { expirationTtl: ttlSec });
  try {
    return await fn();
  } finally {
    await kv.delete(key);
  }
}
