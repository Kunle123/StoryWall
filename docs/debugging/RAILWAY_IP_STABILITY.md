# Railway IP Address Stability

## Will Railway's IP Change?

**Short Answer**: Railway's IP is **usually stable**, but it **can change** in certain situations.

## When Railway IP Might Change

1. **Service redeployment** - Rare, but possible during major infrastructure updates
2. **Service migration** - If Railway migrates your service to a different region/server
3. **Infrastructure changes** - Railway platform updates or changes
4. **Service recreation** - If you delete and recreate the service

## How Often Does It Change?

- **Most services**: IP stays the same for months/years
- **Stable services**: IP rarely changes
- **Active development**: More likely to change if you're frequently redeploying

## How to Monitor IP Changes

### Method 1: Check `www.storywall.com` DNS

Since `www.storywall.com` uses a CNAME (which auto-updates), you can check its IP:

```bash
dig www.storywall.com +short
# This will show the current Railway IP
```

**If the IP changes**, `www.storywall.com` will automatically resolve to the new IP (because it uses CNAME).

### Method 2: Check Railway Dashboard

1. Go to Railway Dashboard → Your Service → Settings → Domains
2. Look at `storywall.com` configuration
3. Railway may show the current IP address

### Method 3: Monitor Your Site

If `storywall.com` stops working:
1. Check if `www.storywall.com` still works
2. If `www` works but root doesn't, the IP likely changed
3. Check `www.storywall.com` DNS to get the new IP
4. Update your A record

## What to Do If IP Changes

### Step 1: Get the New IP

```bash
# Check www.storywall.com (uses CNAME, always current)
dig www.storywall.com +short
# Returns: dyrt6p9l.up.railway.app
# Then resolve that:
dig dyrt6p9l.up.railway.app +short
# Returns: [NEW IP ADDRESS]
```

Or check Railway Dashboard for the current IP.

### Step 2: Update DNS A Record

1. Go to your DNS management panel
2. Find the A record for `@` (root domain)
3. Update the Address from old IP to new IP
4. Save Changes
5. Wait 1-2 hours for DNS propagation

### Step 3: Verify

```bash
dig storywall.com +short
# Should return the new IP
```

## Why We Can't Use CNAME

**Ideal solution**: CNAME (auto-updates)
- ❌ **Can't use**: Your DNS provider doesn't allow CNAME on `@` when MX records exist
- ✅ **Workaround**: A record (manual update if IP changes)

## Monitoring Strategy

### Option 1: Manual Check (Recommended)

Periodically check:
```bash
# Compare IPs - they should match
dig storywall.com +short      # Your A record
dig www.storywall.com +short  # Railway's current IP (via CNAME)
```

If they don't match, update the A record.

### Option 2: Set Up Monitoring

You could set up a monitoring service (like UptimeRobot) that:
- Checks `storywall.com` every few minutes
- Alerts you if it stops responding
- This would catch IP changes quickly

### Option 3: Railway Notifications

Check Railway's notification settings:
- Railway may notify you of infrastructure changes
- Check Railway Dashboard → Settings → Notifications

## Best Practice

1. **Check monthly**: Run `dig www.storywall.com +short` and compare with your A record
2. **If `www` works but root doesn't**: IP likely changed - update A record
3. **Keep `www` CNAME**: This always works because it auto-updates
4. **Monitor your site**: Set up basic uptime monitoring

## Summary

- **Railway IP is usually stable** - Most services keep the same IP for months/years
- **IP can change** - During redeployments, migrations, or infrastructure updates
- **Easy to fix** - Check `www.storywall.com` DNS to get new IP, update A record
- **Monitor monthly** - Compare `storywall.com` and `www.storywall.com` IPs

**For now**: Your configuration is correct. The IP `66.33.22.212` should remain stable. Just check it periodically (monthly is fine).

