#!/usr/bin/env bash
# Clear BullMQ repeatable cron keys so provider flips (Google-only) take effect.
# Usage: bash clear-stale-bullmq-repeatables.sh "redis://..."
set -euo pipefail

REDIS_URL="${1:-${REDIS_URL:-}}"
if [[ -z "${REDIS_URL}" ]]; then
  echo "Usage: $0 <REDIS_URL>" >&2
  exit 1
fi

if ! command -v redis-cli >/dev/null 2>&1; then
  echo "redis-cli is required" >&2
  exit 1
fi

PREFIX="${REDIS_QUEUE_PREFIX:-bull}"
PATTERN="${PREFIX}:cron-queue:repeat:*"

echo "Scanning ${PATTERN} on ${REDIS_URL%%@*}@..."
count=0
while IFS= read -r key; do
  [[ -z "${key}" ]] && continue
  redis-cli -u "${REDIS_URL}" DEL "${key}" >/dev/null
  count=$((count + 1))
  echo "deleted ${key}"
done < <(redis-cli -u "${REDIS_URL}" --scan --pattern "${PATTERN}")

echo "Done. Removed ${count} repeatable key(s)."
echo "Restart the API so entrypoint can re-run cron:register:all."
