import type { DB } from "../database";
import type { Env, NotifyMessage } from "../env";
import { notifyListing } from "../notifier";

export async function processNotifyMessage(env: Env, d: DB, msg: NotifyMessage) {
  await notifyListing(env, d, msg.listingId);
}
