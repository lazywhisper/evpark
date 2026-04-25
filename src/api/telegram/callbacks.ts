import { eq } from "drizzle-orm";
import type { DB } from "../database";
import { listings, notificationsLog, reactionFeatures, scoring } from "../database/schema";
import type { Env } from "../env";
import { answerCallback } from "./client";

// callback_data формат: "r:up:<listingId>" или "r:down:<listingId>"
export async function handleCallback(env: Env, d: DB, callbackQueryId: string, chatId: string, data: string) {
  const parts = data.split(":");
  if (parts[0] !== "r" || parts.length < 3) {
    await answerCallback(env, callbackQueryId);
    return;
  }
  const reaction = parts[1] as "up" | "down";
  const listingId = parts[2]!;

  const lst = (await d.select().from(listings).where(eq(listings.id, listingId)).limit(1))[0];
  const sc = (await d.select().from(scoring).where(eq(scoring.listingId, listingId)).limit(1))[0];

  if (lst) {
    await d.insert(reactionFeatures).values({
      listingId,
      reaction,
      snapshotJson: { listing: lst, scoring: sc ?? null },
    });
  }
  await d
    .update(notificationsLog)
    .set({ reaction, reactionAt: new Date() })
    .where(eq(notificationsLog.listingId, listingId));

  await answerCallback(env, callbackQueryId, reaction === "up" ? "👍 учёл" : "👎 учёл");
}
