# Storywall Launch Strategy - Feature Roadmap

This document outlines the features needed to execute the launch strategy, organized by phase and priority.

---

## PHASE 1: Foundational Seeding (Week 1-2)
**Goal:** Create 20-30 high-quality seed stories and make them discoverable

### Priority 1: Core Features (Must Have)

#### 1.1 Featured/Community Picks System ⭐ **CRITICAL**
**Status:** Partially exists (`getFeaturedTimelines` function exists but no UI/admin controls)

**What's needed:**
- Add `isFeatured` boolean field to Timeline model
- Admin UI to mark timelines as "Featured" or "Community Picks"
- Update homepage/discover to show featured section prominently
- Badge/indicator on featured timelines

**Database changes:**
```prisma
model Timeline {
  // ... existing fields
  isFeatured Boolean @default(false) @map("is_featured")
  featuredAt DateTime? @map("featured_at")
}
```

**Files to modify:**
- `prisma/schema.prisma` - Add field
- `lib/db/timelines.ts` - Update queries
- `app/(main)/page.tsx` - Add featured section
- `app/(main)/admin/` - Add admin controls (if admin panel exists)

**Estimated effort:** 1-2 days

---

#### 1.2 Enhanced Creator Bios ⭐ **CRITICAL**
**Status:** Basic creator info exists, but needs enhancement

**What's needed:**
- Add `bio` field to User model (optional text field)
- Display creator bio on timeline pages
- Show "Created by [Name], a [description]" format
- Allow creators to edit their bio in profile settings

**Database changes:**
```prisma
model User {
  // ... existing fields
  bio String? @map("bio") @db.Text
}
```

**Files to modify:**
- `prisma/schema.prisma` - Add bio field
- `app/(main)/story/[id]/page.tsx` - Display bio
- `app/(main)/profile/page.tsx` - Add bio editing
- `app/(main)/settings/page.tsx` - Add bio in settings

**Estimated effort:** 1 day

---

#### 1.3 Collection Pages / Categories ⭐ **HIGH**
**Status:** Categories exist but no collection pages

**What's needed:**
- Create collection pages: "Life Stories", "History Timelines", "Travel Journals", etc.
- Filter timelines by collection/category
- SEO-friendly URLs: `/collections/life-stories`
- Collection landing pages with description and featured timelines

**Files to create:**
- `app/(main)/collections/[slug]/page.tsx` - Collection page
- `app/(main)/collections/page.tsx` - Collections index

**Files to modify:**
- `app/(main)/discover/page.tsx` - Add collection filters
- `lib/db/timelines.ts` - Add collection filtering

**Estimated effort:** 2-3 days

---

### Priority 2: Nice to Have (Can be done in parallel)

#### 1.4 Creator Toolkit / Templates
**What's needed:**
- Template library (pre-built timeline structures)
- Best practices guide (in-app or downloadable)
- Examples gallery
- Style guide (length, image placement tips)

**Estimated effort:** 3-5 days (can be done incrementally)

---

## PHASE 2: Creator-First Seeding (Week 2-4)
**Goal:** Invite creators and incentivize first story creation

### Priority 1: Core Features (Must Have)

#### 2.1 Conditional Free Token System ⭐ **CRITICAL**
**Status:** Credits system exists, but no conditional grants

**What's needed:**
- Grant tokens only when story is published (not just created)
- Track "first story published" status per user
- Admin tool to grant free tokens manually
- Email notification when tokens are granted

**Database changes:**
```prisma
model User {
  // ... existing fields
  firstStoryPublishedAt DateTime? @map("first_story_published_at")
  freeTokensGranted Int @default(0) @map("free_tokens_granted")
}

model TokenGrant {
  id String @id @default(uuid())
  userId String @map("user_id")
  amount Int
  reason String // "first_story", "second_story", "manual", etc.
  grantedAt DateTime @default(now()) @map("granted_at")
  user User @relation(fields: [userId], references: [id])
  
  @@map("token_grants")
}
```

