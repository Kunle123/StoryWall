# Production Readiness Checklist

This document outlines everything you need to do before going live with paying customers.

## 🔴 Critical (Must Do Before Launch)

### 1. Payment Processing (Stripe)
- [ ] **Switch Stripe to Live Mode**
  - [ ] Get live API keys (`sk_live_...`) from Stripe Dashboard
  - [ ] Update Railway environment variable: `STRIPE_SECRET_KEY` = live key
  - [ ] Create production webhook endpoint in Stripe Dashboard
  - [ ] Update Railway environment variable: `STRIPE_WEBHOOK_SECRET` = production webhook secret
  - [ ] Update `NEXT_PUBLIC_BASE_URL` to production URL (`https://www.storywall.com`)
  - [ ] Test with a real payment (you can refund yourself)
  - [ ] Verify credits are added correctly after payment
  - [ ] Check webhook events in Stripe Dashboard → Webhooks → Recent events

**Documentation**: `docs/setup/STRIPE_LIVE_SETUP.md`

### 2. Authentication (Clerk)
- [ ] **Switch Clerk to Production Mode**
  - [ ] Get production API keys (`pk_live_...`, `sk_live_...`)
  - [ ] Update Railway environment variables:
    - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = production publishable key
    - `CLERK_SECRET_KEY` = production secret key
  - [ ] Configure production redirect URLs in Clerk Dashboard:
    - `https://www.storywall.com/sign-in`
    - `https://www.storywall.com/sign-up`
    - `https://www.storywall.com/`
  - [ ] Test sign-up and sign-in flows in production
  - [ ] Verify user creation and credit assignment (30 credits)

**Documentation**: `docs/setup/CLERK_PRODUCTION_SETUP.md`

### 3. Legal Compliance
- [ ] **Set Up Email Addresses** (Required for legal compliance)
  - [ ] `legal@storywall.com` - General legal inquiries
  - [ ] `copyright@storywall.com` - DMCA/copyright takedown requests (CRITICAL)
  - [ ] `privacy@storywall.com` - GDPR/data protection inquiries (CRITICAL)
  - [ ] `moderation@storywall.com` - Content moderation reports
  - [ ] `appeals@storywall.com` - Account/content appeals
  - [ ] `support@storywall.com` - Customer support
  - [ ] Test all email addresses by sending test emails
  - [ ] Set up email forwarding or mailboxes
  - [ ] Configure auto-responders (optional but recommended)

- [ ] **Review and Customize Policy Pages**
  - [ ] Update company information in all policy pages:
    - Company name
    - Physical address (if required)
    - Company registration number (if applicable)
    - VAT number (if applicable)
  - [ ] Review Terms & Conditions for accuracy
  - [ ] Review Privacy Policy for accuracy
  - [ ] Verify all email addresses in policy pages match your setup

- [ ] **Terms & Conditions Acceptance** (Optional but Recommended)
  - [ ] Implement T&Cs acceptance tracking (add `termsAcceptedAt` to User model)
  - [ ] Create acceptance page or middleware redirect
  - [ ] Store acceptance timestamp in database

**Documentation**: `docs/LEGAL_SETUP.md`, `docs/LEGAL_QUICK_START.md`

### 4. Domain & DNS
- [ ] **Verify DNS Configuration**
  - [ ] Remove conflicting A record for `www` (if exists)
  - [ ] Ensure `www` CNAME points to Railway
  - [ ] Add root domain (`@`) CNAME or A record pointing to Railway
  - [ ] Verify SSL certificates are enabled for both `storywall.com` and `www.storywall.com`
  - [ ] Test redirect: `storywall.com` → `www.storywall.com` (should work via middleware)
  - [ ] Disable web forwarding in domain registrar (if using)

**Documentation**: `docs/DNS_SETUP.md`

