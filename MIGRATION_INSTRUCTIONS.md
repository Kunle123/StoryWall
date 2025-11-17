# Migration: Add image_prompt Column

The production database is missing the `image_prompt` column in the `events` table. This needs to be added.

## Option 1: Run Migration via Railway (Recommended)

1. Go to Railway Dashboard → Your Project → PostgreSQL Service
2. Click on the "Data" tab or "Query" tab
3. Run this SQL:

```sql
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "image_prompt" TEXT;
```

## Option 2: Run Migration via Script

If you have access to the production database connection string:

```bash
# Set DATABASE_URL to production database
export DATABASE_URL="your_production_database_url"

# Run the migration
npx prisma migrate deploy
```

Or run the SQL script directly:

```bash
psql $DATABASE_URL -f scripts/add-image-prompt-column.sql
```

## Option 3: Use Prisma Migrate

```bash
# Make sure DATABASE_URL points to production
npx prisma migrate deploy
```

This will apply the migration file: `prisma/migrations/20251117220000_add_image_prompt_to_events/migration.sql`

## Verify Migration

After running the migration, verify the column exists:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'events' AND column_name = 'image_prompt';
```

You should see `image_prompt` in the results.

## Note

The code has been updated to handle the missing column gracefully, so the site will work even before the migration is run. However, image prompts won't be saved until the column is added.

