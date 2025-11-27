# Add storywall.com DNS Record to Domain Registrar

## What Railway is Asking For

When you add `storywall.com` as a custom domain in Railway, Railway will provide DNS instructions. You need to add a DNS record in your domain registrar.

## Step-by-Step Instructions

### Step 1: Get DNS Instructions from Railway

Railway will show you something like:
- **Type**: CNAME
- **Host**: `@` (or leave blank)
- **Value**: `dyrt6p9l.up.railway.app` (or similar Railway domain)

**Copy these values** - you'll need them in your domain registrar.

### Step 2: Add DNS Record in Your Domain Registrar

1. Go to your domain registrar (where you bought `storywall.com`)
2. Navigate to **DNS Management** or **DNS Settings**
3. Find the section to add DNS records
4. Click **"Add Record"** or **"Create Record"**

### Step 3: Configure the CNAME Record

Enter the values Railway provided:

- **Host Name**: `@` (or leave blank - this means root domain)
  - Some registrars use `@` for root domain
  - Some registrars leave it blank for root domain
  - Check your registrar's documentation

- **Record Type**: `CNAME` (Alias)

- **Value/Target**: `dyrt6p9l.up.railway.app` (or whatever Railway provided)
  - This should match what Railway shows you

- **TTL**: `3600` (or use default)

### Step 4: Save and Wait

1. Click **"Save"** or **"Add Record"**
2. **Wait 1-2 hours** for DNS propagation (can take up to 48 hours)
3. Railway will automatically provision SSL certificate once DNS propagates

## Important Notes

### If CNAME Not Supported for Root Domain

Some DNS providers don't allow CNAME on root domain (`@`). If your registrar doesn't support it:

1. **Option A**: Use Railway's IP address (if Railway provides one)
   - Create an **A record** instead of CNAME
   - Host: `@` (or blank)
   - Type: `A`
   - Value: [Railway's IP address]

2. **Option B**: Contact Railway support
   - Ask if they can provide an A record instead
   - Or use Railway's domain configuration feature

### Don't Remove Existing Records

**Keep these existing records:**
- ✅ `www` CNAME → `dyrt6p9l.up.railway.app` (keep this!)
- ✅ `@` MX records (for email)
- ✅ Clerk CNAME records
- ✅ Other service records

**Only add** the new `@` CNAME record for Railway.

## After Adding DNS Record

1. **Check DNS propagation**: Use https://dnschecker.org
   - Enter: `storywall.com`
   - Should show Railway's CNAME after propagation

2. **Check Railway Dashboard**:
   - Go back to Railway → Your Service → Settings → Domains
   - `storywall.com` should show "Setup complete" (green checkmark)
   - This happens after DNS propagates and SSL is provisioned

3. **Test the domain**:
   - Visit `https://storywall.com` - should load (or redirect to www)
   - Visit `http://storywall.com` - should redirect to `https://www.storywall.com`

## Expected DNS Records After Adding

| Host Name | Type | Value | Purpose |
|-----------|------|-------|---------|
| `@` | CNAME | `dyrt6p9l.up.railway.app` | **NEW - Add this** |
| `www` | CNAME | `dyrt6p9l.up.railway.app` | Keep existing |
| `@` | MX | `smtp01.hostinguk.net` | Keep existing (email) |
| `@` | MX | `mail.hostinguk.net` | Keep existing (email) |
| `accounts` | CNAME | `accounts.clerk.services` | Keep existing |
| ... | ... | ... | Other Clerk records (keep) |

## Troubleshooting

### "CNAME already exists for root domain"
- You might have an existing CNAME or A record for `@`
- Check your DNS records
- You might need to remove/update an existing record

### "CNAME conflicts with MX record"
- Some DNS providers don't allow CNAME on root if MX exists
- Solution: Use A record with Railway's IP instead of CNAME
- Contact Railway for the IP address

### DNS Not Propagating
- Wait longer (can take up to 48 hours)
- Check DNS propagation: https://dnschecker.org
- Clear DNS cache: `sudo dscacheutil -flushcache` (Mac) or restart router

## Once DNS is Added

After DNS propagates and Railway shows "Setup complete":
1. Test `storywall.com` loads
2. Test redirect: `storywall.com` → `www.storywall.com`
3. Add both callback URLs to Twitter Developer Portal (if not already)
4. Test OAuth 1.0a again - this should fix the code 215 error!

