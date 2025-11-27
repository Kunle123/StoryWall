# Verify Railway Domain Configuration

## We Haven't Changed Railway Config

**Important**: We have NOT changed any Railway configuration. Railway domains are configured in the Railway Dashboard UI, not in code files.

## What to Check in Railway Dashboard

### Step 1: Check Railway Domain Settings

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your **StoryWall** project
3. Click on your **web service** (not the database)
4. Go to **Settings** → **Domains** (or **Networking** → **Domains`)

### Step 2: Verify Both Domains Are Added

You should see BOTH domains listed:
- ✅ `www.storywall.com` (probably already there)
- ❓ `storywall.com` (check if this is missing)

### Step 3: If `storywall.com` is Missing

1. Click **"Add Domain"** or **"Custom Domain"**
2. Enter: `storywall.com` (without www)
3. Railway will provide DNS instructions:
   - Usually a CNAME pointing to `dyrt6p9l.up.railway.app`
   - Or an A record with an IP address
4. Add the DNS record in your domain registrar
5. Wait for Railway to provision SSL certificate

### Step 4: Verify SSL Certificates

For each domain, ensure:
- ✅ SSL certificate is **Active** (green checkmark)
- ✅ Certificate is not expired
- ✅ Both domains have valid certificates

## Current Status Check

**In Railway Dashboard, check:**
- [ ] Is `www.storywall.com` configured? (should be ✅)
- [ ] Is `storywall.com` configured? (might be ❌)
- [ ] Are SSL certificates active for both?
- [ ] Are there any warnings or errors?

## If `storywall.com` Was Previously Configured

If Railway was previously configured to handle `storywall.com` but it's not working now:

1. **Check if domain was removed** - Sometimes domains get removed accidentally
2. **Check DNS records** - Ensure DNS still points to Railway
3. **Check Railway logs** - See if Railway is receiving requests for `storywall.com`
4. **Re-add domain** - If missing, add it back in Railway Dashboard

## DNS Records Needed

Even if Railway is configured, you still need DNS records:

| Domain | DNS Record Type | Should Point To |
|--------|----------------|------------------|
| `www.storywall.com` | CNAME | `dyrt6p9l.up.railway.app` |
| `storywall.com` | CNAME or A | `dyrt6p9l.up.railway.app` (or Railway IP) |

## Why This Matters for OAuth

If `storywall.com` doesn't resolve:
- Twitter can't redirect back to `storywall.com/api/twitter/oauth1/callback`
- Even if registered in Twitter Developer Portal, it won't work
- This could be causing code 215 error

## Action Items

1. **Check Railway Dashboard** → Your Service → Settings → Domains
2. **Verify both domains** are listed and have active SSL
3. **If `storywall.com` is missing**, add it in Railway
4. **Verify DNS records** point both domains to Railway
5. **Test** `storywall.com` loads (after DNS propagates)

## We Haven't Changed Anything

To be clear:
- ✅ We haven't modified `railway.toml`
- ✅ We haven't changed Railway domain settings
- ✅ We only modified code (OAuth implementation, middleware)
- ❓ Railway domain configuration is done in Railway Dashboard UI

The issue is likely that `storywall.com` was never added to Railway, or was removed at some point.

