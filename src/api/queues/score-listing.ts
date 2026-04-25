import { eq } from "drizzle-orm";
import type { DB } from "../database";
import { listings, photos, scoring } from "../database/schema";
import { findOrCreateCluster } from "../dedup/matcher";
import { fingerprintFromUrl } from "../dedup/phash";
import type { Env, ScoreListingMessage } from "../env";
import { newId } from "../lib/id";
import { getParser } from "../parsers/registry";
import { scoreListing } from "../scoring/score";

// $6500 минимум — машины ниже этого не рассматриваем.
const PRICE_FLOOR_USD_DEFAULT = 6500;

function priceFloorUsd(env: Env): number {
  const raw = env.PRICE_FLOOR_USD?.trim() ?? env.PRICE_FLOOR_EUR?.trim();
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : PRICE_FLOOR_USD_DEFAULT;
}

export async function processScoreMessage(env: Env, d: DB, msg: ScoreListingMessage) {
  const { listingId } = msg;
  if (!listingId) return;

  // Цена-гейт: дешевле порога не скорим и не уведомляем — экономим Claude-токены.
  const lstPre = (await d.select({ priceUsd: listings.priceUsd }).from(listings).where(eq(listings.id, listingId)).limit(1))[0];
  if (lstPre?.priceUsd != null && lstPre.priceUsd < priceFloorUsd(env)) {
    console.log(`[score] skip ${listingId} priceUsd=${lstPre.priceUsd} < floor`);
    return;
  }

  // 0. Подтягиваем полное описание со страницы объявления, если оно слабое.
  //    Vision слабоват для оценки старых E39 на постановочных фото — основной
  //    сигнал берём из описания продавца. Fetch'им только если description короткое.
  const lstEarly = (await d.select().from(listings).where(eq(listings.id, listingId)).limit(1))[0];
  if (lstEarly && (lstEarly.description ?? "").length < 200) {
    try {
      const parser = getParser(env, lstEarly.source);
      if (parser.fetchDetail) {
        const detail = await parser.fetchDetail(lstEarly.sourceId, lstEarly.url);
        if (detail) {
          const updates: Record<string, unknown> = {};
          if (detail.description && detail.description.length > (lstEarly.description ?? "").length) {
            updates.description = detail.description;
          }
          if (detail.vin && !lstEarly.vin) updates.vin = detail.vin;
          if (detail.phoneNorm && !lstEarly.phoneNorm) updates.phoneNorm = detail.phoneNorm;
          if (detail.region && !lstEarly.region) updates.region = detail.region;
          if (Object.keys(updates).length > 0) {
            await d.update(listings).set(updates).where(eq(listings.id, listingId));
          }
          // Доливаем фото если их меньше 3
          if (detail.extraPhotos.length > 0) {
            const have = await d.select().from(photos).where(eq(photos.listingId, listingId));
            if (have.length < 3) {
              const toAdd = detail.extraPhotos.slice(0, 6 - have.length);
              for (let i = 0; i < toAdd.length; i++) {
                const url = toAdd[i]!.url;
                if (have.some((p) => p.url === url)) continue;
                await d.insert(photos).values({
                  id: newId("ph"),
                  listingId,
                  url,
                  orderIdx: have.length + i,
                });
              }
            }
          }
          console.log(
            `[score:detail] ${lstEarly.source}/${lstEarly.sourceId} desc=${detail.description?.length ?? 0}ch photos=${detail.extraPhotos.length}`,
          );
        } else {
          console.warn(`[score:detail] ${lstEarly.source}/${lstEarly.sourceId} fetchDetail returned null — no description`);
        }
      }
    } catch (err) {
      console.warn("[score:detail] failed", err);
    }
  }

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
      priceUsd: lst.priceUsd,
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

  await env.QUEUE_NOTIFY.send({ listingId });
}
