# Migration: Add image_prompt Column

The production database is missing the `image_prompt` column in the `events` table. This needs to be added.

## ✅ Easiest Option: Use the Script

1. **Get your Railway DATABASE_URL:**
   - Go to Railway Dashboard → Your Project → PostgreSQL Service
   - Click on the "Variables" tab
   - Copy the `DATABASE_URL` value

2. **Run the migration script:**
   ```bash
   # Set the production DATABASE_URL (temporarily)
   export DATABASE_URL="your_railway_database_url_here"
   
   # Run the migration script
   npx tsx scripts/add-image-prompt-column.ts
   ```

   Or if you prefer, you can create a temporary `.env.production` file:
   ```bash
   echo 'DATABASE_URL="your_railway_database_url_here"' > .env.production
   npx tsx scripts/add-image-prompt-column.ts
   ```

## Option 2: Use psql (Command Line)

If you have `psql` installed:

```bash
# Get DATABASE_URL from Railway (same as above)
psql "your_railway_database_url" -c "ALTER TABLE events ADD COLUMN IF NOT EXISTS image_prompt TEXT;"
```

## Option 3: Use a Database Client

Install a PostgreSQL client like:
- **TablePlus** (Mac/Windows) - https://tableplus.com
- **DBeaver** (Cross-platform) - https://dbeaver.io
- **pgAdmin** (Cross-platform) - https://www.pgadmin.org

Then:
1. Connect using your Railway DATABASE_URL
2. Open a SQL query window
3. Run: `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "image_prompt" TEXT;`

## Option 4: Use Prisma Migrate

```bash
# Set DATABASE_URL to production
export DATABASE_URL="your_railway_database_url"

# Run migrations
npx prisma migrate deploy
```

## Verify Migration

After running, verify the column exists:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'events' AND column_name = 'image_prompt';
```

You should see `image_prompt` in the results.

## Note

The code has been updated to handle the missing column gracefully, so the site will work even before the migration is run. However, image prompts won't be saved until the column is added.
