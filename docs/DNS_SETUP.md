# DNS Setup Guide for storywall.com

## Current Issue

You have **conflicting DNS records** for `www`:
1. An **A record** pointing to `217.194.210.198` (for web forwarding)
2. A **CNAME** pointing to `dyrt6p9l.up.railway.app` (for Railway hosting)

**You cannot have both an A record and a CNAME for the same hostname.** The CNAME is taking precedence, which is why web forwarding isn't working.

## Solution: Use Application-Level Redirect Instead

Since you're hosting on Railway, it's better to handle the redirect at the application level (Next.js middleware) rather than DNS forwarding. This gives you more control and better performance.

## DNS Records You Should Have

### 1. Remove the Conflicting A Record

**DELETE** this record:
- Host Name: `www`
- Record Type: `A (Address)`
- Address: `217.194.210.198`

### 2. Keep the Railway CNAME

**KEEP** this record:
- Host Name: `www`
- Record Type: `CNAME (Alias)`
- Address: `dyrt6p9l.up.railway.app`
- TTL: `3600`

### 3. Add Root Domain Record

**ADD** this record for `storywall.com` (without www):
- Host Name: `@` (or leave blank, depending on your DNS provider)
- Record Type: `CNAME (Alias)` (or `A` if CNAME not supported for root)
- Address: `dyrt6p9l.up.railway.app`
- TTL: `3600`

**Note**: Some DNS providers don't allow CNAME on the root domain. If yours doesn't:
- Use an **A record** instead
- Get the IP address from Railway (check Railway dashboard → your service → Settings → Domains)
- Or use Railway's domain configuration to handle the root domain

### 4. Keep Email Records

**KEEP** these MX records:
- Host Name: `@`
- Record Type: `MX (Mail Exchange)`
- Address: `smtp01.hostinguk.net` (Priority: 10)
- Address: `mail.hostinguk.net` (Priority: 50)

### 5. Keep Clerk Records

**KEEP** all Clerk-related CNAME records:
- `accounts` → `accounts.clerk.services`
- `clerk` → `frontend-api.clerk.services`
- `clk._domainkey` → `dkim1.eg0mov1sgas2.clerk.`
- `clk2._domainkey` → `dkim2.eg0mov1sgas2.clerk.`
- `clkmail` → `mail.eg0mov1sgas2.clerk.se`

## Application-Level Redirect

The Next.js middleware has been updated to automatically redirect `storywall.com` → `www.storywall.com` with a 301 (permanent) redirect.

This means:
- Users visiting `storywall.com` will be redirected to `www.storywall.com`
- Search engines will understand this is a permanent redirect
- Better performance than DNS forwarding

## Final DNS Configuration

After making changes, your DNS records should look like:

| Host Name | Type | Address | Priority | TTL |
|-----------|------|---------|----------|-----|
| `@` | CNAME (or A) | `dyrt6p9l.up.railway.app` | - | 3600 |
| `www` | CNAME | `dyrt6p9l.up.railway.app` | - | 3600 |
| `accounts` | CNAME | `accounts.clerk.services` | - | 3600 |
| `clerk` | CNAME | `frontend-api.clerk.services` | - | 3600 |
| `clk._domainkey` | CNAME | `dkim1.eg0mov1sgas2.clerk.` | - | 3600 |
| `clk2._domainkey` | CNAME | `dkim2.eg0mov1sgas2.clerk.` | - | 3600 |
| `clkmail` | CNAME | `mail.eg0mov1sgas2.clerk.se` | - | 3600 |
| `@` | MX | `smtp01.hostinguk.net` | 10 | 3600 |
| `@` | MX | `mail.hostinguk.net` | 50 | 3600 |

## Disable Web Forwarding

Since we're using application-level redirects, you can:
1. **Disable web forwarding** in your domain registrar
2. Click "Cancel all forwarding" in the web forwarding interface

## Testing

After making DNS changes:

1. **Wait for DNS propagation** (can take up to 48 hours, usually 1-2 hours)
2. **Test the redirect**:
   - Visit `http://storywall.com` (should redirect to `www.storywall.com`)
   - Visit `https://storywall.com` (should redirect to `https://www.storywall.com`)
3. **Check DNS propagation**: Use tools like:
   - https://dnschecker.org
   - https://www.whatsmydns.net

## Railway Domain Configuration

Make sure in Railway:
1. Your service has both domains configured:
   - `storywall.com`
   - `www.storywall.com`
2. SSL certificates are enabled for both domains

## Troubleshooting

### Redirect Not Working

1. **Check DNS propagation**: Ensure DNS has updated (use DNS checker tools)
2. **Clear browser cache**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. **Check Railway logs**: Ensure the app is receiving requests
4. **Verify middleware**: Check that middleware is running (check Railway logs)

### CNAME on Root Domain Not Supported

If your DNS provider doesn't support CNAME on root domain:
1. Use Railway's IP address (get from Railway dashboard)
2. Create an A record for `@` pointing to that IP
3. Note: If Railway's IP changes, you'll need to update the A record

### Email Not Working

If email stops working after changes:
1. Ensure MX records are still present
2. Check email provider settings
3. Verify DNS propagation for MX records

## Summary

1. ✅ **Delete** the `www` A record (217.194.210.198)
2. ✅ **Keep** the `www` CNAME (Railway)
3. ✅ **Add** root domain (`@`) CNAME or A record (Railway)
4. ✅ **Disable** web forwarding
5. ✅ **Deploy** the updated middleware (already done)
6. ✅ **Wait** for DNS propagation
7. ✅ **Test** the redirect

The redirect will now work at the application level, which is more reliable and performant than DNS forwarding.

