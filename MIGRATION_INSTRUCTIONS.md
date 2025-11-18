# Twitter Token Migration Instructions

## Option 1: Via Admin Endpoint (Recommended)

1. Wait for Railway deployment to complete
2. Sign in to https://www.storywall.com with kunle2000@gmail.com
3. Visit: https://www.storywall.com/api/admin/migrate-twitter-tokens
4. You should see a success message

## Option 2: Via Script (If you have production DATABASE_URL)

1. Set your production DATABASE_URL:
   ```bash
   export DATABASE_URL="your_production_database_url"
   ```

2. Run the migration script:
   ```bash
   npx tsx scripts/migrate-twitter-tokens.ts
   ```

## Option 3: Direct SQL (Via Railway Dashboard)

1. Go to Railway Dashboard → Your Project → PostgreSQL Service
2. Click on the "Data" tab or "Query" tab
3. Run this SQL:

```sql
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "twitter_access_token" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "twitter_refresh_token" TEXT;
```

## Verify Migration

After running, verify the columns exist:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('twitter_access_token', 'twitter_refresh_token');
```

You should see both columns in the results.
