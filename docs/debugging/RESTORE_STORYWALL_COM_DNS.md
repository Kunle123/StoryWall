# Restore storywall.com DNS Resolution

## What Changed

**Before**: `storywall.com` was resolving (probably had a record with Host Name `storywall.com`)
**Now**: `storywall.com` doesn't resolve (empty DNS response)
**Current Status**: `www.storywall.com` works fine ✅

## The Problem

When you added `storywall.com` as a custom domain in Railway, Railway expects the DNS record to use `@` (root domain) format, not `storywall.com` as the hostname.

Your DNS provider might have:
1. Rejected the `@` CNAME because of MX record conflict
2. Or you haven't added the new record yet
3. Or the old `storywall.com` record was removed/changed

## Quick Fix: Restore Resolution

### Option 1: Use A Record (Recommended - Works with MX records)

Since your DNS provider doesn't allow CNAME on `@` when MX records exist:

1. **Get Railway's IP address**:
   - From the DNS check: `www.storywall.com` resolves to `66.33.22.212`
   - This is Railway's IP address ✅

2. **Add A Record in DNS**:
   - **Host Name**: `@` (or blank - root domain)
   - **Record Type**: `A (Address)`
   - **Address**: `66.33.22.212` (Railway's IP from www.storywall.com)
   - **TTL**: `3600`
   - **Save Changes**

3. **Wait 1-2 hours** for DNS propagation

4. **Test**:
   ```bash
   dig storywall.com +short
   # Should return: 66.33.22.212
   ```

### Option 2: Check What Railway Shows

1. Go to Railway Dashboard → Your Service → Settings → Domains
2. Look at `storywall.com` configuration
3. Railway might show:
   - **CNAME**: `pauz9nv2.up.railway.app` (new value)
   - **OR A Record IP**: `66.33.22.212` (or similar)

**If Railway shows a different IP**, use that IP instead of `66.33.22.212`.

## Why This Happened

**Before**: You might have had:
- Host Name: `storywall.com` → CNAME → `dyrt6p9l.up.railway.app`
- This worked because some DNS providers allow this format

**Now**: Railway expects:
- Host Name: `@` → CNAME or A → Railway
- But CNAME conflicts with MX records
- So we need A record instead

## After Adding A Record

1. **DNS will resolve**: `storywall.com` → `66.33.22.212`
2. **Railway will route**: IP → Your Next.js app
3. **Middleware will redirect**: `storywall.com` → `www.storywall.com`
4. **OAuth will work**: Twitter can redirect to `storywall.com/api/twitter/oauth1/callback`

## Important Notes

### A Record vs CNAME

- **A Record**: Points directly to IP (`66.33.22.212`)
  - ✅ Works with MX records
  - ⚠️ If Railway's IP changes, you need to update it
  - Railway's IP is usually stable

- **CNAME**: Points to domain (`pauz9nv2.up.railway.app`)
  - ✅ Auto-updates if Railway changes
  - ❌ Conflicts with MX records on root domain

### Railway IP Changes

If Railway's IP changes in the future:
1. Check `www.storywall.com` DNS (it will show new IP)
2. Update the A record for `@` to match
3. Or contact Railway support for the new IP

## Verification Steps

1. **Add A record**: `@` → `66.33.22.212`
2. **Wait 1-2 hours** for DNS propagation
3. **Test DNS**:
   ```bash
   dig storywall.com +short
   # Should return: 66.33.22.212
   ```
4. **Test in browser**: Visit `https://storywall.com`
   - Should load (or redirect to www)
5. **Check Railway**: `storywall.com` should show "Setup complete"

## Summary

**What to do now:**
1. Add A record: `@` → `66.33.22.212` (Railway's IP)
2. Wait for DNS propagation
3. Test `storywall.com` resolves
4. OAuth should work once domain resolves

**This restores the working state** while using the correct DNS format Railway expects.

