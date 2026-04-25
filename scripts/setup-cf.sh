#!/usr/bin/env bash
# Один раз выполняется на пустом Cloudflare аккаунте.
# Создаёт D1, KV, R2 bucket, 4 очереди (3 рабочие + DLQ),
# выводит ID-шники в формате готовом для wrangler.json.
#
# Запуск:
#   chmod +x scripts/setup-cf.sh
#   ./scripts/setup-cf.sh
#
# Перед запуском: wrangler login

set -euo pipefail

if ! bunx wrangler whoami >/dev/null 2>&1; then
  echo "Сначала выполни: bunx wrangler login"
  exit 1
fi

echo "→ Создаю D1 базу e39-hunter-db..."
D1_OUT=$(bunx wrangler d1 create e39-hunter-db 2>&1 || true)
echo "$D1_OUT"
D1_ID=$(echo "$D1_OUT" | grep -oE '"database_id":\s*"[^"]+"' | head -1 | sed 's/.*"\([^"]*\)"$/\1/')

echo "→ Создаю KV namespace..."
KV_OUT=$(bunx wrangler kv namespace create KV 2>&1 || true)
echo "$KV_OUT"
KV_ID=$(echo "$KV_OUT" | grep -oE '"id":\s*"[^"]+"' | head -1 | sed 's/.*"\([^"]*\)"$/\1/')

echo "→ Создаю R2 bucket..."
bunx wrangler r2 bucket create e39-hunter-photos 2>&1 || echo "(может уже существовать)"

echo "→ Создаю очереди..."
for q in e39-fetch-listings e39-score-listing e39-notify e39-dlq; do
  bunx wrangler queues create "$q" 2>&1 || echo "(возможно $q уже есть)"
done

echo
echo "==========================================================="
echo "Подставь в wrangler.json:"
echo
echo "  d1_databases[0].database_id = \"$D1_ID\""
echo "  kv_namespaces[0].id          = \"$KV_ID\""
echo "==========================================================="
echo
echo "Дальше:"
echo "  1. wrangler secret put BETTER_AUTH_SECRET"
echo "  2. wrangler secret put ANTHROPIC_API_KEY"
echo "  3. wrangler secret put TG_BOT_TOKEN"
echo "  4. wrangler secret put TG_WEBHOOK_SECRET"
echo "  5. (опц.) wrangler secret put SCRAPFLY_KEY"
echo "  6. bun run db:generate && bun run db:migrate:remote"
echo "  7. bun run deploy"
echo "  8. curl -X POST https://e39-hunter.<account>.workers.dev/api/tg/setup -H \"Authorization: Bearer \$TG_WEBHOOK_SECRET\""
echo "  9. curl -X POST https://e39-hunter.<account>.workers.dev/api/scan/bootstrap -H \"Authorization: Bearer \$TG_WEBHOOK_SECRET\""
