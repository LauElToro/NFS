#!/bin/sh
set -e

cd /app/packages/infrastructure

echo "[nfs] applying migrations..."
i=0
until pnpm exec prisma migrate deploy; do
  i=$((i+1))
  if [ "$i" -gt 30 ]; then
    echo "[nfs] migrate failed after retries"
    exit 1
  fi
  echo "[nfs] db not ready, retry $i..."
  sleep 2
done

if [ "$RUN_SEED" = "true" ]; then
  echo "[nfs] seeding database..."
  pnpm exec tsx prisma/seed.ts
fi

echo "[nfs] starting Next.js..."
cd /app/apps/web
exec pnpm exec next start -H 0.0.0.0 -p 3000