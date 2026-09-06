# NFS QR

Monorepo Next.js + DDD para QRs dinámicos (local + Docker).

## Levantar

```bash
docker compose up -d --build
```

App: http://localhost:3000

Demo: `Luca-QRS@NFS.com` / `Luca123!`

## Desarrollo local

```bash
pnpm install
docker compose up -d postgres
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm --filter @nfs/domain build
pnpm --filter @nfs/application build
pnpm --filter @nfs/infrastructure build
pnpm dev
```

## Tests

```bash
pnpm test
```
