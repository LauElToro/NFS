FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable \
  && corepack prepare pnpm@9.15.0 --activate

COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/domain/package.json packages/domain/
COPY packages/application/package.json packages/application/
COPY packages/infrastructure/package.json packages/infrastructure/

RUN pnpm install

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=postgresql://nfs:nfs_secret@postgres:5432/nfs_qr?schema=public
ENV NODE_ENV=production

RUN pnpm --filter @nfs/domain build \
  && pnpm --filter @nfs/application build \
  && pnpm --filter @nfs/infrastructure db:generate \
  && pnpm --filter @nfs/infrastructure build \
  && pnpm --filter @nfs/web build

RUN sed -i 's/\r$//' /app/docker/entrypoint.sh && chmod +x /app/docker/entrypoint.sh

ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000

ENTRYPOINT ["/app/docker/entrypoint.sh"]
