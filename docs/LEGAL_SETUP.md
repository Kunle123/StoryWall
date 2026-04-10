# Legal Documentation Setup Guide

This guide explains the legal pages, email addresses, and setup requirements for StoryWall.

**UK operations:** StoryWall is intended to comply with **UK** requirements — notably **UK GDPR**, the **Data Protection Act 2018**, **PECR** (cookies and electronic communications), and **English law** for contracts (see Terms). The **ICO** is the UK supervisory authority for data protection. Product copy and processes should be reviewed by **UK-qualified** advisers for your entity structure and risk profile.

## Policy Pages Created

The following legal pages have been created and are accessible at:

- **Terms & Conditions**: `/legal/terms`
- **Privacy Policy**: `/legal/privacy`
- **Cookie Policy**: `/legal/cookies`
- **Acceptable Use Policy**: `/legal/acceptable-use`

All pages are UK GDPR compliant and tailored for UK-based operations.

## Required Email Addresses

You need to set up the following email addresses at `storywall.com`:

### 1. **legal@storywall.com** (Primary Legal Contact)
- **Purpose**: General legal inquiries, Terms & Conditions questions
- **Used in**: Terms & Conditions, Acceptable Use Policy
- **Priority**: High

### 2. **copyright@storywall.com** (Copyright / takedown)
- **Purpose**: Copyright and intellectual-property infringement notices (UK **Copyright, Designs and Patents Act 1988** and related practice; many teams still describe this process informally as “DMCA-style” takedown for international users)
- **Used in**: Terms & Conditions (Section 8)
- **Priority**: High — required for a clear, monitored notice-and-takedown path

### 3. **privacy@storywall.com** (Data Protection)
- **Purpose**: Privacy inquiries, GDPR requests, data protection
- **Used in**: Privacy Policy, Cookie Policy
- **Priority**: High - Required for UK GDPR compliance

### 4. **moderation@storywall.com** (Content Moderation)
- **Purpose**: Reports of content violations, policy violations
- **Used in**: Acceptable Use Policy
- **Priority**: Medium

### 5. **appeals@storywall.com** (Account Appeals)
- **Purpose**: Appeals for content removal or account suspension
- **Used in**: Acceptable Use Policy
- **Priority**: Medium

### 6. **support@storywall.com** (Customer Support)
- **Purpose**: General user support, account issues
- **Used in**: Terms & Conditions (account termination)
- **Priority**: Medium

## Email setup instructions

You need **incoming** mail to each published address (legal, copyright, privacy, moderation, appeals, support). The app only shows `mailto:` links — delivery is entirely on your **DNS / email host**.

### Option A — Cloudflare Email Routing (recommended for forwarding)

**Best for:** Delivering all `@storywall.com` aliases to **one or two real inboxes** (e.g. Gmail) with no extra mailbox cost. Suitable for UK beta if you monitor the destination inbox daily.

**Requirements:** Domain uses **Cloudflare DNS** (nameservers pointed to Cloudflare). If the domain lives only at a registrar, either move DNS to Cloudflare or use Option B/C.

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com) → select **storywall.com** → **Email** → **Email Routing**.
2. **Enable** Email Routing. Cloudflare will add the required **MX** records (do not mix with another incoming-mail provider on the same zone — one system “owns” inbound mail).
3. Under **Destination addresses**, add the inbox(es) that will receive mail (you’ll verify each with a confirmation link).
4. Under **Routing rules**, create a rule for **each** address the policies advertise:

   | Custom address | Action |
   |----------------|--------|
   | `legal@storywall.com` | Send to your verified destination |
   | `copyright@storywall.com` | Same (or a dedicated inbox if you prefer) |
   | `privacy@storywall.com` | Same — **must** be monitored for UK GDPR / data requests |
   | `moderation@storywall.com` | Same |
   | `appeals@storywall.com` | Same |
   | `support@storywall.com` | Same |

   You can use **one destination** for all six at first; split later if volume grows.

5. **Catch-all** (optional): A catch-all to one inbox is convenient for typos; ensure that inbox is checked or you risk missing `privacy@` / `copyright@` traffic.

6. **Test:** From an **external** account (not the destination), send one message to each of `privacy@`, `copyright@`, `support@`. Confirm arrival within a few minutes.

7. **Replying as @storywall.com:** Email Routing delivers **to** you; **sending** from `support@storywall.com` usually needs **Google Workspace**, **Microsoft 365**, or an SMTP provider. For beta, replying from your normal address and signing “StoryWall Support” is often enough until you add Workspace.

**UK note:** ICO and users expect **privacy@** (and other published contacts) to reach a **person who can act** — forwarding to an unmonitored mailbox is not compliant.

---

### Option B — Registrar or host “email forwarding”

1. Log in to where **DNS or email** for `storywall.com` is managed (registrar, Plesk, cPanel, etc.).
2. Find **forwarding**, **aliases**, or **catch-all** and map each address to your working inbox (same list as above).
3. Confirm **MX** records match what that provider requires (only one inbound email system per domain).

---

