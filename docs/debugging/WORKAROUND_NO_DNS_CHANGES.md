# Workaround: Handle storywall.com Without DNS Changes

## The Problem

Your DNS provider doesn't allow CNAME on `@` (root domain) when MX records exist. This is a common DNS limitation.

## Solution: Use A Record Instead of CNAME

Since CNAME isn't allowed, we need to use an **A record** pointing to Railway's IP address.

### Step 1: Get Railway's IP Address

Railway should provide an IP address option. Check:

1. **Railway Dashboard** → Your Service → Settings → Domains
2. Look for `storywall.com` configuration
3. Railway might show:
   - **Option A**: CNAME to `pauz9nv2.up.railway.app` (what you're seeing)
   - **Option B**: A record with an IP address (what we need)

**If Railway only shows CNAME:**
- Contact Railway support and ask: "I need an A record IP address for `storywall.com` because my DNS provider doesn't allow CNAME on root domain when MX records exist"
- Railway support can provide the IP address

### Step 2: Add A Record in DNS

Once you have Railway's IP address:

1. **Delete** the incorrect `storywall.com` CNAME record (if it exists)
2. **Add** an A record:
   - **Host Name**: `@` (or blank)
   - **Record Type**: `A (Address)`
   - **Address**: `[Railway's IP address]` (e.g., `35.123.45.67`)
   - **TTL**: `3600`
3. **Save Changes**

### Step 3: Configure in Railway

1. Railway Dashboard → Your Service → Settings → Domains
2. Ensure `storywall.com` is added as a custom domain
3. Railway will detect the A record once DNS propagates
4. Railway will provision SSL certificate

## Alternative: Add Both Callback URLs to Twitter (Temporary Workaround)

If you can't add the DNS record right now, you can work around the OAuth issue by:

1. **Add BOTH callback URLs to Twitter Developer Portal**:
   - Go to Developer Portal → Your App → Settings → User authentication settings
   - In **OAuth 1.0a** section, add:
     - `https://www.storywall.com/api/twitter/oauth1/callback` (primary - already working)
     - `https://storywall.com/api/twitter/oauth1/callback` (fallback - will work once DNS is fixed)
   - Click **"Save"**

2. **Update environment variables** to use `www.storywall.com` consistently:
   ```env
   TWITTER_REDIRECT_URI=https://www.storywall.com/api/twitter/callback
   NEXT_PUBLIC_APP_URL=https://www.storywall.com
   ```

3. **The middleware will handle redirects** once `storywall.com` resolves:
   ```typescript
   // middleware.ts already has this:
   if (hostname === 'storywall.com') {
     url.hostname = 'www.storywall.com';
     return NextResponse.redirect(url, 301);
   }
   ```

## Why This Works

- **A records** don't conflict with MX records (unlike CNAME)
- Once `storywall.com` resolves via A record, requests reach Railway
- Railway routes to your Next.js app
- Middleware redirects `storywall.com` → `www.storywall.com`
- Twitter accepts both callback URLs

## Important Notes

### A Record Limitations

- **If Railway's IP changes**, you'll need to update the A record
- Railway's IP is usually stable, but can change during deployments
- CNAME is preferred (auto-updates), but A record works when CNAME isn't allowed

### DNS Propagation

- Wait 1-2 hours after adding the A record
- Can take up to 48 hours
- Check propagation: https://dnschecker.org

### Railway SSL Certificate

- Railway will automatically provision SSL for `storywall.com` once DNS resolves
- This happens automatically - no manual action needed

## Testing After DNS Changes

1. **Test DNS resolution**:
   ```bash
   dig storywall.com +short
   # Should return Railway's IP address
   ```

2. **Test domain loads**:
   - Visit `https://storywall.com` - should load
   - Should redirect to `https://www.storywall.com`

3. **Test OAuth**:
   - Try connecting Twitter again
   - Should work with both callback URLs configured

## Summary

**If DNS provider blocks CNAME on `@`:**
1. Get Railway's IP address (from Railway support or dashboard)
2. Add A record: `@` → Railway's IP
3. Wait for DNS propagation
4. Railway will auto-provision SSL
5. Middleware will handle redirects
6. OAuth will work with both callback URLs

**This avoids needing to change DNS provider or remove MX records.**

