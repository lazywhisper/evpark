import { Hono } from "hono";
import { cors } from "hono/cors";
import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import type {
  ExecutionContext,
  ExportedHandlerScheduledHandler,
  MessageBatch,
  ScheduledController,
} from "@cloudflare/workers-types";

import { createAuth } from "./auth";
import { db } from "./database";
import { fetchRuns, listings, notificationsLog, photos, scoring } from "./database/schema";
import type {
  AppContext,
  Env,
  FetchListingsMessage,
  NotifyMessage,
  ScoreListingMessage,
} from "./env";
import { processFetchMessage } from "./queues/fetch-listings";
import { processNotifyMessage } from "./queues/notify";
import { processScoreMessage } from "./queues/score-listing";
import { runBootstrap, runDailyScan } from "./scheduled/cron";
import { setWebhook } from "./telegram/client";
import { handleUpdate } from "./telegram/webhook";

const app = new Hono<AppContext>().basePath("/api");

app.use("*", cors({ origin: "*" }));

app.get("/ping", (c) => c.json({ ok: true, ts: Date.now() }));

// === Better Auth ============================================================
app.on(["GET", "POST"], "/auth/*", async (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

// === Listings (для Web UI) ==================================================
app.get("/listings", async (c) => {
  const d = db(c.env.DB);
  const limit = Math.min(Number(c.req.query("limit") ?? 50), 200);
  const minScore = Number(c.req.query("minScore") ?? 0);
  const rows = await d
    .select({ l: listings, s: scoring, thumbUrl: photos.url })
    .from(listings)
    .leftJoin(scoring, eq(scoring.listingId, listings.id))
    .leftJoin(photos, and(eq(photos.listingId, listings.id), eq(photos.orderIdx, 0)))
    .orderBy(desc(scoring.overallScore), desc(listings.firstSeenAt))
    .limit(limit);
  const filtered = minScore > 0 ? rows.filter((r) => (r.s?.overallScore ?? 0) >= minScore) : rows;
  return c.json({ listings: filtered });
});

app.get("/listings/:id", async (c) => {
  const d = db(c.env.DB);
  const id = c.req.param("id");
  const lst = (await d.select().from(listings).where(eq(listings.id, id)).limit(1))[0];
  if (!lst) return c.json({ error: "not found" }, 404);
  const sc = (await d.select().from(scoring).where(eq(scoring.listingId, id)).limit(1))[0] ?? null;
  const ph = await d
    .select()
    .from(photos)
    .where(eq(photos.listingId, id))
    .orderBy(photos.orderIdx);
  return c.json({ listing: lst, scoring: sc, photos: ph });
});

app.get("/notifications", async (c) => {
  const d = db(c.env.DB);
  const limit = Math.min(Number(c.req.query("limit") ?? 50), 200);
  const rows = await d
    .select({
      id: notificationsLog.id,
      listingId: notificationsLog.listingId,
      tgChatId: notificationsLog.tgChatId,
      sentAt: notificationsLog.sentAt,
      messageId: notificationsLog.messageId,
      reaction: notificationsLog.reaction,
      reactionAt: notificationsLog.reactionAt,
      listingTitle: listings.title,
      listingUrl: listings.url,
      listingPriceEur: listings.priceEur,
    })
    .from(notificationsLog)
    .leftJoin(listings, eq(listings.id, notificationsLog.listingId))
    .orderBy(desc(notificationsLog.sentAt))
    .limit(limit);
  return c.json({ notifications: rows });
});

app.get("/stats", async (c) => {
  const d = db(c.env.DB);
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [totalListings] = await d.select({ n: count() }).from(listings);
  const [newLast7d] = await d
    .select({ n: count() })
    .from(listings)
    .where(gte(listings.firstSeenAt, since7d));
  const [notifLast7d] = await d
    .select({ n: count() })
    .from(notificationsLog)
    .where(gte(notificationsLog.sentAt, since7d));
  const [scoredTotal] = await d.select({ n: count() }).from(scoring);
  const [avgScore] = await d
    .select({ avg: sql<number>`avg(${scoring.overallScore})` })
    .from(scoring);

  const bySource = await d
    .select({ source: listings.source, n: count() })
    .from(listings)
    .groupBy(listings.source);

  const recentRuns = await d
    .select()
    .from(fetchRuns)
    .where(gte(fetchRuns.startedAt, since24h))
    .orderBy(desc(fetchRuns.startedAt))
    .limit(20);

  const thumbsUp = await d
    .select({ n: count() })
    .from(notificationsLog)
    .where(and(eq(notificationsLog.reaction, "up"), gte(notificationsLog.sentAt, since7d)));
  const thumbsDown = await d
    .select({ n: count() })
    .from(notificationsLog)
    .where(and(eq(notificationsLog.reaction, "down"), gte(notificationsLog.sentAt, since7d)));

  return c.json({
    listings: {
      total: totalListings?.n ?? 0,
      newLast7d: newLast7d?.n ?? 0,
      bySource: Object.fromEntries(bySource.map((r) => [r.source, r.n])),
    },
    scoring: {
      total: scoredTotal?.n ?? 0,
      avgScore: avgScore?.avg != null ? Math.round(Number(avgScore.avg)) : null,
    },
    notifications: {
      last7d: notifLast7d?.n ?? 0,
      thumbsUp: thumbsUp?.[0]?.n ?? 0,
      thumbsDown: thumbsDown?.[0]?.n ?? 0,
    },
    recentRuns,
  });
});

// === Manual triggers (защищены TG_WEBHOOK_SECRET для простоты) ==============
function checkSecret(c: { req: { header: (k: string) => string | undefined }; env: Env }) {
  const auth = c.req.header("authorization");
  return auth === `Bearer ${c.env.TG_WEBHOOK_SECRET}`;
}

app.post("/scan/now", async (c) => {
  if (!checkSecret(c)) return c.json({ error: "unauthorized" }, 401);
  await runDailyScan(c.env);
  return c.json({ ok: true });
});

app.post("/scan/bootstrap", async (c) => {
  if (!checkSecret(c)) return c.json({ error: "unauthorized" }, 401);
  await runBootstrap(c.env);
  return c.json({ ok: true });
});

// === Telegram ==============================================================
app.post("/tg/setup", async (c) => {
  if (!checkSecret(c)) return c.json({ error: "unauthorized" }, 401);
  const url = new URL(c.req.url);
  const webhookUrl = `${url.origin}/api/tg/webhook`;
  const result = await setWebhook(c.env, webhookUrl);
  return c.json({ ok: true, url: webhookUrl, result });
});

app.post("/tg/webhook", async (c) => {
  const secret = c.req.header("x-telegram-bot-api-secret-token");
  if (secret !== c.env.TG_WEBHOOK_SECRET) return c.json({ ok: false }, 401);
  const update = await c.req.json();
  c.executionCtx.waitUntil(handleUpdate(c.env, db(c.env.DB), update));
  return c.json({ ok: true });
});

// === Worker exports =========================================================

const scheduled: ExportedHandlerScheduledHandler<Env> = async (
  _controller: ScheduledController,
  env: Env,
  ctx: ExecutionContext,
) => {
  ctx.waitUntil(runDailyScan(env));
};

async function queueHandler(batch: MessageBatch, env: Env): Promise<void> {
  const d = db(env.DB);
  for (const msg of batch.messages) {
    try {
      switch (batch.queue) {
        case "e39-fetch-listings":
          await processFetchMessage(env, d, msg.body as FetchListingsMessage);
          break;
        case "e39-score-listing":
          await processScoreMessage(env, d, msg.body as ScoreListingMessage);
          break;
        case "e39-notify":
          await processNotifyMessage(env, d, msg.body as NotifyMessage);
          break;
      }
      msg.ack();
    } catch (err) {
      console.error(`[queue:${batch.queue}] error`, err);
      msg.retry();
    }
  }
}

export default {
  fetch: app.fetch,
  scheduled,
  queue: queueHandler,
};
