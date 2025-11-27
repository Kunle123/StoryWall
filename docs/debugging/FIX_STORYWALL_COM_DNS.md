# Fix: storywall.com "Site Cannot Be Reached" Error

## Problem
Visiting `storywall.com` (without www) shows "site cannot be reached" error. This is because the root domain isn't configured in DNS.

## Why This Matters for OAuth
If `storywall.com` doesn't resolve:
- Twitter can't redirect back to `storywall.com/api/twitter/oauth1/callback`
- Even if you add both URLs to Twitter Developer Portal, it won't work if the domain doesn't resolve
- This could be causing the code 215 error

## Solution: Add Root Domain DNS Record

### Step 1: Check Current DNS Records

Go to your domain registrar's DNS management and check:
- Do you have a record for `@` (root domain)?
- What does it point to?

### Step 2: Add Root Domain Record

**Option A: CNAME (Recommended if supported)**

Add this DNS record:
- **Host Name**: `@` (or leave blank - depends on your DNS provider)
- **Record Type**: `CNAME (Alias)`
- **Address**: `dyrt6p9l.up.railway.app` (or your Railway domain)
- **TTL**: `3600`

**Option B: A Record (If CNAME not supported for root)**

Some DNS providers don't allow CNAME on root domain. In that case:

1. Get Railway's IP address:
   - Go to Railway Dashboard → Your Service → Settings → Domains
   - Look for the IP address (or contact Railway support)

2. Add A record:
   - **Host Name**: `@` (or leave blank)
   - **Record Type**: `A (Address)`
   - **Address**: [Railway's IP address]
   - **TTL**: `3600`

**Note**: If Railway's IP changes, you'll need to update the A record. CNAME is better if supported.

### Step 3: Configure in Railway

1. Go to Railway Dashboard → Your Service
2. Go to **Settings** → **Domains**
3. Add custom domain: `storywall.com` (without www)
4. Railway will provide DNS instructions if needed
5. Ensure SSL certificate is enabled for `storywall.com`

### Step 4: Verify DNS Propagation

After adding the DNS record:

1. **Wait 1-2 hours** for DNS propagation (can take up to 48 hours)
2. **Test DNS resolution**:
   ```bash
   # Should return Railway's IP or CNAME
   nslookup storywall.com
   dig storywall.com
   ```
3. **Check online**: Use https://dnschecker.org to verify DNS propagation globally

### Step 5: Test the Site

After DNS propagates:
1. Visit `https://storywall.com` - should load (or redirect to www)
2. Visit `http://storywall.com` - should redirect to `https://www.storywall.com`
3. Check Railway logs to see if requests are coming through

## Current DNS Setup (What You Should Have)

| Host Name | Type | Address | Notes |
|-----------|------|---------|-------|
| `@` | CNAME or A | `dyrt6p9l.up.railway.app` | **MISSING - ADD THIS** |
| `www` | CNAME | `dyrt6p9l.up.railway.app` | Should already exist |
| `@` | MX | `smtp01.hostinguk.net` | Email (keep) |
| `@` | MX | `mail.hostinguk.net` | Email (keep) |
| `accounts` | CNAME | `accounts.clerk.services` | Clerk (keep) |
| `clerk` | CNAME | `frontend-api.clerk.services` | Clerk (keep) |
| ... | ... | ... | Other Clerk records (keep) |

## Railway Domain Configuration

In Railway Dashboard:
1. Go to Your Service → Settings → Domains
2. Ensure BOTH domains are added:
   - ✅ `www.storywall.com` (probably already added)
   - ❌ `storywall.com` (add this one)

## After Fixing DNS

Once `storywall.com` resolves:

1. **Test OAuth 1.0a again** - This might fix the code 215 error
2. **Add both URLs to Twitter** (as backup):
   - `https://www.storywall.com/api/twitter/oauth1/callback`
   - `https://storywall.com/api/twitter/oauth1/callback`
3. **Verify redirect works**: `storywall.com` → `www.storywall.com`

## Quick Checklist

- [ ] Add root domain (`@`) DNS record pointing to Railway
- [ ] Configure `storywall.com` in Railway Dashboard → Domains
- [ ] Wait for DNS propagation (1-2 hours)
- [ ] Test `storywall.com` loads
- [ ] Test redirect: `storywall.com` → `www.storywall.com`
- [ ] Add both callback URLs to Twitter Developer Portal
- [ ] Test OAuth 1.0a again

## Why This Could Fix OAuth

If `storywall.com` doesn't resolve:
- Twitter can't validate the callback URL
- Even if registered, Twitter might reject it if the domain doesn't resolve
- This could cause code 215 "Bad Authentication data"

Once `storywall.com` resolves and redirects to `www.storywall.com`, OAuth should work.

