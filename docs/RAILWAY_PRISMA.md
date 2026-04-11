# Railway + Prisma notes

## P2022 (missing column) — `share_count`, `tiktok_*`, etc.

If deploy uses an existing Postgres DB and `prisma migrate deploy` did not run (e.g. **P3005** — schema not empty), columns added in `schema.prisma` may be missing while Prisma Client expects them (e.g. `timelines.share_count`, `events.omit_likeness_reference`, `users.tiktok_access_token`). Missing columns surface as **P2022**; Next.js may surface that as a generic app error whose **digest** matches the Prisma failure.

**Automatic fix:** `start:with-migrations` runs `scripts/ensure-production-schema.cjs`, which executes idempotent `ALTER TABLE … ADD COLUMN IF NOT EXISTS …` for known drift (see `STATEMENTS` in that file). Extend that list when production logs show **P2022** for a new column.

## P3005 — “database schema is not empty”

This usually means production was created manually or with `db push`, so `_prisma_migrations` doesn’t match the migration folder.

Options:

1. **Rely on `ensure-production-schema.cjs`** for critical columns (current approach for `share_count`).
2. **Baseline** (advanced): follow [Prisma baselining](https://www.prisma.io/docs/guides/migrate/developing-and-production#baselining-a-database) and mark historical migrations as applied.

After baselining, `prisma migrate deploy` on Railway can succeed for **new** migrations.

## Tracking migrations in git

`prisma/migrations/` should be **committed** so CI/production images include the full history. Do not gitignore this folder.
