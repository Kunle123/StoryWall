# Railway Crash Diagnosis & Fix Guide

## 🚨 Quick Checklist

### 1. Check Railway Deployment Logs
1. Go to: https://railway.app/dashboard
2. Select your StoryWall project
3. Click on your **web service**
4. Go to **"Deployments"** tab
5. Click on the latest deployment
6. Look for error messages in:
   - **Build logs** - Check for build failures
   - **Deploy logs** - Check for runtime errors

### Common Error Messages & Solutions:

#### Error: "Cannot find module '@prisma/client'"
**Solution**: Prisma client not generated
```bash
# In Railway Variables, ensure build command includes:
npm run build
# (already set in railway.toml)
```

#### Error: "PrismaClientInitializationError"
**Solution**: DATABASE_URL not set or incorrect
- Check Railway Variables → ensure DATABASE_URL exists
- Should be automatically set when PostgreSQL service is added

#### Error: "CLERK_SECRET_KEY is not defined"
**Solution**: Clerk environment variables missing
- Add in Railway Variables:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`

#### Error: "Port already in use" or "EADDRINUSE"
**Solution**: Railway port binding issue
- Next.js should auto-detect PORT from Railway
- No action needed (Railway sets this automatically)

---

## 🔧 Step-by-Step Fix

### Step 1: Verify Environment Variables

1. **Go to Railway Dashboard** → Your Project → **web service** → **Variables**

2. **Required Variables Checklist:**
   - [ ] `DATABASE_URL` (should be auto-set from PostgreSQL service)
   - [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - [ ] `CLERK_SECRET_KEY`
   - [ ] `CLOUDINARY_CLOUD_NAME`
   - [ ] `CLOUDINARY_API_KEY`
   - [ ] `CLOUDINARY_API_SECRET`
   - [ ] `OPENAI_API_KEY`
   - [ ] `REPLICATE_API_TOKEN`

3. **Optional but Recommended:**
   - [ ] `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
   - [ ] `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`

### Step 2: Check Database Service

1. In Railway Dashboard, verify:
   - [ ] PostgreSQL service is running (green status)
   - [ ] DATABASE_URL variable exists in web service
   - [ ] Database is connected to web service

2. If DATABASE_URL is missing:
   - Click PostgreSQL service
   - Go to **"Connect"** tab
   - Copy the `DATABASE_URL`
   - Add it to your web service variables

### Step 3: Verify Build Configuration

Your `railway.toml` should have:
```toml
[build]
builder = "NIXPACKS"
buildCommand = "npm run build"

[deploy]
startCommand = "npm start"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

Your `package.json` build script should include:
```json
"build": "prisma generate && next build"
```

✅ Both are correctly configured in your project!

### Step 4: Trigger Redeploy

After setting environment variables:
1. Railway Dashboard → **web service**
2. Click **"Redeploy"** button (top right)
3. Or push a commit to trigger auto-deploy:
   ```bash
   git commit --allow-empty -m "Trigger Railway redeploy"
   git push origin main
   ```

---

## 🔍 How to Read Railway Logs

### Build Logs Should Show:
```
✓ Prisma schema loaded from prisma/schema.prisma
✓ Generated Prisma Client
✓ Compiled successfully
```

### Deploy Logs Should Show:
```
> storywall@0.1.0 start
> next start

▲ Next.js 14.2.25
- Local:        http://localhost:3000
- Network:      http://0.0.0.0:3000

✓ Ready in X seconds
```

### If You See Errors:

#### "Module not found: Can't resolve '@prisma/client'"
- Prisma client not generated during build
- Check that build command runs `prisma generate`

#### "Invalid `prisma.XXX()` invocation"
- Database connection issue
- Verify DATABASE_URL in variables
- Check PostgreSQL service is running

#### "Clerk: Missing publishable key"
- Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` to variables

#### "Error: connect ECONNREFUSED"
- Database not accessible
- Check DATABASE_URL format
- Verify PostgreSQL service status

---

## 🚀 Quick Fixes

### Fix 1: Missing Environment Variables
```bash
# Copy your .env.local values to Railway
# Railway Dashboard → web service → Variables → + New Variable
```

Add each variable manually or use Railway CLI:
```bash
railway login
railway link
railway variables set OPENAI_API_KEY=sk-...
railway variables set CLERK_SECRET_KEY=sk_...
# etc.
```

### Fix 2: Database Connection
Ensure PostgreSQL is linked to web service:
1. Railway Dashboard → PostgreSQL service
2. Check "Connected Services" shows your web service
3. If not, click "+ Connect" and select web service

### Fix 3: Force Fresh Build
```bash
# Clear build cache and redeploy
# Railway Dashboard → Settings → Danger Zone → Remove Build Cache
# Then redeploy
```

Or push empty commit:
```bash
git commit --allow-empty -m "Force Railway rebuild"
git push origin main
```

---

## 📋 Verification Checklist

After fixing, verify:
- [ ] Deployment status shows "Success" (green)
- [ ] Build logs show no errors
- [ ] Deploy logs show "✓ Ready"
- [ ] App URL is accessible
- [ ] API routes work: `/api/timelines`
- [ ] Database can be queried

---

## 💡 Still Having Issues?

### Check These:

1. **Railway Service Status**
   - Go to Railway Status: https://status.railway.app
   - Check for ongoing incidents

2. **Resource Limits**
   - Railway Dashboard → Usage
   - Check if you've hit free tier limits

3. **Database Migrations**
   - Run migrations on Railway database:
   ```bash
   railway run npx prisma migrate deploy
   ```

4. **View Live Logs**
   - Railway Dashboard → web service → Logs
   - Watch in real-time as app starts

---

## 🎯 Most Common Fix

**90% of Railway crashes are due to missing environment variables!**

Double-check all required env vars are set in Railway Variables tab.

---

## Need More Help?

If issue persists:
1. Share the error message from Railway logs
2. Check which environment variables are set
3. Verify PostgreSQL service is running
4. Test database connection with Railway CLI

### Useful Commands:
```bash
# View Railway logs
railway logs

# Test database connection
railway run npx prisma db pull

# Run migrations
railway run npx prisma migrate deploy

# Check service status
railway status
```

