# Fixing 404 on Railway API Routes

## Problem
Your Railway app is deployed, but `/api/timelines` returns 404.

## Likely Causes

### 1. Routes Not Deployed
The API route files might not be in the latest deployment.

**Solution**: Push latest code to GitHub (if Railway is connected to GitHub):
```bash
git add .
git commit -m "Add API routes"
git push origin main
```

Railway will automatically rebuild and deploy.

### 2. Build Issue
The API routes might not be included in the Next.js build.

**Check Railway Build Logs**:
1. Railway Dashboard → Your Project → Deployments
2. Click latest deployment
3. Check build logs for errors
4. Look for any mentions of `api/timelines`

### 3. Route Handler Export Issue
Verify the route files export the correct handlers.

## Quick Fix Steps

### Step 1: Verify Routes Exist Locally
```bash
# Make sure routes exist
ls -la app/api/timelines/route.ts
ls -la app/api/timelines/[id]/route.ts
ls -la app/api/events/[id]/route.ts
```

### Step 2: Commit and Push
```bash
git status
git add app/api/
git commit -m "Ensure API routes are included"
git push origin main
```

### Step 3: Check Railway Deployment
1. Go to Railway Dashboard
2. Check that new deployment is triggered
3. Wait for build to complete
4. Test again: `curl https://storywall-production.up.railway.app/api/timelines`

### Step 4: Check Build Logs
Look for:
- ✅ "Compiled successfully"
- ✅ No errors about missing files
- ⚠️ Any warnings about route handlers

## Alternative: Manual Deployment

If GitHub integration isn't working:

1. **Railway Dashboard** → Your Project
2. Click **"Settings"** → **"Source"**
3. Make sure it's connected to the correct GitHub repo/branch
4. Trigger manual redeploy if needed

## Verify API Route Structure

The routes should be at:
```
app/
  api/
    timelines/
      route.ts          ← GET /api/timelines, POST /api/timelines
      [id]/
        route.ts        ← GET/PATCH/DELETE /api/timelines/[id]
        events/
          route.ts      ← GET/POST /api/timelines/[id]/events
    events/
      [id]/
        route.ts        ← GET/PATCH/DELETE /api/events/[id]
```

## Test After Fix

Once redeployed:
```bash
# Should return JSON array (empty if no data)
curl https://storywall-production.up.railway.app/api/timelines

# Should return JSON with timeline data or 404
curl https://storywall-production.up.railway.app/api/timelines/[id]
```

## Next Steps

Once API routes work:
1. Create test data on Railway database
2. Verify data shows in API responses
3. Check frontend can fetch from API

