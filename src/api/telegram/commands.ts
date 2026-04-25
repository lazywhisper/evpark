import { and, count, eq, gte, sql } from "drizzle-orm";
import type { DB } from "../database";
import { fetchRuns, listings, notificationsLog, scoring, telegramUsers } from "../database/schema";
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
/bootstrap_av — обход только av.by (быстрее)
/rescore — перезапустить анализ для объявлений без текста
/reset — очистить базу и начать сначала (только для владельца)
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
      // av.by — первым, остальные сразу следом (daily fast)
      const sources = ["av", "kufar", "onliner", "abw"] as const;
      for (const s of sources) {
        await env.QUEUE_FETCH.send({ kind: "scan", source: s, mode: "daily" });
      }
      await sendMessage(env, chatId, "Запустил сканирование. Жди уведомлений в течение нескольких минут.");
      return;
    }
    case "/bootstrap_av": {
      await env.QUEUE_FETCH.send({ kind: "scan", source: "av", mode: "bootstrap" });
      await sendMessage(env, chatId, "Запустил bootstrap только av.by (~600 объявлений).");
      return;
    }
    case "/rescore": {
      // Ставим в очередь все listing'и у которых нет описания или нет textFindings
      const toRescore = await d
        .select({ id: listings.id })
        .from(listings)
        .leftJoin(scoring, eq(scoring.listingId, listings.id))
        .where(sql`(${listings.description} IS NULL OR ${listings.description} = '') OR ${scoring.textFindingsJson} IS NULL`);
      for (const r of toRescore) {
        await env.QUEUE_SCORE.send({ listingId: r.id });
      }
      await sendMessage(env, chatId, `Поставил в очередь ${toRescore.length} объявлений для повторного анализа.`);
      return;
    }
    case "/bootstrap": {
      // av.by — первым без задержки, остальные с лагом по минуте чтобы av успел
      // начать пагинацию.
      const sources = ["av", "kufar", "onliner", "abw"] as const;
      for (let i = 0; i < sources.length; i++) {
        const s = sources[i]!;
        await env.QUEUE_FETCH.send(
          { kind: "scan", source: s, mode: "bootstrap" },
          { delaySeconds: i === 0 ? 0 : i * 60 },
        );
      }
      await sendMessage(env, chatId, "Запустил полный обход. av.by пойдёт первым, остальные за ним.");
      return;
    }
    case "/stats": {
      await sendMessage(env, chatId, await buildStats(d));
      return;
    }
    case "/reset": {
      const owner = env.TG_OWNER_CHAT_ID?.trim();
      if (owner && chatId !== owner) {
        await sendMessage(env, chatId, "Эта команда только для владельца бота.");
        return;
      }
      const stmts = [
        "DELETE FROM reaction_features",
        "DELETE FROM notifications_log",
        "DELETE FROM scoring",
        "DELETE FROM photos",
        "DELETE FROM listings",
        "DELETE FROM dedup_clusters",
        "DELETE FROM fetch_runs",
        "DELETE FROM phash_cache",
      ];
      for (const s of stmts) await env.DB.prepare(s).run();
      await sendMessage(
        env,
        chatId,
        "🧹 База очищена. Запусти /bootstrap чтобы собрать всё заново.",
      );
      return;
    }
    default:
      await sendMessage(env, chatId, `Не знаю команду. /help — справка.`);
  }
}

async function buildStats(d: DB): Promise<string> {
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [[total], [newWeek], [scored], [avgRow], [notifWeek], [up], [down], bySource, lastRuns] =
    await Promise.all([
      d.select({ n: count() }).from(listings),
      d.select({ n: count() }).from(listings).where(gte(listings.firstSeenAt, since7d)),
      d.select({ n: count() }).from(scoring),
      d.select({ avg: sql<number>`avg(${scoring.overallScore})` }).from(scoring),
      d.select({ n: count() }).from(notificationsLog).where(gte(notificationsLog.sentAt, since7d)),
      d
        .select({ n: count() })
        .from(notificationsLog)
        .where(and(eq(notificationsLog.reaction, "up"), gte(notificationsLog.sentAt, since7d))),
      d
        .select({ n: count() })
        .from(notificationsLog)
        .where(and(eq(notificationsLog.reaction, "down"), gte(notificationsLog.sentAt, since7d))),
      d.select({ source: listings.source, n: count() }).from(listings).groupBy(listings.source),
      d
        .select({
          source: fetchRuns.source,
          newCount: fetchRuns.listingsNew,
          finishedAt: fetchRuns.finishedAt,
        })
        .from(fetchRuns)
        .where(gte(fetchRuns.startedAt, since7d))
        .orderBy(fetchRuns.startedAt),
    ]);

  const srcLine = bySource
    .map((r) => `  ${r.source}: ${r.n}`)
    .join("\n");

  const lastRunMap: Record<string, { count: number; at: Date | null }> = {};
  for (const r of lastRuns) {
    const e = lastRunMap[r.source] ?? { count: 0, at: null };
    e.count += r.newCount ?? 0;
    e.at = r.finishedAt ?? e.at;
    lastRunMap[r.source] = e;
  }
  const runsLine = Object.entries(lastRunMap)
    .map(([src, v]) => {
      const when = v.at ? new Date(v.at).toLocaleDateString("ru-BY") : "?";
      return `  ${src}: +${v.count} (${when})`;
    })
    .join("\n");

  const avgScore = avgRow?.avg != null ? Math.round(Number(avgRow.avg)) : "—";
  const lines = [
    "<b>📊 Статистика E39 Hunter</b>",
    "",
    `<b>Объявления:</b>`,
    `  всего в базе: ${total?.n ?? 0}`,
    `  новых за 7 дней: ${newWeek?.n ?? 0}`,
    `  проверено Claude: ${scored?.n ?? 0} (ср. скор ${avgScore})`,
    srcLine ? `\n<b>По источникам:</b>\n${srcLine}` : "",
    `\n<b>Уведомления (7 дней):</b>`,
    `  отправлено: ${notifWeek?.n ?? 0}  👍 ${up?.n ?? 0}  👎 ${down?.n ?? 0}`,
    runsLine ? `\n<b>Новые за 7 дней по источнику:</b>\n${runsLine}` : "",
  ]
    .filter((l) => l !== "")
    .join("\n");

  return lines;
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