**Files to create:**
- `app/api/credits/grant/route.ts` - Grant tokens API
- `lib/db/token-grants.ts` - Token grant logic

**Files to modify:**
- `app/api/timelines/route.ts` - Check and grant on publish
- `lib/db/users.ts` - Track first story published

**Estimated effort:** 2-3 days

---

#### 2.2 Tiered Incentive System ⭐ **HIGH**
**What's needed:**
- Track story count per user
- Automatic token grants: 30 for 1st, 20 for 2nd, 10 for 3rd
- Email notifications for each milestone
- Dashboard showing progress to next milestone

**Database changes:**
```prisma
model User {
  // ... existing fields
  publishedStoryCount Int @default(0) @map("published_story_count")
}
```

**Files to modify:**
- `app/api/timelines/route.ts` - Increment count and grant tokens
- `app/(main)/profile/page.tsx` - Show milestone progress

**Estimated effort:** 1-2 days

---

#### 2.3 Creator Engagement Tracking ⭐ **HIGH**
**What's needed:**
- Track which creators are most engaged
- Metrics: stories published, views, engagement rate
- Admin dashboard to identify top creators
- Export creator list for outreach

**Database changes:**
- Use existing fields, add computed metrics

**Files to create:**
- `app/api/admin/creators/route.ts` - Creator analytics API
- `app/(main)/admin/creators/page.tsx` - Creator dashboard

**Files to modify:**
- `lib/db/timelines.ts` - Add creator stats queries

**Estimated effort:** 2-3 days

---

### Priority 2: Nice to Have

#### 2.4 Personalized Outreach Tools
**What's needed:**
- Export creator list with contact info
- Template messages for different niches
- Track outreach status

**Estimated effort:** 1-2 days (can be manual initially)

---

## PHASE 3: Strategic Public Seeding (Month 2)
**Goal:** Seed specific niches and create social proof

### Priority 1: Core Features (Must Have)

#### 3.1 Enhanced Social Sharing ⭐ **CRITICAL**
**Status:** Basic sharing exists, needs enhancement

**What's needed:**
- "Created with Storywall" footer on public timelines
- Share links with Storywall branding
- Open Graph meta tags for better social previews
- Shareable preview images

**Files to modify:**
- `components/sharing/ShareMenu.tsx` - Enhance sharing
- `app/(main)/story/[id]/page.tsx` - Add footer
- `app/(main)/story/[id]/layout.tsx` - Add OG tags

**Estimated effort:** 2-3 days

---

#### 3.2 Social Media Integration ⭐ **HIGH**
**What's needed:**
- Generate shareable images (carousel screenshots)
- Export timeline as video (for TikTok)
- Pinterest-optimized images
- Twitter thread format export

**Files to create:**
- `app/api/timelines/[id]/export/route.ts` - Export API
- `lib/utils/social-export.ts` - Export utilities

**Estimated effort:** 3-5 days

---

#### 3.3 Creator Toolkit (Full Version) ⭐ **HIGH**
**What's needed:**
- In-app template library
- Best practices guide
- Style guide
- Examples by niche
- Downloadable resources

**Files to create:**
- `app/(main)/templates/page.tsx` - Template library
- `app/(main)/guides/page.tsx` - Guides
- `lib/data/templates.ts` - Template data

**Estimated effort:** 4-6 days

---

### Priority 2: Nice to Have

#### 3.4 Social Media Calendar Tool
**What's needed:**
- Schedule social posts
- Track which stories have been shared
- Generate content calendar

**Estimated effort:** 3-4 days (can be manual initially)

---

## PHASE 4: Compounding Loop (Month 2+)
**Goal:** Build viral loops and creator community

### Priority 1: Core Features (Must Have)

#### 4.1 Viral Loop: "Created with Storywall" Footer ⭐ **CRITICAL**
**What's needed:**
- Footer on all public timelines
- Clickable link back to Storywall
- Optional: Remove with paid tier
- Track clicks from footer

