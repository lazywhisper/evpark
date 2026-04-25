import { and, eq, gte, inArray } from "drizzle-orm";
import type { DB } from "../database";
import { dedupClusters, listings, photos, type DedupSignals } from "../database/schema";
import type { NormalizedListing } from "../parsers/types";
import { newId } from "../lib/id";
import { fuzzyKey } from "./keys";
import { hamming } from "./phash";

const SIXTY_DAYS = 60 * 24 * 60 * 60 * 1000;

export type DedupResult =
  | { kind: "new_cluster"; clusterId: string }
  | { kind: "joined"; clusterId: string; canonicalId: string };

export async function findOrCreateCluster(
  d: DB,
  listing: NormalizedListing,
  listingId: string,
  phashes: string[],
): Promise<DedupResult> {
  const since = new Date(Date.now() - SIXTY_DAYS);

  // 1. VIN — hard match
  if (listing.vin) {
    const found = await d
      .select({ id: listings.id, dedupClusterId: listings.dedupClusterId })
      .from(listings)
      .where(and(eq(listings.vin, listing.vin), gte(listings.lastSeenAt, since)))
      .limit(1);
    const hit = found[0];
    if (hit?.dedupClusterId) return { kind: "joined", clusterId: hit.dedupClusterId, canonicalId: hit.id };
  }

  // 2. Phone
  if (listing.phoneNorm) {
    const found = await d
      .select({ id: listings.id, dedupClusterId: listings.dedupClusterId })
      .from(listings)
      .where(and(eq(listings.phoneNorm, listing.phoneNorm), gte(listings.lastSeenAt, since)))
      .limit(5);
    for (const f of found) {
      if (f.dedupClusterId) return { kind: "joined", clusterId: f.dedupClusterId, canonicalId: f.id };
    }
  }

  // 3. pHash — точное совпадение плюс hamming ≤ 6
  if (phashes.length > 0) {
    const candidates = await d
      .select({ id: photos.id, listingId: photos.listingId, phash: photos.phash })
      .from(photos)
      .where(inArray(photos.phash, phashes))
      .limit(50);
    for (const c of candidates) {
      if (!c.phash) continue;
      const dist = phashes.map((h) => hamming(h, c.phash!)).reduce((a, b) => Math.min(a, b), Infinity);
      if (dist <= 6) {
        const lst = await d.select().from(listings).where(eq(listings.id, c.listingId)).limit(1);
        if (lst[0]?.dedupClusterId)
          return { kind: "joined", clusterId: lst[0].dedupClusterId, canonicalId: lst[0].id };
      }
    }
  }

  // 4. Fuzzy
  const fk = fuzzyKey(listing);
  if (fk && listing.year && listing.priceEur != null) {
    const sameYear = await d
      .select()
      .from(listings)
      .where(and(eq(listings.year, listing.year), gte(listings.lastSeenAt, since)))
      .limit(50);
    for (const cand of sameYear) {
      const candKey = fuzzyKey(cand);
      if (candKey === fk && cand.dedupClusterId) {
        return { kind: "joined", clusterId: cand.dedupClusterId, canonicalId: cand.id };
      }
    }
  }

  // Новый кластер
  const clusterId = newId("cl");
  const signals: DedupSignals = {
    vin: listing.vin ?? undefined,
    phoneNorm: listing.phoneNorm ?? undefined,
    phashes: phashes.length ? phashes : undefined,
    fuzzyKey: fk,
  };
  await d.insert(dedupClusters).values({
    id: clusterId,
    canonicalListingId: listingId,
    signalsJson: signals,
  });
  return { kind: "new_cluster", clusterId };
}
