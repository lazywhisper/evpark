import { eq } from "drizzle-orm";
import type { DB } from "../database";
import { telegramUsers } from "../database/schema";
import type { Env } from "../env";
import { sendMessage } from "./client";

const HELP = `Привет! Я ищу BMW E39 facelift на av.by, onliner.by, abw.by, kufar.by.
Каждое объявление прогоняю через Claude Vision и шлю сюда то, что выглядит достойно.

Команды:
/scan_now — запустить сканирование сейчас (1 раз)
/bootstrap — собрать всё, что есть в продаже сейчас (долго)
/threshold N — минимальный скор для уведомлений (текущий ${"{T}"})
/pause — поставить на паузу
/resume — снять с паузы
/stats — статистика за неделю
/help — эта справка`;

export async function handleCommand(env: Env, d: DB, chatId: string, username: string | undefined, text: string) {
  const [cmd, arg] = text.trim().split(/\s+/, 2);

  switch (cmd) {
    case "/start":
    case "/help": {
      await ensureUser(d, chatId, username, env);
      const u = (await d.select().from(telegramUsers).where(eq(telegramUsers.tgChatId, chatId)).limit(1))[0];
      await sendMessage(env, chatId, HELP.replace("{T}", String(u?.threshold ?? 70)));
      return;
    }
    case "/threshold": {
      const n = Number(arg);
      if (!Number.isFinite(n) || n < 0 || n > 100) {
        await sendMessage(env, chatId, "Используй: /threshold <число от 0 до 100>");
        return;
      }
      await d.update(telegramUsers).set({ threshold: Math.round(n) }).where(eq(telegramUsers.tgChatId, chatId));
      await sendMessage(env, chatId, `Порог установлен: ${Math.round(n)}`);
      return;
    }
    case "/pause": {
      await d.update(telegramUsers).set({ paused: true }).where(eq(telegramUsers.tgChatId, chatId));
      await sendMessage(env, chatId, "Уведомления на паузе. /resume — продолжить.");
      return;
    }
    case "/resume": {
      await d.update(telegramUsers).set({ paused: false }).where(eq(telegramUsers.tgChatId, chatId));
      await sendMessage(env, chatId, "Уведомления включены.");
      return;
    }
    case "/scan_now": {
      const sources = ["kufar", "onliner", "abw", "av"] as const;
      for (const s of sources) {
        await env.QUEUE_FETCH.send({ kind: "scan", source: s, mode: "daily" });
      }
      await sendMessage(env, chatId, "Запустил сканирование. Жди уведомлений в течение нескольких минут.");
      return;
    }
    case "/bootstrap": {
      const sources = ["kufar", "onliner", "abw", "av"] as const;
      for (const s of sources) {
        await env.QUEUE_FETCH.send({ kind: "scan", source: s, mode: "bootstrap" });
      }
      await sendMessage(env, chatId, "Запустил полный обход. Это может занять час-два.");
      return;
    }
    case "/stats": {
      await sendMessage(env, chatId, "Статистика будет в /finder в Web UI.");
      return;
    }
    default:
      await sendMessage(env, chatId, `Не знаю команду. /help — справка.`);
  }
}

async function ensureUser(d: DB, chatId: string, username: string | undefined, env: Env) {
  const existing = await d.select().from(telegramUsers).where(eq(telegramUsers.tgChatId, chatId)).limit(1);
  if (existing.length === 0) {
    await d.insert(telegramUsers).values({
      tgChatId: chatId,
      tgUsername: username,
      threshold: Number(env.DEFAULT_THRESHOLD) || 70,
    });
  }
}
