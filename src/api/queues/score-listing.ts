import { and, eq, isNull } from "drizzle-orm";
import type { DB } from "../database";
import { listings, photos, scoring, telegramUsers } from "../database/schema";
import { findOrCreateCluster } from "../dedup/matcher";
import { fingerprintFromUrl } from "../dedup/phash";
import type { Env, ScoreListingMessage } from "../env";
import { scoreListing } from "../scoring/score";

export async function processScoreMessage(env: Env, d: DB, msg: ScoreListingMessage) {
  const { listingId } = msg;
  if (!listingId) return;

  // 1. Считаем pHash для top-3 фото
  const ph = await d.select().from(photos).where(eq(photos.listingId, listingId)).limit(3);
  const phashes: string[] = [];
  for (const p of ph) {
    if (p.phash) {
      phashes.push(p.phash);
      continue;
    }
    const fp = await fingerprintFromUrl(p.url);
    if (fp) {
      phashes.push(fp);
      await d.update(photos).set({ phash: fp }).where(eq(photos.id, p.id));
    }
  }

  // 2. Дедуп
  const lst = (await d.select().from(listings).where(eq(listings.id, listingId)).limit(1))[0];
  if (!lst) return;

  // Только если не в кластере
  let isCanonical = true;
  if (!lst.dedupClusterId) {
    const dedup = await findOrCreateCluster(d, {
      source: lst.source,
      sourceId: lst.sourceId,
      url: lst.url,
      title: lst.title,
      priceEur: lst.priceEur,
      priceRaw: lst.priceRaw,
      currencyRaw: lst.currencyRaw,
      year: lst.year,
      mileageKm: lst.mileageKm,
      transmission: lst.transmission,
      bodyColor: lst.bodyColor,
      region: lst.region,
      vin: lst.vin,
      phoneNorm: lst.phoneNorm,
      description: lst.description,
      photos: ph.map((p) => ({ url: p.url })),
      raw: lst.rawJson,
    }, listingId, phashes);
    await d.update(listings).set({ dedupClusterId: dedup.clusterId }).where(eq(listings.id, listingId));
    if (dedup.kind === "joined") isCanonical = false;
  }

  // Скорим только canonical
  if (!isCanonical) return;

  const existing = await d.select({ id: scoring.listingId }).from(scoring).where(eq(scoring.listingId, listingId)).limit(1);
  if (existing.length === 0) {
    await scoreListing(env, d, listingId);
  }

  // Кандидат на нотификацию: проверяем активных подписчиков
  const sub = await d.select().from(telegramUsers).where(eq(telegramUsers.paused, false));
  const tgChatIds = sub.map((s) => s.tgChatId);
  if (tgChatIds.length > 0) {
    await env.QUEUE_NOTIFY.send({ listingId, tgChatIds });
  }
}
