# DNS Records Reference for storywall.com

## Complete DNS Configuration

This is the exact configuration your DNS should have after fixing the root domain issue.

### Root Domain Records (for storywall.com)

| Host Name | Record Type | Address/Value | Priority | TTL | Action |
|-----------|-------------|---------------|----------|-----|--------|
| `@` | **CNAME** | `dyrt6p9l.up.railway.app` | - | 3600 | **FIX THIS** - Change from `storywall.com` to `@` |
| `@` | MX | `smtp01.hostinguk.net` | 10 | 3600 | ✅ Keep existing |
| `@` | MX | `mail.hostinguk.net` | 50 | 3600 | ✅ Keep existing |

**Note**: If your DNS provider doesn't allow CNAME on `@` when MX records exist, use an **A record** instead (get IP from Railway).

### Subdomain Records

| Host Name | Record Type | Address/Value | Priority | TTL | Action |
|-----------|-------------|---------------|----------|-----|--------|
| `www` | CNAME | `dyrt6p9l.up.railway.app` | - | 3600 | ✅ Keep existing |
| `accounts` | CNAME | `accounts.clerk.services` | - | 3600 | ✅ Keep existing |
| `clerk` | CNAME | `frontend-api.clerk.services` | - | 3600 | ✅ Keep existing |
| `clk._domainkey` | CNAME | `dkim1.eg0mov1sgas2.clerk.se` | - | 3600 | ✅ Keep existing |
| `clk2._domainkey` | CNAME | `dkim2.eg0mov1sgas2.clerk.se` | - | 3600 | ✅ Keep existing |
| `clkmail` | CNAME | `mail.eg0mov1sgas2.clerk.sen` | - | 3600 | ✅ Keep existing |

## What You Currently Have (Based on Screenshot)

✅ **Correct Records** (keep these):
- `www` CNAME → `dyrt6p9l.up.railway.app`
- `accounts` CNAME → `accounts.clerk.services`
- `clerk` CNAME → `frontend-api.clerk.services`
- `clk._domainkey` CNAME → `dkim1.eg0mov1sgas2.clerk.se`
- `clk2._domainkey` CNAME → `dkim2.eg0mov1sgas2.clerk.se`
- `clkmail` CNAME → `mail.eg0mov1sgas2.clerk.sen`
- `@` MX → `smtp01.hostinguk.net` (Priority 10)
- `@` MX → `mail.hostinguk.net` (Priority 50)

❌ **Incorrect Record** (fix this):
- `storywall.com` CNAME → `dyrt6p9l.up.railway.app` 
  - **Problem**: Host name should be `@` (or blank), not `storywall.com`
  - **Action**: Delete this record and add a new one with Host Name `@`

## Step-by-Step Fix

### Step 1: Delete the Incorrect Record

1. Find the row with:
   - Host Name: `storywall.com`
   - Record Type: `CNAME`
   - Address: `dyrt6p9l.up.railway.app`
2. Click the **Delete** button for that row
3. Click **Save Changes**

### Step 2: Add the Correct Record

1. Click **Add Entry**
2. Fill in:
   - **Host Name**: `@` (or leave blank - check your registrar's format)
   - **Record Type**: `CNAME` (or `A` if CNAME not allowed)
   - **Address**: `dyrt6p9l.up.railway.app`
   - **TTL**: `3600`
3. Click **Save Changes**

### Step 3: If CNAME Not Allowed (MX Conflict)

If your DNS provider gives an error about CNAME conflicting with MX records:

1. **Get Railway IP Address**:
   - Go to Railway Dashboard → Your Service → Settings → Domains
   - Look for `storywall.com` - Railway may show an IP address
   - Or contact Railway support for the IP

2. **Add A Record Instead**:
   - Host Name: `@` (or blank)
   - Record Type: `A`
   - Address: `[Railway's IP address]` (e.g., `35.123.45.67`)
   - TTL: `3600`

## Final DNS Configuration Summary

After the fix, you should have **exactly these records**:

### Root Domain (`@`)
- 1x CNAME (or A record) → Railway
- 2x MX records → Email servers

### Subdomains
- 1x `www` CNAME → Railway
- 5x Clerk CNAME records → Clerk services

**Total: 9 records** (8 existing + 1 fixed root domain record)

## Verification

After making the change:

1. **Wait 1-2 hours** for DNS propagation
2. **Test DNS resolution**:
   ```bash
   dig storywall.com +short
   # Should return: dyrt6p9l.up.railway.app (or Railway's IP)
   ```
3. **Check Railway Dashboard**:
   - `storywall.com` should show "Setup complete" (green checkmark)
4. **Test in browser**:
   - Visit `https://storywall.com` - should load
   - Should redirect to `https://www.storywall.com`

## Troubleshooting

### "CNAME already exists for root domain"
- You might have both `storywall.com` and `@` records
- Delete the `storywall.com` one, keep only `@`

### "CNAME conflicts with MX record"
- Your DNS provider doesn't allow CNAME on root when MX exists
- Solution: Use A record with Railway's IP instead

### DNS Not Propagating
- Wait up to 48 hours
- Check: https://dnschecker.org
- Enter: `storywall.com`
- Should show Railway's CNAME/IP after propagation