**Files to modify:**
- `components/timeline/TimelineViewer.tsx` - Add footer
- `app/(main)/story/[id]/page.tsx` - Add footer component

**Estimated effort:** 1 day

---

#### 4.2 Image Watermark System ⭐ **HIGH**
**What's needed:**
- Optional watermark on timeline images
- Removable with tokens or paid tier
- Track watermark removal requests
- A/B test watermark placement

**Files to create:**
- `lib/utils/watermark.ts` - Watermark utilities
- `app/api/timelines/[id]/remove-watermark/route.ts` - Remove watermark API

**Files to modify:**
- `components/timeline/Timeline.tsx` - Add watermark overlay
- Image generation - Add watermark option

**Estimated effort:** 2-3 days

---

#### 4.3 Creator Spotlight System ⭐ **CRITICAL**
**Status:** No spotlight system exists

**What's needed:**
- Weekly creator spotlight
- Weekly story spotlight
- Homepage feature section
- Email newsletter integration
- Creator interview template

**Database changes:**
```prisma
model Spotlight {
  id String @id @default(uuid())
  type String // "creator" or "story"
  targetId String @map("target_id") // User ID or Timeline ID
  title String
  description String? @db.Text
  featuredAt DateTime @default(now()) @map("featured_at")
  expiresAt DateTime? @map("expires_at")
  
  @@map("spotlights")
}
```

**Files to create:**
- `app/(main)/spotlight/page.tsx` - Spotlight page
- `app/api/admin/spotlight/route.ts` - Manage spotlights
- `components/spotlight/SpotlightCard.tsx` - Spotlight component

**Files to modify:**
- `app/(main)/page.tsx` - Add spotlight section
- `lib/db/spotlights.ts` - Spotlight queries

**Estimated effort:** 3-4 days

---

#### 4.4 Creator Leaderboard ⭐ **HIGH**
**What's needed:**
- Public leaderboard page
- Rankings by: stories published, total views, engagement
- Weekly/monthly resets
- Badges for top creators

**Database changes:**
- Use existing data, compute rankings

**Files to create:**
- `app/(main)/leaderboard/page.tsx` - Leaderboard page
- `lib/db/leaderboard.ts` - Leaderboard queries

**Files to modify:**
- `app/(main)/profile/page.tsx` - Show rank

**Estimated effort:** 2-3 days

---

### Priority 2: Nice to Have

#### 4.5 Creator Community Features
**What's needed:**
- Creator forum/discussion
- Creator directory
- Collaboration tools

**Estimated effort:** 5-7 days (can be Phase 5)

---

## PHASE 5: Monetization (Month 2-3)
**Goal:** Turn on payments when users are creating multiple stories

### Priority 1: Core Features (Must Have)

#### 5.1 Freemium Tier Structure ⭐ **CRITICAL**
**Status:** Basic credits exist, need tier structure

**What's needed:**
- Free tier: 5 stories/month, 10 images/month
- Pro tier: Unlimited stories, 100 images/month, £4.99/month
- Creator tier: Unlimited everything, analytics, £9.99/month
- Tier management UI
- Automatic tier enforcement

**Database changes:**
```prisma
model User {
  // ... existing fields
  subscriptionTier String @default("free") @map("subscription_tier") // "free", "pro", "creator"
  subscriptionExpiresAt DateTime? @map("subscription_expires_at")
  monthlyStoryCount Int @default(0) @map("monthly_story_count")
  monthlyImageCount Int @default(0) @map("monthly_image_count")
  monthlyResetAt DateTime @default(now()) @map("monthly_reset_at")
}
```

**Files to create:**
- `lib/db/subscriptions.ts` - Subscription logic
- `app/api/subscriptions/route.ts` - Subscription management
- `app/(main)/settings/subscription/page.tsx` - Subscription page

**Files to modify:**
- `app/api/timelines/route.ts` - Check tier limits
- `app/api/ai/generate-images/route.ts` - Check tier limits
- `lib/db/users.ts` - Track monthly usage

