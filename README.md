# jinx-be

Backend for jinx.to — NestJS, Prisma, Bull on Redis, Supabase Storage,
crypto-payment processors via Tatum.

## Stack

- **Runtime**: Node 20+, TypeScript 5.9
- **Framework**: NestJS 11
- **DB**: PostgreSQL 16 via Prisma 6
- **Queue/cache**: Redis 7 (Bull, cache-manager-ioredis)
- **Storage**: Supabase Storage (`user-uploads`, `public-assets` buckets)
- **Email**: Resend
- **Crypto**: Tatum unified API (BTC, ETH, LTC, BCH, TRX) + Kraken for rates

## Local development

```bash
yarn install
yarn generate                    # prisma client
docker compose up -d             # local postgres + redis (uses ./docker-compose.yml)
yarn migrate                     # prisma migrate dev
yarn dev                         # nest start --watch
```

The app listens on `http://0.0.0.0:3001`. Bull Board is available at
`/admin/queues` when `APP_ENV !== 'production'`.

Required env vars (see `.env.example` if present, else read `src/app.module.ts`
and `src/common/`): `DATABASE_URL`, `REDIS_HOST/PORT/PASSWORD`, the auth
secrets, Supabase keys, Resend, and the crypto wallet block.

## API + worker split

This image runs in one of two roles, selected by `APP_ROLE`:

- `APP_ROLE=api` — boots `AppModule`, serves HTTP on `HTTP_PORT` (default 3001).
  Bull processors and `@Cron` decorators are **not** registered.
- `APP_ROLE=worker` — boots `WorkerAppModule` via `createApplicationContext`,
  no HTTP. Registers Bull processors (email, activity-log, crypto-payment-*),
  `ScheduleModule.forRoot()`, and all `@Cron` handlers.

Toggling lives in `src/common/utils/role.util.ts` (`workerOnlyProviders()`).
In local dev, `APP_ROLE` is unset → both run together (single-process).

## Scripts

| Script | Purpose |
|---|---|
| `yarn dev` | Watch-mode dev server |
| `yarn build` | NestJS production build → `dist/` |
| `yarn start` | Run `dist/main` (used by the prod container) |
| `yarn generate` | Regenerate Prisma client |
| `yarn migrate` | `prisma migrate dev` (local dev only) |
| `yarn migrate:prod` | `prisma migrate deploy` (run by the `migrator` compose service) |
| `yarn seed:admin` | Seed the initial admin user (needs `CLI_PATH=./dist/cli.js` in prod) |
| `yarn seed:all` | Seed admin + users + wallets + products + coupons + tickets |

In production containers, the source tree isn't copied — only `dist/` is. Any
`nestjs-command` invocation must export `CLI_PATH=./dist/cli.js`:

```bash
docker compose exec -e CLI_PATH=./dist/cli.js api yarn seed:admin
```

## Migrations

Prisma migrations live in `prisma/migrations/`. The deploy pipeline runs
`prisma migrate deploy` automatically via the `migrator` compose service before
`api` and `worker` start. If a migration fails, `api`/`worker` won't start —
the previous version keeps running.

To create a new migration locally:

```bash
yarn migrate    # interactive — prompts for a name
git add prisma/migrations
```

## Health & observability

- `GET /health` — Terminus-based liveness + Prisma DB check (used by Docker
  healthcheck and Nginx upstream).
- Logs: structured JSON via `nestjs-pino`. Production containers log to stdout;
  Docker captures to `json-file` (10 MB × 3 rotation).
- Errors: Sentry if `SENTRY_DSN` is set.

## Production deployment

Production deploy lives in the sibling [`deploy`](../deploy/) repo. Read
`deploy/documents/` for the operational runbook. TL;DR:

```bash
cd /opt/jinx/deploy
./scripts/deploy.sh
```
