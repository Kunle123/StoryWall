# Legal Documentation Setup Guide

This guide explains the legal pages, email addresses, and setup requirements for StoryWall.

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

### 2. **copyright@storywall.com** (DMCA/Copyright Takedown)
- **Purpose**: Copyright infringement claims and takedown requests
- **Used in**: Terms & Conditions (Section 8)
- **Priority**: High - Required for DMCA compliance

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

## Email Setup Instructions

### Option 1: Using Your Domain Provider (Recommended)

1. **Log in to your domain registrar** (where you purchased `storywall.com`)
2. **Navigate to Email/DNS settings**
3. **Create email forwarding rules** for each address:
   - `legal@storywall.com` → Your personal/business email
   - `copyright@storywall.com` → Your personal/business email
   - `privacy@storywall.com` → Your personal/business email
   - `moderation@storywall.com` → Your personal/business email
   - `appeals@storywall.com` → Your personal/business email
   - `support@storywall.com` → Your personal/business email

### Option 2: Using Google Workspace / Microsoft 365

1. **Set up Google Workspace or Microsoft 365** for `storywall.com`
2. **Create mailboxes** for each address
3. **Set up forwarding** if you want emails to go to a central inbox
4. **Configure auto-responders** if needed (e.g., "We received your request and will respond within 48 hours")

### Option 3: Using a Service Like Zoho Mail (Free Tier Available)

1. **Sign up for Zoho Mail** (free for up to 5 users)
2. **Add your domain** `storywall.com`
3. **Create mailboxes** for each address
4. **Set up forwarding** to your main email

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
- ⚠️ **TODO**: Set up email addresses
- ⚠️ **TODO**: Implement T&Cs acceptance tracking
- ⚠️ **TODO**: Add cookie consent banner (if using analytics cookies)

## DMCA Compliance

For DMCA/copyright takedown requests:

1. **Email address**: `copyright@storywall.com` (must be set up)
2. **Response time**: Aim to respond within 48 hours
3. **Process**: 
   - Receive takedown request
   - Verify it meets DMCA requirements
   - Remove or disable access to infringing content
   - Notify the user who posted the content
   - Provide counter-notification process if applicable

## Next Steps

1. **Set up email addresses** (see Email Setup Instructions above)
2. **Test email addresses** by sending test emails to each
3. **Implement T&Cs acceptance tracking** (Option A recommended)
4. **Add cookie consent banner** if using analytics cookies
5. **Review and customise** policy pages with your specific business details
6. **Update company information** in policy pages (address, registration number, etc.)
7. **Set up email auto-responders** for legal emails (acknowledgment of receipt)

## Important Notes

- **Email addresses must be functional** before going live
- **Copyright email is critical** - DMCA requires a designated agent
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