### 5. Environment Variables (Railway)
- [ ] **Verify All Required Variables Are Set**
  - [ ] `DATABASE_URL` (auto-set by Railway PostgreSQL service)
  - [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (production)
  - [ ] `CLERK_SECRET_KEY` (production)
  - [ ] `STRIPE_SECRET_KEY` (live mode)
  - [ ] `STRIPE_WEBHOOK_SECRET` (production webhook)
  - [ ] `NEXT_PUBLIC_BASE_URL` = `https://www.storywall.com`
  - [ ] `CLOUDINARY_CLOUD_NAME`
  - [ ] `CLOUDINARY_API_KEY`
  - [ ] `CLOUDINARY_API_SECRET`
  - [ ] `OPENAI_API_KEY` (or `KIMI_API_KEY` if using Kimi)
  - [ ] `REPLICATE_API_TOKEN`
  - [ ] `AI_PROVIDER` (if using Kimi)

**Documentation**: `docs/setup/ENV_SETUP.md`

### 6. Database
- [ ] **Run Production Migrations**
  - [ ] Ensure all migrations are applied: `npx prisma migrate deploy`
  - [ ] Verify database schema is up to date
  - [ ] Test database connection in production
  - [ ] Verify user creation works (30 credits assigned)

### 7. Testing
- [ ] **End-to-End Testing in Production**
  - [ ] Test user sign-up (verify 30 credits assigned)
  - [ ] Test credit purchase flow (all 3 packages)
  - [ ] Test timeline creation (all 6 steps)
  - [ ] Test event generation
  - [ ] Test description generation
  - [ ] Test image generation (verify credit deduction: 1 credit per image)
  - [ ] Test timeline publishing
  - [ ] Test timeline viewing (public/private)
  - [ ] Test social media timeline creation
  - [ ] Test error handling (insufficient credits, API failures)

---

## 🟡 Important (Should Do Before Launch)

### 8. Error Monitoring & Logging
- [ ] **Set Up Error Monitoring** (Recommended: Sentry, LogRocket, or similar)
  - [ ] Install error monitoring service
  - [ ] Configure error tracking for:
    - Client-side errors (React error boundaries)
    - Server-side errors (API routes)
    - Payment failures
    - Image generation failures
  - [ ] Set up alerts for critical errors
  - [ ] Configure error notifications (email/Slack)

- [ ] **Set Up Application Logging**
  - [ ] Verify Railway logs are accessible
  - [ ] Set up log aggregation (optional but recommended)
  - [ ] Configure log retention policy

### 9. Analytics & Monitoring
- [ ] **Set Up Analytics** (Optional but Recommended)
  - [ ] Google Analytics or similar
  - [ ] Track key metrics:
    - User sign-ups
    - Credit purchases
    - Timeline creations
    - Image generations
    - Page views
  - [ ] Set up conversion tracking

- [ ] **Set Up Uptime Monitoring**
  - [ ] Use service like UptimeRobot, Pingdom, or StatusCake
  - [ ] Monitor production URL
  - [ ] Set up alerts for downtime

### 10. Security
- [ ] **Review Security Settings**
  - [ ] Verify all API keys are in environment variables (not in code)
  - [ ] Check that `.env` files are in `.gitignore`
  - [ ] Review API route authentication
  - [ ] Verify CORS settings (if applicable)
  - [ ] Check for SQL injection vulnerabilities (Prisma handles this, but verify)
  - [ ] Review file upload security (reference photos)

- [ ] **Rate Limiting** (Consider Adding)
  - [ ] Add rate limiting to AI generation endpoints
  - [ ] Add rate limiting to image generation endpoints
  - [ ] Add rate limiting to credit purchase endpoints
  - [ ] Consider using a service like Upstash Redis for rate limiting

### 11. Performance
- [ ] **Performance Testing**
  - [ ] Test page load times
  - [ ] Test image generation latency
  - [ ] Test description generation latency
  - [ ] Optimize slow endpoints
  - [ ] Verify caching is working (if implemented)

- [ ] **Database Performance**
  - [ ] Review database indexes
  - [ ] Monitor query performance
  - [ ] Set up database connection pooling (Railway may handle this)

### 12. Backup & Recovery
- [ ] **Database Backups**
  - [ ] Verify Railway PostgreSQL has automatic backups enabled
  - [ ] Test database restore process (optional but recommended)
  - [ ] Document backup retention policy

- [ ] **Data Recovery Plan**
  - [ ] Document recovery procedures
  - [ ] Test data recovery (optional)

### 13. Content Moderation
- [ ] **Content Review Process**
  - [ ] Set up process for reviewing reported content
  - [ ] Test content reporting flow
  - [ ] Verify moderation email (`moderation@storywall.com`) works
  - [ ] Document moderation guidelines

### 14. Customer Support
- [ ] **Support Channels**
  - [ ] Set up support email (`support@storywall.com`)
  - [ ] Create support documentation/FAQ (optional)
  - [ ] Set up support ticket system (optional but recommended)
  - [ ] Document common issues and solutions

---

## 🟢 Nice to Have (Can Do After Launch)

### 15. Additional Features
- [ ] Email notifications (welcome email, purchase confirmations)
- [ ] User onboarding flow
- [ ] Help documentation
- [ ] Video tutorials
- [ ] Blog or changelog
- [ ] Social media presence

### 16. Marketing
- [ ] Landing page optimization
- [ ] SEO optimization
- [ ] Social media accounts
- [ ] Marketing materials

---

## 📋 Pre-Launch Testing Checklist

### Payment Flow
- [ ] Test Mini Pack purchase ($1.49 for 20 credits)
- [ ] Test Starter Pack purchase ($12.99 for 200 credits)
- [ ] Test Pro Pack purchase ($79.99 for 2000 credits)
- [ ] Verify credits are added correctly
- [ ] Test payment failure handling
- [ ] Test refund process (if needed)

### Timeline Creation
- [ ] Test standard timeline creation (all 6 steps)
- [ ] Test social media timeline creation
- [ ] Test with person subject (canned descriptions)
- [ ] Test with non-person subject (canned descriptions)
- [ ] Test numbered events
- [ ] Test dated events
- [ ] Test BC dates
- [ ] Test image generation (verify credit deduction)
- [ ] Test timeline publishing

### User Experience
- [ ] Test sign-up flow
- [ ] Test sign-in flow
- [ ] Test profile page
- [ ] Test timeline viewing (public/private)
- [ ] Test timeline sharing
- [ ] Test mobile responsiveness
- [ ] Test on different browsers (Chrome, Safari, Firefox, Edge)

### Error Scenarios
- [ ] Test insufficient credits handling
- [ ] Test API failures (AI generation, image generation)
- [ ] Test network errors
- [ ] Test invalid input handling
- [ ] Test edge cases (very long titles, special characters, etc.)

---

## 🚨 Critical Issues to Fix Before Launch

1. **Payment Processing**: Must be working with live Stripe keys
2. **Authentication**: Must be working with production Clerk keys
3. **Legal Emails**: Must be set up (especially `copyright@` and `privacy@`)
4. **Domain**: Must be properly configured and redirecting
5. **Database**: Must have all migrations applied
6. **Environment Variables**: All required variables must be set in Railway

---

## 📝 Quick Reference: Required Email Addresses

| Email | Purpose | Priority | Status |
|-------|---------|----------|--------|
| `legal@storywall.com` | General legal inquiries | High | ⬜ |
| `copyright@storywall.com` | DMCA/copyright takedown | **CRITICAL** | ⬜ |
| `privacy@storywall.com` | GDPR/data protection | **CRITICAL** | ⬜ |
| `moderation@storywall.com` | Content moderation | Medium | ⬜ |
| `appeals@storywall.com` | Account appeals | Medium | ⬜ |
| `support@storywall.com` | Customer support | Medium | ⬜ |

---

## 🎯 Launch Day Checklist

1. [ ] All critical items (🔴) are complete
2. [ ] All important items (🟡) are reviewed
3. [ ] Final end-to-end testing completed
4. [ ] Payment flow tested with real payment
5. [ ] All email addresses are functional
6. [ ] Error monitoring is set up
7. [ ] Support email is monitored
8. [ ] Ready to handle customer inquiries

---

## 📞 Support Resources

- **Stripe Support**: https://support.stripe.com
- **Clerk Support**: https://clerk.com/docs/support
- **Railway Support**: https://railway.app/help
- **UK ICO**: https://ico.org.uk (for GDPR compliance)

---

## ⚠️ Important Notes

1. **Never commit API keys or secrets to git**
2. **Test with real payments before launch** (you can refund yourself)
3. **Email addresses must be functional** before going live
4. **Copyright email is legally required** for DMCA compliance
5. **Privacy email is required** for UK GDPR compliance
6. **Monitor error logs** closely in the first few days after launch
7. **Have a rollback plan** in case of critical issues

---

## 🎉 After Launch

1. Monitor error logs daily
2. Monitor payment transactions
3. Respond to customer support emails promptly
4. Review and improve based on user feedback
5. Monitor credit usage patterns
6. Track conversion rates
7. Optimize based on analytics

