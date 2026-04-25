import { eq, sql } from "drizzle-orm";
import type { DB } from "../database";
import { fetchRuns, listings, photos } from "../database/schema";
import type { Env, FetchListingsMessage } from "../env";
import { isLikelyE39 } from "../filter/e39";
import { newId } from "../lib/id";
import { acquireToken } from "../lib/ratelimit";
import { getRates } from "../lib/rates";
import { getParser } from "../parsers/registry";
import type { NormalizedListing } from "../parsers/types";

export async function processFetchMessage(env: Env, d: DB, msg: FetchListingsMessage) {
  if (msg.kind !== "scan") return;

  const parser = getParser(env, msg.source);
  const ok = await acquireToken(env.KV, msg.source, msg.source === "av" ? 0.2 : 1);
  if (!ok) {
    console.warn(`[${msg.source}] rate-limited, requeueing`);
    await env.QUEUE_FETCH.send(msg, { delaySeconds: 30 });
    return;
  }

  const runIds = await d
    .insert(fetchRuns)
    .values({ source: msg.source, pagesFetched: 0, listingsNew: 0, listingsUpdated: 0 })
    .returning({ id: fetchRuns.id });
  const runId = runIds[0]?.id;

  let newCount = 0;
  let updCount = 0;
  let pages = 0;
  const errors: string[] = [];

  let passedFilter = 0;
  try {
    const rates = await getRates(env);
    const result = await parser.scan({ cursor: msg.cursor, mode: msg.mode, rates });
    pages = 1;
    const got = result.listings.length;

    const minYear = Number(env.MIN_YEAR ?? "2001");
    for (const raw of result.listings) {
      if (!isLikelyE39(raw)) continue;
      // Hard year gate: ниже MIN_YEAR (по умолчанию 2001) пропускаем целиком —
      // не сохраняем и не скорим.
      if (raw.year != null && Number.isFinite(minYear) && raw.year < minYear) continue;
      passedFilter++;
      try {
        const { id, isNew } = await upsertListing(d, raw);
        if (isNew) {
          newCount++;
          await env.QUEUE_SCORE.send({ listingId: id });
        } else {
          updCount++;
        }
      } catch (err) {
        errors.push(String(err));
      }
    }

    console.log(
      `[fetch:${msg.source}] cursor=${msg.cursor ?? "-"} got=${got} filtered=${passedFilter} new=${newCount} upd=${updCount} next=${result.nextCursor ?? "-"}`,
    );

    if (result.nextCursor && msg.mode === "bootstrap") {
      await env.QUEUE_FETCH.send({ ...msg, cursor: result.nextCursor }, { delaySeconds: 5 });
    }
  } catch (err) {
    console.error(`[fetch:${msg.source}] error`, err);
    errors.push(String(err));
  } finally {
    if (runId) {
      await d
        .update(fetchRuns)
        .set({
          finishedAt: new Date(),
          pagesFetched: pages,
          listingsNew: newCount,
          listingsUpdated: updCount,
          errorsJson: errors.length ? errors : null,
        })
        .where(eq(fetchRuns.id, runId));
    }
  }
}

async function upsertListing(d: DB, raw: NormalizedListing): Promise<{ id: string; isNew: boolean }> {
  const existing = await d
    .select({ id: listings.id })
    .from(listings)
    .where(sql`${listings.source} = ${raw.source} AND ${listings.sourceId} = ${raw.sourceId}`)
    .limit(1);

  if (existing.length > 0) {
    const id = existing[0]!.id;
    await d
      .update(listings)
      .set({
        title: raw.title,
        priceUsd: raw.priceUsd,
        priceRaw: raw.priceRaw,
        currencyRaw: raw.currencyRaw,
        year: raw.year,
        mileageKm: raw.mileageKm,
        transmission: raw.transmission,
        bodyColor: raw.bodyColor,
        region: raw.region,
        vin: raw.vin,
        phoneNorm: raw.phoneNorm,
        description: raw.description,
        rawJson: raw.raw as Record<string, unknown>,
        lastSeenAt: new Date(),
      })
      .where(eq(listings.id, id));
    return { id, isNew: false };
  }

  const id = newId("lst");
  await d.insert(listings).values({
    id,
    source: raw.source,
    sourceId: raw.sourceId,
    url: raw.url,
    title: raw.title,
    priceEur: raw.priceEur,
    priceRaw: raw.priceRaw,
    currencyRaw: raw.currencyRaw,
    year: raw.year,
    mileageKm: raw.mileageKm,
    transmission: raw.transmission,
    bodyColor: raw.bodyColor,
    region: raw.region,
    vin: raw.vin,
    phoneNorm: raw.phoneNorm,
    description: raw.description,
    rawJson: raw.raw as Record<string, unknown>,
  });
  for (let i = 0; i < raw.photos.length; i++) {
    const p = raw.photos[i]!;
    await d.insert(photos).values({
      id: newId("ph"),
      listingId: id,
      url: p.url,
      width: p.width,
      height: p.height,
      orderIdx: i,
    });
  }
  return { id, isNew: true };
}
