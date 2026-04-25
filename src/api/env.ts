import type {
  D1Database,
  KVNamespace,
  Queue,
  R2Bucket,
  Fetcher,
} from "@cloudflare/workers-types";

export type FetchListingsMessage =
  | { kind: "scan"; source: SourceName; mode: "daily" | "bootstrap"; cursor?: string }
  | { kind: "detail"; source: SourceName; sourceId: string; url: string };

export type ScoreListingMessage = { listingId: string };

export type NotifyMessage = { listingId: string };

import type { SourceName } from "./database/schema";

export interface Env {
  // bindings
  DB: D1Database;
  PHOTOS: R2Bucket;
  KV: KVNamespace;
  QUEUE_FETCH: Queue<FetchListingsMessage>;
  QUEUE_SCORE: Queue<ScoreListingMessage>;
  QUEUE_NOTIFY: Queue<NotifyMessage>;
  AI: Fetcher;
  BROWSER: Fetcher;

  // vars
  APP_TZ: string;
  DEFAULT_THRESHOLD: string;

  // secrets
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL?: string;
  ANTHROPIC_API_KEY: string;
  AI_GATEWAY_BASE_URL?: string;
  AI_GATEWAY_API_KEY?: string;
  TG_BOT_TOKEN: string;
  TG_WEBHOOK_SECRET: string;
  TG_OWNER_CHAT_ID?: string;
  SCRAPFLY_KEY?: string;
  FLY_FALLBACK_URL?: string;
  FLY_FALLBACK_HMAC?: string;
}

export type AppContext = {
  Bindings: Env;
  Variables: {
    userId?: string;
  };
};
