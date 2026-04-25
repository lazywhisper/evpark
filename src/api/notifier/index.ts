import { and, eq } from "drizzle-orm";
import type { DB } from "../database";
import { listings, notificationsLog, photos, scoring, telegramUsers } from "../database/schema";
import type { Env } from "../env";
import { newId } from "../lib/id";
import { sendMediaGroup, sendMessage } from "../telegram/client";
import { formatListingCaption } from "../telegram/format";

export async function notifyListing(env: Env, d: DB, listingId: string) {
  const lst = (await d.select().from(listings).where(eq(listings.id, listingId)).limit(1))[0];
  if (!lst) return;
  const sc = (await d.select().from(scoring).where(eq(scoring.listingId, listingId)).limit(1))[0] ?? null;
  if (!sc) return;

  const recipients = await d
    .select()
    .from(telegramUsers)
    .where(eq(telegramUsers.paused, false));

  const eligible = recipients.filter((u) => sc.overallScore >= u.threshold);
  if (eligible.length === 0) return;

  const ph = await d.select().from(photos).where(eq(photos.listingId, listingId)).limit(3);
  const photoUrls = ph.map((p) => p.url).filter(Boolean);
  const caption = formatListingCaption(lst, sc);

  for (const u of eligible) {
    // Дубль-защита
    const existing = await d
      .select({ id: notificationsLog.id })
      .from(notificationsLog)
      .where(and(eq(notificationsLog.listingId, listingId), eq(notificationsLog.tgChatId, u.tgChatId)))
      .limit(1);
    if (existing.length > 0) continue;

    let messageId: number | null = null;
    try {
      if (photoUrls.length > 0) {
        const msgs = await sendMediaGroup(env, u.tgChatId, photoUrls, caption);
        messageId = msgs?.[0]?.message_id ?? null;
      } else {
        const msg = await sendMessage(env, u.tgChatId, caption, { parse_mode: "HTML" });
        messageId = msg.message_id;
      }
      // Кнопки реакций отдельным сообщением (mediaGroup не поддерживает inline keyboard)
      await sendMessage(env, u.tgChatId, "Что думаешь?", {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "👍 интересно", callback_data: `r:up:${listingId}` },
              { text: "👎 мимо", callback_data: `r:down:${listingId}` },
              { text: "🔗 источник", url: lst.url },
            ],
          ],
        },
      });
    } catch (err) {
      console.error("[notify] send failed", err);
    }

    await d.insert(notificationsLog).values({
      id: newId("ntf"),
      listingId,
      tgChatId: u.tgChatId,
      messageId: messageId ?? undefined,
    }).onConflictDoNothing();
  }
}
