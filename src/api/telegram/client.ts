import type { Env } from "../env";

const API = "https://api.telegram.org";

async function call<T = unknown>(env: Env, method: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}/bot${env.TG_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { ok: boolean; result?: T; description?: string };
  if (!json.ok) throw new Error(`tg ${method}: ${json.description ?? "unknown"}`);
  return json.result as T;
}

export type InlineKeyboardButton = {
  text: string;
  callback_data?: string;
  url?: string;
};

export async function sendMessage(
  env: Env,
  chatId: string,
  text: string,
  opts?: { reply_markup?: { inline_keyboard: InlineKeyboardButton[][] }; parse_mode?: "HTML" | "MarkdownV2" },
) {
  return call<{ message_id: number }>(env, "sendMessage", {
    chat_id: chatId,
    text,
    disable_web_page_preview: false,
    ...opts,
  });
}

export async function sendMediaGroup(env: Env, chatId: string, photoUrls: string[], caption: string) {
  if (photoUrls.length === 0) return null;
  const media = photoUrls.slice(0, 10).map((url, i) => ({
    type: "photo" as const,
    media: url,
    ...(i === 0 ? { caption, parse_mode: "HTML" as const } : {}),
  }));
  return call<Array<{ message_id: number }>>(env, "sendMediaGroup", { chat_id: chatId, media });
}

export async function answerCallback(env: Env, callbackQueryId: string, text?: string) {
  return call(env, "answerCallbackQuery", { callback_query_id: callbackQueryId, text });
}

export async function setWebhook(env: Env, url: string) {
  return call(env, "setWebhook", {
    url,
    secret_token: env.TG_WEBHOOK_SECRET,
    allowed_updates: ["message", "callback_query"],
  });
}
