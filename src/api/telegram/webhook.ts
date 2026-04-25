import type { DB } from "../database";
import type { Env } from "../env";
import { handleCallback } from "./callbacks";
import { handleCommand } from "./commands";

type Update = {
  message?: {
    chat: { id: number };
    from?: { username?: string };
    text?: string;
  };
  callback_query?: {
    id: string;
    from: { id: number; username?: string };
    data?: string;
    message?: { chat: { id: number } };
  };
};

export async function handleUpdate(env: Env, d: DB, update: Update) {
  if (update.message?.text) {
    const chatId = String(update.message.chat.id);
    await handleCommand(env, d, chatId, update.message.from?.username, update.message.text);
    return;
  }
  if (update.callback_query?.data) {
    const chatId = String(update.callback_query.message?.chat.id ?? update.callback_query.from.id);
    await handleCallback(env, d, update.callback_query.id, chatId, update.callback_query.data);
    return;
  }
}
