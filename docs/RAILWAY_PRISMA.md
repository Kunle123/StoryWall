# Railway + Prisma notes

## `share_count` / P2022 (missing column)

If deploy uses an existing Postgres DB and `prisma migrate deploy` did not run (e.g. **P3005** — schema not empty), the `timelines.share_count` column might be missing while the app schema expects it.

**Automatic fix:** the `start:with-migrations` script runs `scripts/ensure-production-schema.cjs`, which executes:

`ALTER TABLE timelines ADD COLUMN IF NOT EXISTS share_count …`

so the column is created even when migrations are skipped.

## P3005 — “database schema is not empty”

This usually means production was created manually or with `db push`, so `_prisma_migrations` doesn’t match the migration folder.

Options:

1. **Rely on `ensure-production-schema.cjs`** for critical columns (current approach for `share_count`).
2. **Baseline** (advanced): follow [Prisma baselining](https://www.prisma.io/docs/guides/migrate/developing-and-production#baselining-a-database) and mark historical migrations as applied.

After baselining, `prisma migrate deploy` on Railway can succeed for **new** migrations.

## Tracking migrations in git

`prisma/migrations/` should be **committed** so CI/production images include the full history. Do not gitignore this folder.
