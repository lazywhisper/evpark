const UAS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
];

export function pickUA(): string {
  return UAS[Math.floor(Math.random() * UAS.length)]!;
}

export type FetchOptions = RequestInit & {
  retries?: number;
  baseDelayMs?: number;
  timeoutMs?: number;
  ua?: string;
};

export class HttpError extends Error {
  constructor(
    public status: number,
    public url: string,
    public body?: string,
  ) {
    super(`HTTP ${status} ${url}`);
  }
}

export async function fetchWithRetry(url: string, opts: FetchOptions = {}): Promise<Response> {
  const { retries = 3, baseDelayMs = 800, timeoutMs = 20000, ua, ...init } = opts;
  const headers = new Headers(init.headers);
  if (!headers.has("user-agent")) headers.set("user-agent", ua ?? pickUA());
  if (!headers.has("accept-language")) headers.set("accept-language", "ru-BY,ru;q=0.9,en;q=0.7");
  if (!headers.has("accept")) headers.set("accept", "application/json, text/html;q=0.9, */*;q=0.5");

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, headers, signal: ctl.signal });
      clearTimeout(t);
      if (res.status === 429 || res.status === 503) {
        const retryAfter = parseRetryAfter(res.headers.get("retry-after"));
        const delay = retryAfter ?? baseDelayMs * 2 ** attempt + Math.random() * 250;
        if (attempt < retries) {
          await sleep(delay);
          continue;
        }
      }
      if (res.status >= 500 && attempt < retries) {
        await sleep(baseDelayMs * 2 ** attempt + Math.random() * 250);
        continue;
      }
      return res;
    } catch (err) {
      clearTimeout(t);
      lastErr = err;
      if (attempt < retries) {
        await sleep(baseDelayMs * 2 ** attempt + Math.random() * 250);
        continue;
      }
    }
  }
  throw lastErr ?? new Error("fetchWithRetry exhausted");
}

function parseRetryAfter(h: string | null): number | null {
  if (!h) return null;
  const n = Number(h);
  if (Number.isFinite(n)) return Math.min(n * 1000, 30_000);
  const ts = Date.parse(h);
  if (!Number.isNaN(ts)) return Math.max(0, ts - Date.now());
  return null;
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
