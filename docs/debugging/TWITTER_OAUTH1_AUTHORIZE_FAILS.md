# Fix: Twitter OAuth 1.0a Authorization Page Fails to Load

## Problem
- OAuth 1.0a request token is successfully obtained
- Server redirects to `https://api.twitter.com/oauth/authorize?oauth_token=...`
- Twitter's authorization page fails to load ("Load failed" error)
- User never sees Twitter's authorization screen

## Root Cause
**The callback URL used when getting the request token is NOT approved in Twitter Developer Portal, or doesn't match exactly.**

When you request a token, Twitter validates that the callback URL matches one of the approved callback URLs in your app settings. If it doesn't match, Twitter will reject the authorization page.

## Solution: Verify Callback URL is Approved

### Step 1: Check What Callback URL Was Used

Check your server logs for:
```
[Twitter OAuth1] Callback URL: https://www.storywall.com/api/twitter/oauth1/callback
```

This is the URL that was sent to Twitter when requesting the token.

### Step 2: Verify in Twitter Developer Portal

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Open your app (StoryWall)
3. Go to **"Settings"** → **"User authentication settings"**
4. **Scroll down to the OAuth 1.0a section** (separate from OAuth 2.0)
5. Check the **"Callback URLs"** list
6. Verify this EXACT URL is listed:
   ```
   https://www.storywall.com/api/twitter/oauth1/callback
   ```

### Step 3: Add Callback URL if Missing

If the URL is missing:

1. In the OAuth 1.0a section, find **"Callback URLs"**
2. Click **"Add"** or **"Edit"**
3. Add: `https://www.storywall.com/api/twitter/oauth1/callback`
4. **Click "Save"** (important!)
5. Wait 1-2 minutes for changes to propagate

### Step 4: Verify URL Matches Exactly

**CRITICAL:** The callback URL must match EXACTLY:
- ✅ `https://www.storywall.com/api/twitter/oauth1/callback` (correct)
- ❌ `https://storywall.com/api/twitter/oauth1/callback` (missing www)
- ❌ `http://www.storywall.com/api/twitter/oauth1/callback` (http instead of https)
- ❌ `https://www.storywall.com/api/twitter/oauth1/callback/` (trailing slash)
- ❌ `https://www.storywall.com/api/twitter/oauth1/CALLBACK` (wrong case)

### Step 5: Check Environment Variable

Verify your `TWITTER_REDIRECT_URI` environment variable:

```bash
TWITTER_REDIRECT_URI=https://www.storywall.com/api/twitter/callback
```

The code automatically converts this to the OAuth 1.0a callback:
- `https://www.storywall.com/api/twitter/callback` → `https://www.storywall.com/api/twitter/oauth1/callback`

### Step 6: Retry OAuth 1.0a Flow

After adding/verifying the callback URL:

1. Clear your browser cookies (or use incognito mode)
2. Go to `/test-oauth1`
3. Click "Test OAuth 1.0a Connection"
4. You should now see Twitter's authorization page

## Common Errors

### Error: "Callback URL not approved"
- **Cause:** Callback URL not in Developer Portal
- **Fix:** Add the exact callback URL to OAuth 1.0a section

### Error: "Invalid callback URL"
- **Cause:** URL doesn't match exactly (trailing slash, http vs https, etc.)
- **Fix:** Verify URL matches character-for-character

### Error: "Load failed" (browser error)
- **Cause:** Twitter rejected the request token because callback URL doesn't match
- **Fix:** Verify callback URL is approved and matches exactly

## Verification Checklist

- [ ] OAuth 1.0a section has callback URL: `https://www.storywall.com/api/twitter/oauth1/callback`
- [ ] URL matches exactly (no trailing slash, correct protocol, correct domain)
- [ ] Changes saved in Developer Portal
- [ ] Waited 1-2 minutes after saving
- [ ] `TWITTER_REDIRECT_URI` environment variable is set correctly
- [ ] Cleared cookies and retried

## Debugging: Check Server Logs

Check your Railway logs for:
```
[Twitter OAuth1] Callback URL: https://www.storywall.com/api/twitter/oauth1/callback
```

Compare this with what's in Developer Portal - they must match exactly.

## If Issue Persists

If the callback URL is approved but still fails:

1. **Check app status:**
   - Ensure app is "Active" (not suspended)
   - Check for any warnings in Developer Portal

2. **Try regenerating API keys:**
   - Go to "Keys and tokens"
   - Regenerate API Key and API Secret
   - Update environment variables
   - Redeploy

3. **Check Network tab:**
   - Look for the request to `api.twitter.com/oauth/authorize`
   - Check the response status and error message
   - Share the error with support

4. **Contact Twitter Support:**
   - If issue persists, contact Twitter Developer Support
   - Provide app ID and callback URL