**Estimated effort:** 4-5 days

---

#### 5.2 Creator Analytics ⭐ **HIGH**
**What's needed:**
- Views per timeline
- Engagement metrics
- Traffic sources
- Audience demographics (if available)
- Export analytics

**Files to create:**
- `app/(main)/analytics/page.tsx` - Analytics dashboard
- `app/api/analytics/route.ts` - Analytics API
- `lib/db/analytics.ts` - Analytics queries

**Files to modify:**
- `app/(main)/story/[id]/page.tsx` - Track views
- `lib/db/timelines.ts` - Add analytics tracking

**Estimated effort:** 3-4 days

---

#### 5.3 Custom Branding (Creator Tier) ⭐ **MEDIUM**
**What's needed:**
- Remove "Created with Storywall" footer
- Custom domain support
- Custom colors/themes
- White-label option

**Estimated effort:** 4-6 days (can be Phase 6)

---

### Priority 2: Nice to Have

#### 5.4 Batch Image Generation
**What's needed:**
- Generate multiple images at once
- Queue system
- Progress tracking

**Estimated effort:** 3-4 days

---

#### 5.5 AI-Powered Story Suggestions
**What's needed:**
- Suggest story ideas based on user interests
- Auto-complete story descriptions
- Suggest related events

**Estimated effort:** 5-7 days

---

## Analytics & Tracking (Ongoing)

### Metrics Dashboard ⭐ **CRITICAL**
**What's needed:**
- Weekly metrics: Stories published, Images generated, % users creating stories
- Repeat creator rate
- Story completion rate
- Creator retention rate
- Time to first story
- Creator satisfaction (NPS)

**Files to create:**
- `app/(main)/admin/analytics/page.tsx` - Admin analytics
- `lib/db/metrics.ts` - Metrics calculations

**Estimated effort:** 3-4 days

---

## Implementation Order (Recommended)

### Sprint 1 (Week 1): Foundation
1. Featured/Community Picks System (1.1)
2. Enhanced Creator Bios (1.2)
3. Collection Pages (1.3)

### Sprint 2 (Week 2): Creator Incentives
4. Conditional Free Token System (2.1)
5. Tiered Incentive System (2.2)
6. Creator Engagement Tracking (2.3)

### Sprint 3 (Week 3-4): Social & Sharing
7. Enhanced Social Sharing (3.1)
8. "Created with Storywall" Footer (4.1)
9. Creator Spotlight System (4.3)

### Sprint 4 (Month 2): Community
10. Creator Leaderboard (4.4)
11. Creator Toolkit (3.3)
12. Social Media Integration (3.2)

### Sprint 5 (Month 2-3): Monetization
13. Freemium Tier Structure (5.1)
14. Creator Analytics (5.2)
15. Metrics Dashboard

### Sprint 6 (Month 3+): Advanced
16. Image Watermark System (4.2)
17. Batch Image Generation (5.4)
18. AI-Powered Story Suggestions (5.5)

---

## Quick Wins (Can be done immediately)

1. **Add "Created with Storywall" footer** - 1 day
2. **Featured section on homepage** - 1 day
3. **Creator bio field** - 1 day
4. **Basic leaderboard** - 2 days
5. **Token grant on first story** - 1 day

These 5 features can be done in ~1 week and will immediately support the launch strategy.

---

## Notes

- **Database migrations:** Each feature that requires schema changes needs a Prisma migration
- **Admin panel:** Consider building a simple admin panel if one doesn't exist
- **Email system:** Need email notifications for token grants, spotlights, etc.
- **Analytics:** Consider adding analytics tracking early (PostHog, Mixpanel, or custom)

---

## Questions to Answer

1. Does an admin panel exist? If not, should we build one?
2. What email service are we using? (SendGrid, Resend, etc.)
3. Do we have analytics tracking set up? (PostHog, Mixpanel, etc.)
4. What's the current Stripe integration status for subscriptions?

