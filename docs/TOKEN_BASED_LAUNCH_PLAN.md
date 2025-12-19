# Storywall Token-Based Launch Plan - Implementation Guide

This document provides the implementation plan for the token-based AI imagery launch strategy.

---

## Core Business Model

- **Free:** Timeline creation (unlimited)
- **Paid:** AI image generation via tokens (1 token = 1 image)
- **New User Bonus:** 30 free tokens on signup
- **Monetization Focus:** Converting free users to paying customers through AI image quality

---

## PHASE 1: Foundational Seeding (Week 1-2)

### 1.1 Create 20-30 High-Quality Seed Timelines ⭐ **CRITICAL**

**Requirements:**
- 3-5 core niches (visually rich topics)
- 5-7 timelines per niche
- 10-15 events per timeline
- **ALL images must be AI-generated** (demonstrates paid feature)
- Showcase diverse AI image styles

**Implementation:**
- Use admin account to create seed timelines
- Mark all as "Featured" in database
- Ensure each uses different image styles (Illustration, Photo, Comic Book, Vintage, etc.)

**Database:**
- Already have `isFeatured` field
- Need to mark seed timelines as featured

**Files:**
- Admin script to bulk create seed timelines
- Or manual creation via editor

---

### 1.2 Featured Section with Creator Personas ⭐ **CRITICAL**

**Status:** ✅ Partially complete (featured section exists, needs creator personas)

**What's needed:**
- Display creator personas on featured timelines
- Format: "Created by [persona description]"
- Examples: "Created by a military historian", "Created by an art student"

**Implementation:**
- Add persona field to User model (optional, for seed accounts)
- Or use bio field creatively
- Display on timeline cards and timeline pages

**Database:**
```prisma
model User {
  // ... existing fields
  persona String? @map("persona") @db.VarChar(100) // e.g., "military historian", "art student"
}
```

**Files to modify:**
- `app/(main)/page.tsx` - Add persona to featured timeline cards
- `app/(main)/timeline/[id]/page.tsx` - Display persona
- `app/(main)/story/[id]/page.tsx` - Display persona

---

## PHASE 2: Creator-First Seeding (Week 2-4)

### 2.1 30 Free Tokens on Signup ⭐ **CRITICAL**

**Status:** ✅ Already implemented

**Current Implementation:**
- ✅ `getOrCreateUser` function grants 30 tokens on user creation (line 83 in `lib/db/users.ts`)
- ⏳ Welcome email with token information (needs implementation)
- ⏳ Token balance display in editor (needs implementation)

**What's still needed:**
- Welcome email template ("Here are your 30 free AI image credits!")
- Token balance display in editor UI
- Guide users to use their free credits

**Files to modify:**
- Email templates - Add welcome email
- `app/(main)/editor/page.tsx` - Display token balance
- `components/timeline-editor/GenerateImagesStep.tsx` - Show token cost prominently

---

### 2.2 Onboarding Focused on First Token Spend ⭐ **CRITICAL**

**What's needed:**
- Clear token balance display throughout editor
- Step 5 (Generate Images) should prominently show token cost
- Button text: "Generate Images (1 credit per image)"
- Guide users to use their free credits

**Implementation:**
- Add token balance widget to editor header
- Update GenerateImagesStep to show token cost
- Add tooltip/help text explaining token system

**Files to modify:**
- `components/timeline-editor/GenerateImagesStep.tsx` - Show token cost
- `app/(main)/editor/page.tsx` - Add token balance display
- `components/layout/Header.tsx` - Show token balance (optional)

---

## PHASE 3: Strategic Public Seeding (Month 2)

### 3.1 Collection Pages ⭐ **HIGH**

**Status:** ⏳ Pending (already in roadmap)

**What's needed:**
- SEO-optimized collection pages
- Examples: `/collections/ancient-rome`, `/collections/world-war-ii`
- Feature best community timelines per topic

**Implementation:**
- Create collection pages
- Filter timelines by hashtags or categories
- Add collection metadata for SEO

**Files to create:**
- `app/(main)/collections/[slug]/page.tsx`
- `app/(main)/collections/page.tsx`

---

### 3.2 Social Media Content Calendar ⭐ **HIGH**

**What's needed:**
- "Timeline of the Day" content
- "AI Showcase" video format
- Daily posting schedule across platforms

**Implementation:**
- Manual content creation (not code)
- But can create tools to help:
  - Export timeline as shareable images
  - Generate "AI Gallery" collage
  - Create "Before & After" templates

