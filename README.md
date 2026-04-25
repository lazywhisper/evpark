# E39 Hunter

Сервис для поиска **BMW 5-series E39 facelift (2000–2003)** на белорусских
автоплощадках. Раз в день сканирует **av.by, onliner.by, abw.by, kufar.by**,
дедуплицирует объявления между сайтами, прогоняет каждое новое через **Claude
Vision** (фото) и **Claude** (текст-анализ психотипа продавца), и шлёт
уведомления в **Telegram** с кнопками 👍/👎 для дообучения предпочтений.

Single-user, для личного использования. Стек: Hono + Cloudflare Workers + D1
+ R2 + KV + Queues + AI + Browser Rendering.

## Quick Start

```bash
bun install

# 1. Создаём D1 базу и KV namespace в Cloudflare, ID-шники подставляем в wrangler.json
wrangler d1 create e39-hunter-db
wrangler kv namespace create KV
wrangler r2 bucket create e39-hunter-photos
wrangler queues create e39-fetch-listings
wrangler queues create e39-score-listing
wrangler queues create e39-notify
wrangler queues create e39-dlq

# 2. Заполняем .env (см. .env.example), кладём секреты:
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put TG_BOT_TOKEN
wrangler secret put TG_WEBHOOK_SECRET
wrangler secret put TG_OWNER_CHAT_ID
wrangler secret put SCRAPFLY_KEY        # опционально

# 3. Миграции
bun db:generate
bun db:migrate:remote

# 4. Деплой
bun run deploy

# 5. Привязываем Telegram webhook (один раз)
curl -X POST https://e39-hunter.<account>.workers.dev/api/tg/setup \
  -H "Authorization: Bearer $TG_WEBHOOK_SECRET"

# 6. Bootstrap всего, что есть в продаже сейчас
curl -X POST https://e39-hunter.<account>.workers.dev/api/scan/bootstrap \
  -H "Authorization: Bearer $TG_WEBHOOK_SECRET"
```

## Архитектура

См. `/root/.claude/plans/bmw-inherited-nebula.md` для полного плана.

```
Cron 06:00 UTC ─► fetch-listings queue ─► parsers/{source}
                                              │
                                              ▼
                                       D1 + R2 (photos)
                                              │
                                              ▼
                                  score-listing queue
                                              │
                                              ▼
                              dedup + Claude Vision + Claude text
                                              │
                                              ▼
                                       notify queue
                                              │
                                              ▼
                                       Telegram Bot API
```

### Источники

| Источник | Стратегия | Заметки |
|---|---|---|
| `kufar.by` | JSON `api.kufar.by/search-api/v1/search/rendered-paginated` | дружественный robots.txt |
| `onliner.by` | публичный JSON `baraholka.onliner.by/sdapi/...` | ToS-серое; рейт-лимит ≤1 RPS |
| `abw.by` | sitemap.xml diff + HTML | `/car/` запрещён в robots, sitemap — открыт |
| `av.by` | ScrapFly (primary) или Fly.io+Camoufox (fallback) | Cloudflare Bot Management → исходящие IP CF не пройдут |

### Cron

`0 6 * * *` UTC = 09:00 Минск. Один scan в день для всех источников.
Bootstrap (полный обход всего рынка) — через `POST /api/scan/bootstrap`.
Manual scan через Telegram `/scan_now`.

## Структура

- `src/api/` — Hono backend, parsers, dedup, scoring, telegram, queues
- `src/web/` — React UI (dashboard, фильтры, история)
- `src/api/database/schema.ts` — Drizzle схема
- `src/api/migrations/` — drizzle-kit migrations

## Agent Rules

**CRITICAL: Tailwind CSS v4.** Нет `tailwind.config.js`, нет `postcss.config.js`,
нет `@tailwind` директив. Конфиг — в `@theme` в `src/web/styles.css` плюс
`@tailwindcss/vite` плагин.

**IMPORTANT:** Не угадывай API пакетов. Проверяй версию в `package.json` и
читай `node_modules/<pkg>/`.

## Этика

Single-user, личное использование. ≤1 RPS, уважение `Retry-After`/`429`/`503`,
не публикуем данные наружу, R2 хранит фото только для дедупа с TTL 30 дней.
