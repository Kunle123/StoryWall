# Fix: storywall.com → www.storywall.com Redirect

## Quick Fix: Add Both URLs to Twitter Developer Portal

**Immediate workaround** - Add BOTH callback URLs to Twitter Developer Portal:

1. Go to Developer Portal → Your App → Settings → User authentication settings
2. In **OAuth 1.0a** section, add BOTH:
   - `https://www.storywall.com/api/twitter/oauth1/callback` (primary)
   - `https://storywall.com/api/twitter/oauth1/callback` (fallback)
3. Click **"Save"**
4. Test OAuth 1.0a again

This ensures Twitter accepts the callback URL regardless of which domain the request comes from.

## Permanent Fix: Configure Redirect at Hosting Level

### For Railway

1. Check domain configuration in Railway dashboard
2. Ensure both `storywall.com` and `www.storywall.com` are configured
3. Set up redirect at Railway level (if supported) or DNS level

### For Vercel

Create `vercel.json` in project root:
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

### For DNS Level (Best Solution)

Configure redirect at DNS/hosting provider level so it happens before requests reach Next.js.

## Test Redirect

```bash
# Should return 301 redirect
curl -I https://storywall.com

# Should redirect to www
curl -I https://storywall.com/api/twitter/oauth1/callback
```

## Why This Matters for OAuth

Twitter validates callback URLs exactly. If:
- Callback registered: `www.storywall.com`
- Request origin: `storywall.com` (no www)
- Twitter might reject with code 215

Adding both URLs ensures Twitter accepts either.

