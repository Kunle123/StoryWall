# Viewing Test Data on Railway (Production)

This guide shows you how to view and create test data on your **deployed Railway app** (not localhost).

## 🚀 Step 1: Ensure App is Deployed

### Check Railway Deployment

1. **Go to Railway Dashboard**: https://railway.app/dashboard
2. **Select your StoryWall project**
3. **Check deployment status**:
   - Make sure your web service is running
   - Check the "Deployments" tab for latest deployment
   - Ensure build succeeded

### Get Your Railway App URL

1. In Railway Dashboard → Your Project
2. Click on your **web service** (not PostgreSQL)
3. Go to **"Settings"** tab
4. Find **"Generate Domain"** or check existing domain
5. Copy the URL (e.g., `https://your-app.railway.app`)

## 🗄️ Step 2: Set Up Database Schema on Railway

### Option A: Run Migrations via Railway CLI (Recommended)

```bash
# Install Railway CLI if not installed
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations on Railway database
railway run npx prisma migrate deploy
```

### Option B: Push Schema Directly

```bash
# Connect to Railway database
railway connect postgres

# Or use Railway's DATABASE_URL
DATABASE_URL="[from Railway]" npx prisma db push
```

**Note**: Railway automatically sets `DATABASE_URL` when you connect via CLI.

## 👤 Step 3: Create Test Data on Railway

### Method 1: Using Railway CLI (Easiest)

```bash
# Link to project
railway link

# Get Railway DATABASE_URL and create test data
railway run --service postgres tsx scripts/create-test-data-railway.ts
```

### Method 2: Using Railway Dashboard

1. Go to **Railway Dashboard → Your Project → PostgreSQL Service**
2. Click **"Variables"** tab
3. Copy the `DATABASE_URL`
4. Run locally with Railway's connection string:

```bash
DATABASE_URL="[paste from Railway]" tsx scripts/create-test-data-railway.ts
```

### Method 3: Manual Setup via Railway Database Browser

1. Go to **Railway Dashboard → PostgreSQL Service → Data Tab**
2. Use the SQL query editor to create data:

```sql
-- Create test user
INSERT INTO users (id, clerk_id, username, email, avatar_url)
VALUES (
  gen_random_uuid(),
  'test-user-clerk-id',
  'testuser',
  'test@example.com',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=testuser'
) RETURNING id;

-- Note the user ID, then create timeline
-- (Replace USER_ID_HERE with the ID from above)
INSERT INTO timelines (id, title, description, slug, creator_id, is_public)
VALUES (
  gen_random_uuid(),
  'Test Timeline - Railway',
  'Test timeline on Railway production',
  'test-timeline-railway',
  'USER_ID_HERE',
  true
) RETURNING id;
```

## 🌐 Step 4: View Data on Deployed App

### Access Your Railway App

Once deployed and data is created:

1. **Homepage**: `https://[your-app].railway.app/`
2. **Discover Page**: `https://[your-app].railway.app/discover`
3. **Timeline Detail**: `https://[your-app].railway.app/timeline/[timeline-id]`

### Find Your Timeline ID

**Option 1: Railway Database Browser**
- Railway Dashboard → PostgreSQL → Data Tab
- Query: `SELECT id, title FROM timelines;`

**Option 2: API Endpoint**
```bash
curl https://[your-app].railway.app/api/timelines
```

**Option 3: Railway CLI**
```bash
railway connect postgres
SELECT id, title FROM timelines;
```

## 📊 Step 5: View in Railway Dashboard

### Database Browser in Railway

1. **Railway Dashboard** → Your Project → **PostgreSQL Service**
2. Click **"Data"** tab
3. Browse tables:
   - `users` - See test user
   - `timelines` - See created timeline
   - `events` - See all events

### Run SQL Queries

In Railway's **Query** tab:

```sql
-- View all timelines
SELECT 
  t.id,
  t.title,
  t.slug,
  u.username as creator,
  t.view_count,
  COUNT(e.id) as event_count
FROM timelines t
JOIN users u ON t.creator_id = u.id
LEFT JOIN events e ON t.id = e.timeline_id
GROUP BY t.id, t.title, t.slug, u.username, t.view_count
ORDER BY t.created_at DESC;

-- View timeline with events
SELECT 
  e.title,
  e.date,
  e.category,
  t.title as timeline_title
FROM events e
JOIN timelines t ON e.timeline_id = t.id
ORDER BY e.date ASC;
```

## 🔍 Quick Test

### Verify Data Exists

```bash
# Test your Railway app API
curl https://[your-app].railway.app/api/timelines

# Should return JSON with your timeline data
```

### Check App is Working

1. Visit: `https://[your-app].railway.app/discover`
2. You should see your timeline listed
3. Click to view the timeline with events

## 🛠️ Troubleshooting

### "Cannot connect to database"
- Verify `DATABASE_URL` is set in Railway
- Check PostgreSQL service is running
- Verify connection string in Railway Variables

### "Tables don't exist"
- Run migrations: `railway run npx prisma migrate deploy`
- Or push schema: `railway run npx prisma db push`

### "No data visible"
- Check data exists in Railway database browser
- Verify timeline `is_public: true`
- Check browser console for API errors

### "App not deployed"
- Push code to GitHub (if connected)
- Or use `railway up` to deploy
- Check build logs in Railway dashboard

## 📝 Script: Create Test Data on Railway

A dedicated script is available:

```bash
# Using Railway CLI (automatic DATABASE_URL)
railway run --service postgres tsx scripts/create-test-data-railway.ts

# Or manually set DATABASE_URL
DATABASE_URL="[from Railway Variables]" tsx scripts/create-test-data-railway.ts
```

## 🎯 Summary

1. ✅ Ensure app is deployed on Railway
2. ✅ Run database migrations on Railway
3. ✅ Create test data using Railway DATABASE_URL
4. ✅ Visit your Railway app URL to view data
5. ✅ Use Railway dashboard to browse database

## 🔗 Useful Commands

```bash
# View Railway services
railway status

# Connect to PostgreSQL
railway connect postgres

# Run any script with Railway env vars
railway run [command]

# View logs
railway logs

# Open Railway dashboard
railway dashboard
```

Your Railway app URL format: `https://[service-name].up.railway.app` or your custom domain.

