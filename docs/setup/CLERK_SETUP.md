# Clerk Authentication Setup Guide

This guide walks you through setting up Clerk authentication for StoryWall.

## Step 1: Create a Clerk Account

1. Go to [https://clerk.com](https://clerk.com)
2. Click **Sign Up** (or **Sign In** if you already have an account)
3. Complete the registration process
4. Verify your email address

## Step 2: Create a New Application

1. Once logged in, you'll be in the Clerk Dashboard
2. Click **+ Create application**
3. Choose **Start from scratch**
4. Enter application name: **StoryWall** (or your preferred name)
5. Select authentication options:
   - **Email** ✓ (recommended)
   - **Phone** (optional)
   - **Social providers** ✓ Select **Google** (recommended for easy sign-in)
6. Click **Create application**

## Step 2.5: Enable Google Authentication (If not done during setup)

If you didn't enable Google during application creation, you can add it later:

1. In Clerk Dashboard, go to **User & Authentication** → **Social Connections** (or **Configure** → **Social Connections**)
2. Find **Google** in the list
3. Toggle it **ON**
4. Click **Save**

**Note:** No code changes needed! The `SignIn` and `SignUp` components will automatically show Google once it's enabled in Clerk Dashboard.

## Step 3: Get Your API Keys

1. After creating the application, you'll see the **API Keys** page
2. You'll see two keys:

   - **Publishable key** (starts with `pk_test_...` for development)
   - **Secret key** (starts with `sk_test_...` for development) - Click "Show key"

3. Copy both keys - you'll need them in Step 4

## Step 4: Configure Redirect URLs

1. In Clerk Dashboard, go to **Configure → Paths** (or **Settings → Paths**)
2. Set these paths:

   - **Sign-in path:** `/sign-in`
   - **Sign-up path:** `/sign-up`

3. Go to **Configure → Redirect URLs** (or **Settings → Redirects**)
4. Add your URLs:

   ### Development URLs:
   ```
   http://localhost:3000/sign-in
   http://localhost:3000/sign-up
   http://localhost:3000/discover
   ```

   ### Production URLs (Railway):
   ```
   https://storywall-production.up.railway.app/sign-in
   https://storywall-production.up.railway.app/sign-up
   https://storywall-production.up.railway.app/discover
   ```

5. Click **Save** after adding each URL

## Step 5: Add Environment Variables

### Local Development (`.env.local`)

Open your `.env.local` file and add these lines:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
CLERK_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Note: Redirect URLs are configured directly in SignIn/SignUp components
# No need for NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL or NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
```

Replace:
- `pk_test_YOUR_PUBLISHABLE_KEY_HERE` with your actual publishable key
- `sk_test_YOUR_SECRET_KEY_HERE` with your actual secret key

### Railway Production

1. Go to your Railway project dashboard
2. Select your **web service** (not the database)
3. Go to the **Variables** tab
4. Click **+ New Variable** for each:

   - **Variable Name:** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Value:** Your Clerk publishable key (`pk_live_...` for production)

   - **Variable Name:** `CLERK_SECRET_KEY`
   - **Value:** Your Clerk secret key (`sk_live_...` for production)

   - **Variable Name:** `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
   - **Value:** `/sign-in`

   - **Variable Name:** `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
   - **Value:** `/sign-up`

**Note:** Redirect URLs are configured in the SignIn/SignUp components using `fallbackRedirectUrl` prop, so you don't need to set `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` or `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`.

**Note:** For production, you'll need to switch Clerk to "Live mode" and get live keys (starts with `pk_live_...` and `sk_live_...`)

## Step 6: Restart Your Dev Server

After adding the keys to `.env.local`:

```bash
npm run dev
```

## Step 7: Test Authentication

1. Navigate to `http://localhost:3000/sign-in`
2. You should see the Clerk sign-in page
3. Click **Sign up** to create a test account
4. Verify you can sign in and are redirected to `/discover`

## Step 8: Sync Users to Database

When a user signs up with Clerk, they'll need to be synced to your database. You can:

### Option A: Create User on First Login (Recommended)

The app will automatically create a user record when they first access features that require a database user.

### Option B: Manual Sync Script

If needed, you can create a script to sync existing Clerk users to your database.

## Troubleshooting

### "Authentication not configured"
- Check that `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set correctly
- Ensure the key starts with `pk_test_...` or `pk_live_...`
- Restart your dev server after adding keys

### Sign-in page shows "Authentication not configured"
- Verify the publishable key is in `.env.local`
- Check that the key format is correct (starts with `pk_test_...`)
- Make sure you restarted the dev server

### Redirect not working
- Check that redirect URLs are added in Clerk Dashboard
- Verify `fallbackRedirectUrl` prop is set in SignIn/SignUp components (currently set to `/discover`)
- Ensure the URLs match exactly what's in Clerk Dashboard

### User not found in database
- Users are created automatically on first use
- Check Railway logs for any database connection errors
- Verify `DATABASE_URL` is set correctly

## Free Tier Limits

Clerk's free tier includes:
- **10,000 Monthly Active Users (MAU)**
- **Unlimited API requests**
- **Email/Password authentication**
- **Social providers** (limited)

This is more than enough for MVP development and testing!

## Going to Production

When ready for production:

1. Switch Clerk to **Live mode** in Dashboard
2. Get your **Live API keys** (starts with `pk_live_...` and `sk_live_...`)
3. Add live keys to Railway environment variables
4. Update redirect URLs in Clerk Dashboard for production domain
5. Test the production authentication flow

## Support

- Clerk Documentation: https://clerk.com/docs
- Clerk Support: https://clerk.com/support
- Next.js + Clerk Guide: https://clerk.com/docs/quickstarts/nextjs

