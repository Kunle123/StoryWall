# Legal Setup Quick Start Guide

## ✅ What's Been Created

1. **Policy Pages** (all accessible and linked in footer):
   - Terms & Conditions: `/legal/terms`
   - Privacy Policy: `/legal/privacy`
   - Cookie Policy: `/legal/cookies`
   - Acceptable Use Policy: `/legal/acceptable-use`

2. **Signup Flow**: Updated to show T&Cs acceptance notice

3. **Footer**: Updated with links to all policy pages

## 🚨 Critical: Email Addresses You Must Set Up

You **must** set up these email addresses at `storywall.com` before going live:

### High Priority (Required for Legal Compliance)

1. **copyright@storywall.com** - DMCA/copyright takedown requests (required by law)
2. **privacy@storywall.com** - GDPR data protection requests (required by UK GDPR)
3. **legal@storywall.com** - General legal inquiries

### Medium Priority (Recommended)

4. **moderation@storywall.com** - Content violation reports
5. **appeals@storywall.com** - Account/content appeals
6. **support@storywall.com** - User support

## 📧 How to Set Up Emails

### Quick Option: Email Forwarding (Easiest)

1. Go to your domain registrar (where you bought `storywall.com`)
2. Find "Email Forwarding" or "Email Rules"
3. Forward each address to your personal/business email:
   - `copyright@storywall.com` → your-email@gmail.com
   - `privacy@storywall.com` → your-email@gmail.com
   - etc.

### Better Option: Professional Email (Recommended)

Use **Google Workspace** or **Microsoft 365**:
- Create mailboxes for each address
- Set up forwarding to a central inbox
- More professional and reliable

**Free Alternative**: Zoho Mail (free for 5 users)

## ⚠️ Terms & Conditions Acceptance

**Current Status**: Signup page shows T&Cs notice, but users don't explicitly check a box.

**Recommended Next Step**: Implement explicit acceptance tracking:

1. Add `termsAcceptedAt` field to User database model
2. Create `/legal/accept-terms` page
3. Redirect new users to accept T&Cs on first login
4. Store acceptance timestamp in database

See `docs/LEGAL_SETUP.md` for detailed implementation steps.

## ✅ What You Need to Do Now

1. **Set up email addresses** (see above) - **DO THIS FIRST**
2. **Test emails** - Send test emails to each address to verify they work
3. **Review policy pages** - Customise with your specific business details:
   - Company registration number (if applicable)
   - Physical address (if required)
   - VAT number (if applicable)
4. **Implement T&Cs acceptance tracking** (optional but recommended)
5. **Add cookie consent banner** (if using analytics cookies)

## 📋 UK GDPR Compliance Checklist

- ✅ Privacy Policy (UK GDPR compliant)
- ✅ Cookie Policy
- ✅ Terms & Conditions
- ✅ Acceptable Use Policy
- ✅ Data Protection Officer contact (privacy@storywall.com)
- ✅ ICO complaint information
- ⚠️ **TODO**: Set up email addresses
- ⚠️ **TODO**: Implement T&Cs acceptance (optional)
- ⚠️ **TODO**: Cookie consent banner (if needed)

## 📞 Email Addresses Summary

| Email | Purpose | Priority | Used In |
|-------|---------|----------|---------|
| copyright@storywall.com | DMCA takedowns | **HIGH** | Terms & Conditions |
| privacy@storywall.com | GDPR requests | **HIGH** | Privacy Policy |
| legal@storywall.com | Legal inquiries | **HIGH** | Terms & Conditions |
| moderation@storywall.com | Content reports | Medium | Acceptable Use |
| appeals@storywall.com | Account appeals | Medium | Acceptable Use |
| support@storywall.com | User support | Medium | Terms & Conditions |

## 🎯 Next Steps

1. **Set up emails** (30 minutes)
2. **Test emails** (10 minutes)
3. **Review policies** (1 hour - customise as needed)
4. **Optional**: Implement T&Cs acceptance (2-3 hours)

## 📚 Full Documentation

See `docs/LEGAL_SETUP.md` for complete setup instructions and legal compliance details.

