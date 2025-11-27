# Step-by-Step: Regenerate Twitter API Credentials

This guide walks you through regenerating Twitter API credentials and ensuring they're properly configured.

## Prerequisites

✅ **Configuration Verified** (from Developer Portal screenshot):
- OAuth 1.0a permissions: "Read and write" ✅
- Callback URLs registered: 
  - `https://www.storywall.com/api/twitter/callback` ✅
  - `https://www.storywall.com/api/twitter/oauth1/callback` ✅
- App type: "Web App, Automated App or Bot" ✅

## Step 1: Regenerate API Key and Secret

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Click on your app (StoryWall)
3. Go to **"Keys and tokens"** tab
4. Find **"API Key and Secret"** section
5. Click **"Regenerate"** button
   - ⚠️ **WARNING:** This will invalidate ALL existing OAuth 1.0a tokens
   - ⚠️ **WARNING:** You MUST update environment variables immediately
6. **Copy the new API Key** (Consumer Key) - Copy it immediately, you won't see it again!
7. **Copy the new API Secret** (Consumer Secret) - Copy it immediately, you won't see it again!

## Step 2: Update Environment Variables

### For Railway (Production)

1. Go to your Railway project dashboard
2. Click on your service (StoryWall)
3. Go to **"Variables"** tab
4. Find `TWITTER_API_KEY`:
   - Click to edit
   - **Paste the new API Key** (from Step 1)
   - **CRITICAL:** No quotes, no spaces, no newlines
   - Save
5. Find `TWITTER_API_SECRET`:
   - Click to edit
   - **Paste the new API Secret** (from Step 1)
   - **CRITICAL:** No quotes, no spaces, no newlines
   - Save

### For Local Development (.env.local)

1. Open `.env.local` file
2. Update:
   ```bash
   TWITTER_API_KEY=your_new_api_key_here
   TWITTER_API_SECRET=your_new_api_secret_here
   ```
3. **CRITICAL:** 
   - No quotes around values
   - No spaces before/after `=`
   - No trailing spaces
   - One value per line

## Step 3: Verify Environment Variables

### Check in Railway

1. Go to Railway → Your Service → Variables
2. Verify:
   - `TWITTER_API_KEY` matches the API Key from Developer Portal
   - `TWITTER_API_SECRET` matches the API Secret from Developer Portal
   - Both have correct lengths (Key: ~25 chars, Secret: ~50 chars)

### Check in Logs (After Deployment)

After redeploying, check logs for:
```
[Twitter OAuth1 Request Token] 🔐 Consumer Key (FULL): QutF0F0XCFA9Ifsli9y4Qznzv
```

Compare this with Developer Portal → Keys and tokens → API Key

## Step 4: Redeploy Application

### Railway

1. After updating environment variables, Railway should auto-redeploy
2. If not, trigger a manual redeploy:
   - Go to Deployments tab
   - Click "Redeploy" or push a new commit

### Verify Deployment

1. Wait for deployment to complete
2. Check deployment logs for any errors
3. Verify new environment variables are loaded

## Step 5: Test OAuth 1.0a Flow

1. Go to `/test-oauth1` page
2. Click "Test OAuth 1.0a Connection"
3. Check logs for:
   - Consumer Key matches Developer Portal
   - No code 215 errors
   - Request token obtained successfully

## Step 6: Revoke App Access and Reconnect

After credentials are regenerated and deployed:

1. Go to [Twitter Settings → Apps and sessions](https://twitter.com/settings/apps)
2. Find "StoryWall" (or your app name)
3. Click **"Revoke access"** or **"Remove app"**
4. Wait 30 seconds
5. Go back to StoryWall
6. Click **"Connect Twitter Account"** or test at `/test-oauth1`
7. Complete both OAuth 2.0 and OAuth 1.0a flows

## Common Mistakes to Avoid

### ❌ Don't Do This:
- Add quotes: `TWITTER_API_KEY="your_key"` ❌
- Add spaces: `TWITTER_API_KEY = your_key` ❌
- Forget to redeploy after updating variables ❌
- Use old keys after regenerating ❌
- Skip revoking app access ❌

### ✅ Do This:
- No quotes: `TWITTER_API_KEY=your_key` ✅
- No spaces: `TWITTER_API_KEY=your_key` ✅
- Redeploy immediately after updating ✅
- Use new keys from Developer Portal ✅
- Revoke and reconnect after regenerating ✅

## Verification Checklist

After completing all steps, verify:

- [ ] API Key regenerated in Developer Portal
- [ ] API Secret regenerated in Developer Portal
- [ ] `TWITTER_API_KEY` environment variable updated (no quotes, no spaces)
- [ ] `TWITTER_API_SECRET` environment variable updated (no quotes, no spaces)
- [ ] Application redeployed
- [ ] Consumer Key in logs matches Developer Portal
- [ ] OAuth 1.0a test succeeds (no code 215 error)
- [ ] App access revoked in Twitter Settings
- [ ] Reconnected in StoryWall
- [ ] Both OAuth flows completed successfully

## Troubleshooting

### Still Getting Code 215?

1. **Double-check Consumer Key match:**
   - Logs show: `Consumer Key (FULL): XXXXXXXXX`
   - Developer Portal shows: `API Key: XXXXXXXXX`
   - Must match exactly

2. **Check Consumer Secret length:**
   - Should be ~50 characters
   - If much shorter/longer, may be truncated or have extra characters

3. **Verify environment variables:**
   - Check Railway Variables tab
   - Ensure no quotes, spaces, or newlines
   - Re-save if unsure

4. **Force redeploy:**
   - Sometimes environment variables need a fresh deployment
   - Trigger a new deployment after updating variables

5. **Check callback URL:**
   - Must match exactly: `https://www.storywall.com/api/twitter/oauth1/callback`
   - Case-sensitive, no trailing slash

## Next Steps After Successful Connection

Once OAuth 1.0a is working:
1. Test image upload by posting a tweet with an image
2. Verify image appears in the tweet
3. Check logs for successful media upload

## Support

If issues persist after following all steps:
1. Check server logs for detailed error messages
2. Compare Consumer Key in logs with Developer Portal
3. Verify callback URL matches exactly
4. Ensure OAuth 1.0a is enabled in Developer Portal

