# Setting Up Clerk Production Credentials

## Step 1: Switch Clerk to Production Mode

1. Go to [https://dashboard.clerk.com](https://dashboard.clerk.com)
2. Select your **StoryWall** application
3. In the top right, you'll see a toggle for **"Development"** / **"Production"**
4. Click to switch to **"Production"** mode

## Step 2: Get Production API Keys

1. In Clerk Dashboard, go to **API Keys** (or **Configure → API Keys**)
2. You'll now see **Production** keys (different from test keys):
   - **Publishable key** (starts with `pk_live_...`)
   - **Secret key** (starts with `sk_live_...`) - Click "Show key" to reveal

3. **Copy both keys** - you'll need them for Railway

## Step 3: Configure Production Redirect URLs

1. In Clerk Dashboard, go to **Configure → Paths**
2. Set these paths:
   - **Sign-in path:** `/sign-in`
   - **Sign-up path:** `/sign-up`

3. Go to **Configure → Redirect URLs**
4. Add your production URLs:
   ```
   https://storywall.com/sign-in
   https://storywall.com/sign-up
   https://storywall.com/
   ```
   (Replace `storywall.com` with your actual domain if different)

5. Click **Save** after adding each URL

## Step 4: Add Production Keys to Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your **StoryWall** project
3. Click on your **web service** (not the database)
4. Go to the **Variables** tab
5. Update or add these variables:

   **Update existing variables:**
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = `pk_live_YOUR_PRODUCTION_KEY_HERE`
   - `CLERK_SECRET_KEY` = `sk_live_YOUR_PRODUCTION_KEY_HERE`

   **Add if missing:**
   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL` = `/sign-in`
   - `NEXT_PUBLIC_CLERK_SIGN_UP_URL` = `/sign-up`

6. Railway will automatically redeploy after you save the variables

## Step 5: Verify It's Working

1. Wait for Railway deployment to complete
2. Visit your production site: `https://storywall.com`
3. Try signing in/signing up
4. Check that you're redirected to the home page (`/`) after authentication
5. Verify no more "development keys" warnings in the browser console

## Important Notes

- **Development keys** (`pk_test_...`, `sk_test_...`) are for local development only
- **Production keys** (`pk_live_...`, `sk_live_...`) are for your live site
- You can keep development keys in your local `.env.local` file
- Production keys should ONLY be in Railway environment variables (never commit to git)

## Troubleshooting

If you see "Clerk has been loaded with development keys" warning:
- Check Railway Variables → ensure keys start with `pk_live_` and `sk_live_`
- Make sure you're using Production mode in Clerk Dashboard
- Clear browser cache and hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

If redirects aren't working:
- Verify redirect URLs are set in Clerk Dashboard → Configure → Redirect URLs
- Check that `fallbackRedirectUrl` in code matches your desired redirect path
- Ensure the URL matches your Railway domain exactly