**Files to create:**
- `app/api/timelines/[id]/export/gallery/route.ts` - Export AI gallery collage
- `app/api/timelines/[id]/export/before-after/route.ts` - Generate before/after template

---

## PHASE 4: The Compounding Loop

### 4.1 Watermark on First & Last Images ⭐ **CRITICAL**

**Status:** ⏳ Needs implementation

**Requirements from Viral Loop Guide:**
- **Location:** Bottom-right corner of first and last images only
- **Text:** "Created with AI on **Storywall.com**" (Storywall.com should be bold/linked)
- **Style:** Subtle, semi-transparent
- **Context:** Applies to shared sequences (Twitter threads, Instagram carousels, etc.)
- **Why:** Explicitly attributes quality to "AI" and provides direct CTA to website

**Implementation:**
- Add watermark overlay component
- Detect first/last images in timeline sequence
- Apply watermark on timeline/story pages
- Make Storywall.com clickable (links to homepage)

**Files to create:**
- `lib/utils/watermark.ts` - Watermark utility
- `components/timeline/ImageWithWatermark.tsx` - Watermarked image component

**Files to modify:**
- `app/(main)/timeline/[id]/page.tsx` - Apply watermark to first/last images
- `app/(main)/story/[id]/page.tsx` - Apply watermark if first/last in sequence
- `components/timeline/Timeline.tsx` - Detect first/last images

---

### 4.2 "Create Your Own" CTA with 30 Free Credits Hook ⭐ **CRITICAL**

**Status:** ✅ Complete (viral footer updated, signup page has correct messaging)

**Requirements from Viral Loop Guide:**
- **On Timeline Page:** Prominent button: "Create Your Own Timeline & Get 30 Free AI Image Credits"
- **Links to:** Signup page (`/sign-up`)
- **Signup Page Headline:** "Welcome to Storywall! Your 30 free AI image credits are ready." ✅ (Already implemented)
- **Welcome Email Subject:** "Here are your 30 free AI image credits!" (needs email template)

**Implementation:**
- ✅ Viral footer updated with correct button text
- ✅ Signup page has correct headline
- ⏳ Need to create welcome email template

**Files to modify:**
- Email templates - Add welcome email with subject line
- `components/sharing/ViralFooter.tsx` - ✅ Already updated

---

### 4.3 Creator Shareable Assets ⭐ **HIGH**

**Requirements from Viral Loop Guide:**

#### "My AI Gallery" Export
- Single high-resolution image collage of all AI-generated images from timeline
- Includes Storywall logo
- Includes creator's username
- Perfect for Pinterest, blog hero images

#### "Before & After" Template
- Simple social media template
- Left side: Text-only event description ("Before")
- Right side: AI-generated image ("After")
- Visually explains value of token spend

**Implementation:**
- Create export endpoints
- Generate collage images server-side (using canvas or image library)
- Generate before/after template images
- Provide high-resolution downloads

**Files to create:**
- `app/api/timelines/[id]/export/gallery/route.ts` - AI Gallery export
- `app/api/timelines/[id]/export/before-after/route.ts` - Before/After template
- `lib/utils/image-collage.ts` - Collage generation utility
- `lib/utils/before-after-template.ts` - Before/After template generator
- `app/(main)/timeline/[id]/export/page.tsx` - Export UI page (optional)

**Technical Notes:**
- Use `canvas` library or `sharp` for server-side image manipulation
- Detect which images are AI-generated (track `image_prompt` field)
- Only include AI-generated images in gallery

---

### 4.4 Spotlight & Reward Top AI Image Users ⭐ **HIGH**

**What's needed:**
- "Creator of the Week" featuring
- "Timeline of the Week" contest
- Bonus credits for winners

**Implementation:**
- Track AI image usage per creator
- Admin panel to select winners
- Grant bonus credits

**Database:**
- Track AI-generated images vs manual uploads
- Add `aiImageCount` to User model

**Files to create:**
- `app/(main)/admin/spotlight/page.tsx` - Spotlight management
- `app/api/admin/spotlight/route.ts` - Grant bonus credits

---

## PHASE 5: Monetization & Metrics

### 5.1 Token Purchase System ⭐ **CRITICAL**

**Status:** ✅ Already exists