### Option C — Google Workspace / Microsoft 365 (full mailboxes)

1. Verify the domain and add **MX** records as instructed by Google or Microsoft.
2. Create **users** or **groups** for `legal@`, `copyright@`, etc., or use **shared mailboxes / groups** that forward to founders.
3. Configure **DKIM** / **SPF** as the provider recommends (important for deliverability when **sending** mail).

---

### Option D — Zoho Mail (free/low-cost mailboxes)

1. Add `storywall.com` in Zoho and complete DNS verification.
2. Create mailboxes or aliases for each address; forward to a main inbox if desired.

---

### Verification checklist (do before calling mail “live”)

- [ ] `legal@storywall.com` — test received
- [ ] `copyright@storywall.com` — test received
- [ ] `privacy@storywall.com` — test received
- [ ] `moderation@storywall.com` — test received
- [ ] `appeals@storywall.com` — test received
- [ ] `support@storywall.com` — test received
- [ ] Someone is **responsible** for checking the destination inbox at least **daily** during beta (especially **privacy@** and **copyright@**)
- [ ] Optional: vacation/auto-reply acknowledging receipt within **48 hours** for legal/privacy (matches expectations in internal docs)

## Terms & Conditions Acceptance

### Current Implementation

The signup page now displays a notice that users agree to Terms & Conditions and Privacy Policy when signing up. However, **Clerk does not natively support required checkbox acceptance** in the signup form.

### Recommended: Add Explicit Acceptance

To ensure users explicitly accept T&Cs, you have two options:

#### Option A: Post-Signup Acceptance (Recommended for MVP)

1. **Create a middleware or page** that checks if the user has accepted T&Cs
2. **Redirect new users** to an acceptance page after first login
3. **Store acceptance** in your database (add a `termsAcceptedAt` field to the User model)

#### Option B: Custom Signup Form (More Complex)

1. **Create a custom signup form** instead of using Clerk's default
2. **Include a required checkbox** for T&Cs acceptance
3. **Store acceptance** before creating the Clerk account

### Implementation Steps for Option A

1. **Add field to User model**:
   ```prisma
   model User {
     // ... existing fields
     termsAcceptedAt DateTime?
   }
   ```

2. **Create acceptance page** at `/legal/accept-terms`
3. **Add middleware** to check and redirect if not accepted
4. **Update user creation** to set `termsAcceptedAt` when accepted

## Footer Links

The footer component has been updated to include links to all policy pages. The footer appears on pages that use it (you may need to add it to your main layout if it's not already there).

## UK GDPR Compliance Checklist

- ✅ Privacy Policy created (UK GDPR compliant)
- ✅ Cookie Policy created
- ✅ Terms & Conditions created
- ✅ Acceptable Use Policy created
- ✅ Data Protection Officer contact (privacy@storywall.com)
- ✅ ICO complaint information included
- ✅ User rights clearly explained
- ⚠️ **TODO**: Set up email addresses — follow **Option A** (or B/C/D) in [Email setup instructions](#email-setup-instructions) and complete the **Verification checklist**
- ⚠️ **TODO**: Implement T&Cs acceptance tracking
- ⚠️ **TODO**: Add cookie consent banner (if using analytics cookies)

## Copyright / takedown process (UK)

For notices sent to `copyright@storywall.com`:

1. **Mailbox** must be set up and monitored (see [Email setup instructions](#email-setup-instructions)).
2. **Response time:** Aim to acknowledge within **48 hours** (internal target; your lawyer may suggest different SLAs).
3. **Process (high level):** receive notice → assess validity under **UK** law and your Terms → remove or restrict content where appropriate → notify the affected user where required → document decisions. Use **UK-qualified** advice for procedure and record-keeping.

## Next Steps

1. **Set up email addresses** (see [Email setup instructions](#email-setup-instructions); complete the **Verification checklist**)
2. **Test** each address from an external mail account
3. **Implement T&Cs acceptance tracking** (Option A recommended)
4. **Add cookie consent banner** if using analytics cookies
5. **Review and customise** policy pages with your specific business details
6. **Update company information** in policy pages (address, registration number, etc.)
7. **Set up email auto-responders** for legal emails (acknowledgment of receipt)

## Important Notes

- **Email addresses must be functional** before going live
- **Copyright email is critical** — a working **copyright@** path is expected for takedown-style notices (UK CDPA / practice; US “DMCA agent” rules apply only if you operate under US law)
- **Privacy email is required** for UK GDPR compliance
- **Response times matter** - aim for 48-hour response to legal inquiries
- **Keep policy pages updated** - review quarterly or when laws change

## Customisation Required

Before going live, update the following in the policy pages:

1. **Company registration details** (if applicable)
2. **Physical address** (if required by law)
3. **Company registration number** (if applicable)
4. **VAT number** (if applicable)
5. **Specific business practices** that may differ from the template

## Support

If you need help setting up emails or implementing T&Cs acceptance, refer to:
- Your domain registrar's documentation
- Clerk documentation for custom signup flows
- UK ICO guidance: https://ico.org.uk

