# www.storywall.com Redirect Issue and OAuth 1.0a

## Problem
`storywall.com` is not redirecting to `www.storywall.com`, which could be causing OAuth 1.0a request_token to fail with code 215.

## Why This Could Cause Code 215

Twitter validates callback URLs **exactly**. If:
- Callback URL is registered as: `https://www.storywall.com/api/twitter/oauth1/callback`
- But request comes from: `https://storywall.com` (without www)
- Twitter might reject it because the origin doesn't match

## Current Setup

### Middleware Redirect (Next.js)
The middleware has redirect logic:
```typescript
if (process.env.NODE_ENV === 'production' && hostname === 'storywall.com') {
  url.hostname = 'www.storywall.com';
  return NextResponse.redirect(url, 301);
}
```

**Issue**: This only works if the request reaches Next.js. If the redirect isn't happening at the DNS/hosting level, requests might still come through as `storywall.com`.

## Solutions

### Option 1: Fix Redirect at Hosting Level (Recommended)

**For Railway/Vercel:**
1. Check if both domains are configured
2. Set up redirect at the hosting platform level (not just Next.js)
3. Ensure `storywall.com` → `www.storywall.com` redirect happens before Next.js

**For Vercel:**
- Add both domains in project settings
- Configure redirect in `vercel.json`:
```json
{
  "redirects": [
    {
      "source": "/(.*)",
      "destination": "https://www.storywall.com/$1",
      "permanent": true,
      "has": [
        {
          "type": "host",
          "value": "storywall.com"
        }
      ]
    }
  ]
}
```

**For Railway:**
- Check domain settings
- May need to configure at DNS level or use Railway's redirect feature

### Option 2: Add Both URLs to Twitter Developer Portal

As a workaround, add BOTH callback URLs:
1. `https://www.storywall.com/api/twitter/oauth1/callback` (primary)
2. `https://storywall.com/api/twitter/oauth1/callback` (fallback)

**Note**: This is a workaround. The proper fix is to ensure redirect works.

### Option 3: Force www in Environment Variables

Ensure all environment variables use `www.storywall.com`:
```
TWITTER_REDIRECT_URI=https://www.storywall.com/api/twitter/callback
NEXT_PUBLIC_APP_URL=https://www.storywall.com
```

## How to Test Redirect

1. **Test in browser:**
   - Visit `https://storywall.com`
   - Should redirect to `https://www.storywall.com`
   - Check browser network tab - should see 301 redirect

2. **Test with curl:**
   ```bash
   curl -I https://storywall.com
   ```
   Should return:
   ```
   HTTP/1.1 301 Moved Permanently
   Location: https://www.storywall.com
   ```

3. **Test API endpoint:**
   ```bash
   curl -I https://storywall.com/api/twitter/oauth1/callback
   ```
   Should redirect to `https://www.storywall.com/api/twitter/oauth1/callback`

## Impact on OAuth 1.0a

If the redirect isn't working:
- Requests to `storywall.com` don't get redirected
- Twitter sees callback URL as `www.storywall.com` but request from `storywall.com`
- Twitter rejects with code 215 (mismatch)

## Next Steps

1. **Check current redirect status:**
   - Test `https://storywall.com` in browser
   - Check if it redirects to `www.storywall.com`

2. **Fix redirect at hosting level:**
   - Configure at Railway/Vercel level (not just Next.js middleware)
   - Ensure redirect happens before Next.js processes request

3. **Add both URLs to Twitter (temporary):**
   - Add `https://storywall.com/api/twitter/oauth1/callback` to Developer Portal
   - This is a workaround until redirect is fixed

4. **Test OAuth 1.0a again:**
   - After fixing redirect or adding both URLs
   - Should resolve code 215 if this was the issue

## Verification

After fixing, verify:
- ✅ `storywall.com` redirects to `www.storywall.com` (301)
- ✅ `https://storywall.com/api/twitter/oauth1/callback` redirects correctly
- ✅ OAuth 1.0a request_token succeeds
- ✅ Both URLs work (if added to Twitter as workaround)

