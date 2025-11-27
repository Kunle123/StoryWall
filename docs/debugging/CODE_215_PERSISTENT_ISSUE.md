# Code 215 Persistent Issue - Final Checklist

## Current Status

The OAuth 1.0a request token is **still failing with code 215** despite:
- ✅ Consumer Key/Secret present in environment variables
- ✅ Signature generation appears correct
- ✅ Callback URL format is correct: `https://www.storywall.com/api/twitter/oauth1/callback`
- ✅ DNS configuration is correct (A record added for storywall.com)

## Critical: This is NOT a DNS Issue

**Important**: The `/oauth/request_token` endpoint is a **server-to-server** call from Railway to Twitter. It does NOT depend on DNS resolution of `storywall.com`. The DNS fix we just made won't affect this error.

## Root Cause Analysis

Code 215 "Bad Authentication data" for `/oauth/request_token` means Twitter is rejecting the request. The most common causes:

### 1. Callback URL Not Registered in Twitter Developer Portal ⚠️ **MOST LIKELY**

**Check this FIRST:**
1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Select your app
3. Go to **Settings** → **User authentication settings**
4. Scroll to **OAuth 1.0a** section
5. Check **Callback URLs** field
6. **Verify EXACTLY this URL is listed:**
   ```
   https://www.storywall.com/api/twitter/oauth1/callback
   ```

**Common mistakes:**
- ❌ Missing `https://`
- ❌ Missing `/api/twitter/oauth1/callback` (just has domain)
- ❌ Has `http://` instead of `https://`
- ❌ Has trailing slash: `/callback/`
- ❌ Wrong case: `/CALLBACK` or `/Callback`
- ❌ URL not saved (you added it but didn't click "Save")

**Action**: Add the exact URL above and **click "Save"**.

### 2. OAuth 1.0a Not Enabled

**Check:**
1. Twitter Developer Portal → Your App → Settings → User authentication settings
2. **OAuth 1.0a** section should show:
   - ✅ **App permissions**: "Read and write"
   - ✅ **Callback URLs**: Should have the URL above
   - ✅ **OAuth 1.0a** toggle should be **ON/Enabled**

**Action**: Enable OAuth 1.0a if it's disabled.

### 3. Consumer Key/Secret Mismatch

**From logs:**
- Consumer Key: `eNmO4GWJSRrqZ2qZkBJyxLlt2` (25 chars)
- Consumer Secret: 50 chars

**Verify:**
1. Twitter Developer Portal → Your App → **Keys and tokens** tab
2. Check **Consumer Keys** section:
   - **API Key** should match: `eNmO4GWJSRrqZ2qZkBJyxLlt2`
   - **API Secret Key** should match what's in Railway environment variables

**Action**: If they don't match:
1. Copy the **exact** API Key and API Secret from Developer Portal
2. Update Railway environment variables:
   - `TWITTER_API_KEY` = API Key from Developer Portal
   - `TWITTER_API_SECRET` = API Secret Key from Developer Portal
3. Redeploy the application

### 4. App Permissions Issue

**Check:**
1. Twitter Developer Portal → Your App → Settings → User authentication settings
2. **OAuth 1.0a** section:
   - **App permissions** should be **"Read and write"**
   - NOT "Read only"

**If it shows "Read only":**
1. Change to "Read and write"
2. **Click "Save"** (critical - must save separately for OAuth 1.0a)
3. **Regenerate API Key and API Secret** (they must be regenerated after permission change)
4. Update Railway environment variables with new keys
5. Redeploy

### 5. Free Tier Restrictions

**Check your Twitter Developer account tier:**
1. Twitter Developer Portal → Dashboard
2. Check your subscription tier

**If you're on Free tier:**
- Some OAuth 1.0a features may be restricted
- Check Twitter's documentation for free tier limitations
- Consider upgrading if needed

## Step-by-Step Verification

### Step 1: Verify Callback URL in Developer Portal

1. Go to Twitter Developer Portal → Your App → Settings → User authentication settings
2. Scroll to **OAuth 1.0a** section
3. **Copy the exact callback URL** from the "Callback URLs" field
4. Compare with what we're sending: `https://www.storywall.com/api/twitter/oauth1/callback`
5. They must match **EXACTLY** (including https, no trailing slash, correct case)

**If missing or different:**
- Add: `https://www.storywall.com/api/twitter/oauth1/callback`
- Click **"Save"**
- Wait 1-2 minutes for changes to propagate

### Step 2: Verify Consumer Key Match

1. Twitter Developer Portal → Your App → **Keys and tokens** tab
2. **Consumer Keys** section:
   - **API Key**: Should be `eNmO4GWJSRrqZ2qZkBJyxLlt2`
3. Railway Dashboard → Your Service → **Variables** tab
4. Check `TWITTER_API_KEY` environment variable
5. They must match **EXACTLY**

**If they don't match:**
- Copy API Key from Developer Portal
- Update `TWITTER_API_KEY` in Railway
- Redeploy

### Step 3: Verify OAuth 1.0a is Enabled

1. Twitter Developer Portal → Your App → Settings → User authentication settings
2. **OAuth 1.0a** section should show:
   - ✅ Enabled/ON
   - ✅ App permissions: "Read and write"
   - ✅ Callback URLs: Contains the correct URL

### Step 4: Test Again

After making any changes:
1. Wait 1-2 minutes for Twitter to update
2. Try OAuth 1.0a connection again
3. Check logs for code 215 error

## Most Likely Fix

Based on the persistent code 215 error, the **most likely issue** is:

**The callback URL `https://www.storywall.com/api/twitter/oauth1/callback` is not registered in Twitter Developer Portal's OAuth 1.0a section.**

**Action:**
1. Go to Twitter Developer Portal → Your App → Settings → User authentication settings
2. Scroll to **OAuth 1.0a** section (NOT OAuth 2.0)
3. In **Callback URLs** field, add:
   ```
   https://www.storywall.com/api/twitter/oauth1/callback
   ```
4. **Click "Save"** (this is critical - OAuth 1.0a has a separate save button)
5. Wait 1-2 minutes
6. Try again

## Alternative: Add Both URLs

As a workaround, add BOTH callback URLs:
1. `https://www.storywall.com/api/twitter/oauth1/callback` (primary)
2. `https://storywall.com/api/twitter/oauth1/callback` (fallback - once DNS propagates)

This ensures Twitter accepts the callback regardless of which domain is used.

## Next Steps

1. **Verify callback URL** in Twitter Developer Portal (OAuth 1.0a section)
2. **Verify Consumer Key** matches between Developer Portal and Railway
3. **Verify OAuth 1.0a is enabled** with "Read and write" permissions
4. **Click "Save"** after any changes
5. **Wait 1-2 minutes** for Twitter to update
6. **Test again**

If code 215 persists after all these checks, we may need to contact Twitter Developer Support.