**Current Implementation:**
- ✅ `BuyCreditsModal` component exists
- ✅ Stripe checkout integration (`/api/stripe/checkout`)
- ✅ Credit packages defined:
  - Mini Pack: 20 credits for $1.49
  - Starter Pack: 200 credits for $12.99 (popular)
  - Pro Pack: 2000 credits for $79.99

**Note:** Current pricing is in USD. The launch plan specifies GBP pricing:
- £5: 50 tokens
- £10: 120 tokens (20 bonus)
- £20: 250 tokens (50 bonus)

**Optional Updates (if changing to GBP pricing):**
- Update `creditPackages` in `components/BuyCreditsModal.tsx`
- Update `CREDIT_PACKAGES` in `app/api/stripe/checkout/route.ts`
- Update currency in Stripe checkout to 'gbp'

**Files (existing):**
- `components/BuyCreditsModal.tsx` - Purchase modal
- `app/api/stripe/checkout/route.ts` - Stripe checkout
- `app/api/credits/route.ts` - Credits API
- `app/api/credits/deduct/route.ts` - Credits deduction

---

### 5.2 Subscription Plans ⭐ **HIGH**

**What's needed:**
- Pro Plan: £15/month, 300 tokens/month
- Educator Plan: £25/month, 500 tokens/month + classroom tools
- Monthly token reset
- Stripe subscription integration

**Database:**
```prisma
model User {
  // ... existing fields
  subscriptionTier String? @default(null) @map("subscription_tier") // "pro", "educator"
  subscriptionExpiresAt DateTime? @map("subscription_expires_at")
  monthlyTokenAllowance Int @default(0) @map("monthly_token_allowance")
  monthlyTokensUsed Int @default(0) @map("monthly_tokens_used")
  monthlyResetAt DateTime @default(now()) @map("monthly_reset_at")
}
```

**Files to create:**
- `app/(main)/settings/subscription/page.tsx` - Subscription management
- `app/api/subscriptions/route.ts` - Subscription API
- `lib/db/subscriptions.ts` - Subscription logic

---

### 5.3 Analytics Dashboard ⭐ **CRITICAL**

**What's needed:**
- Track business-critical metrics:
  - **Activation Rate:** % of new users who spend first token within 24h
  - **Conversion Rate:** % who purchase after exhausting free credits
  - **Average Token Spend:** Tokens used per active creator per month
  - **Free vs. Paid Image Ratio:** Manual uploads vs AI-generated
  - **Token Repurchase Rate:** % who buy more than one pack

**Implementation:**
- Create analytics tracking
- Build admin dashboard
- Track token usage events

**Database:**
- Add analytics events table
- Track token transactions

**Files to create:**
- `app/(main)/admin/analytics/page.tsx` - Analytics dashboard
- `app/api/analytics/track/route.ts` - Event tracking
- `lib/db/analytics.ts` - Analytics queries

---

## Implementation Priority

### Week 1 (Critical Path - Viral Loop)
1. ✅ Featured section (done)
2. ✅ Viral footer with 30 credits CTA (done)
3. ✅ Signup page headline (done)
4. ✅ 30 free tokens on signup (already implemented)
5. ⏳ Watermark on first/last images (critical for viral loop)
6. ⏳ Token balance display in editor

### Week 2 (Onboarding & Monetization)
7. ⏳ Welcome email template ("Here are your 30 free AI image credits!")
8. ⏳ Creator personas for seed timelines
9. ✅ Token purchase system (already exists - may need pricing update)
10. ⏳ Onboarding flow focused on first token spend

### Week 3-4 (Creator Tools & Social)
11. ⏳ Creator shareable assets (AI Gallery export)
12. ⏳ Before/After template generator
13. ⏳ Collection pages
14. ⏳ Spotlight system

### Month 2 (Advanced Features)
15. ⏳ Subscription plans (Pro & Educator)
16. ⏳ Analytics dashboard (track activation, conversion, token spend)
17. ⏳ Social media export tools
18. ⏳ "AI Showcase" video generation tools (optional)

---

## Key Metrics to Track

1. **Activation Rate:** New users who spend first token within 24h
2. **Conversion Rate:** Users who purchase after free credits
3. **Average Token Spend:** Per active creator per month
4. **Free vs. Paid Image Ratio:** Manual uploads vs AI-generated
5. **Token Repurchase Rate:** Users who buy multiple packs

---

## Notes

- All seed timelines must use AI-generated images (demonstrates value)
- Watermark only on first/last images (not all)
- Focus messaging on "30 free AI image credits" throughout
- Social media strategy is manual but tools can help with exports

