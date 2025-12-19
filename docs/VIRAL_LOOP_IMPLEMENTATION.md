# Viral Loop Implementation Guide

This document details the technical implementation of the viral loop mechanics from the Viral Loop & Social Media Guide.

---

## 1. Watermark Implementation

### Requirements
- **Location:** Bottom-right corner of first and last images only
- **Text:** "Created with AI on **Storywall.com**" (Storywall.com is bold/linked)
- **Style:** Subtle, semi-transparent (opacity: 0.7-0.8)
- **Context:** Only on public/shared timelines
- **Purpose:** Attribute quality to AI, provide direct CTA

### Technical Implementation

**Component Structure:**
```tsx
<ImageWithWatermark 
  src={imageUrl}
  isFirstOrLast={isFirst || isLast}
  timelineIsPublic={timeline.is_public}
/>
```

**Styling:**
- Position: `absolute bottom-4 right-4`
- Background: Semi-transparent overlay (rgba(0,0,0,0.6) or white with opacity)
- Text: White or dark text depending on image
- Font: Small (text-xs or text-sm)
- Padding: px-2 py-1
- Border radius: rounded

**Files to Create:**
- `components/timeline/ImageWithWatermark.tsx`
- `lib/utils/watermark.ts` (utility functions)

**Files to Modify:**
- `app/(main)/timeline/[id]/page.tsx` - Detect first/last images, apply watermark
- `app/(main)/story/[id]/page.tsx` - Detect if story is first/last in sequence
- `components/timeline/Timeline.tsx` - Pass first/last flags to image components

---

## 2. Call-to-Action Implementation

### Timeline Page CTA

**Location:** Below timeline content (after comments section)

**Button:**
- Text: "Create Your Own Timeline & Get 30 Free AI Image Credits"
- Link: `/sign-up`
- Style: Prominent, primary button
- Position: Above viral footer or integrated into footer

**Status:** ✅ Already implemented in `ViralFooter.tsx`

### Signup Page

**Headline:** "Welcome to Storywall! Your 30 free AI image credits are ready."

**Status:** ✅ Already implemented in `app/(auth)/sign-up/[[...sign-up]]/page.tsx`

### Welcome Email

**Subject:** "Here are your 30 free AI image credits!"

**Content:**
- Welcome message
- Explain token system (1 token = 1 AI image)
- Direct link to create first timeline
- Guide to Step 5 (Generate Images) where they use credits

**Implementation:**
- Create email template
- Send on user creation (via webhook or after signup)
- Use email service (Resend, SendGrid, etc.)

**Files to Create:**
- `lib/emails/welcome.tsx` - Welcome email template
- `app/api/webhooks/clerk/route.ts` - Clerk webhook handler (if using Clerk webhooks)
- Or trigger from `getOrCreateUser` function

---

## 3. Social Media Content Tools

### AI Gallery Export

**Purpose:** Single high-resolution collage of all AI-generated images

**Requirements:**
- Include all AI-generated images from timeline
- Add Storywall logo (bottom-right or top-left)
- Add creator username
- High resolution (suitable for print/blog)
- Downloadable as PNG/JPG

**Implementation:**
- Server-side image manipulation (use `sharp` or `canvas`)
- Detect AI-generated images (check for `image_prompt` field)
- Create grid layout (e.g., 3x3, 4x4, or dynamic based on count)
- Overlay logo and username
- Return as downloadable file

**API Endpoint:**
```
GET /api/timelines/[id]/export/gallery
```

**Response:** Image file (PNG/JPG)

**Files to Create:**
- `app/api/timelines/[id]/export/gallery/route.ts`
- `lib/utils/image-collage.ts` - Collage generation

**Dependencies:**
- `sharp` (recommended) or `canvas` for image manipulation
- Logo file in `public/` directory

---

### Before & After Template

**Purpose:** Social media template showing text vs AI image

**Requirements:**
- Left side: Event description text (plain text, no image)
- Right side: AI-generated image
- Clean, shareable format
- Downloadable as PNG/JPG

**Implementation:**
- Server-side image generation
- Create side-by-side layout
- Left: Text on background (styled)
- Right: AI-generated image
- Export as single image

**API Endpoint:**
```
GET /api/timelines/[id]/export/before-after?eventId=[id]
```

**Response:** Image file (PNG/JPG)

**Files to Create:**
- `app/api/timelines/[id]/export/before-after/route.ts`
- `lib/utils/before-after-template.ts` - Template generator

**UI Integration:**
- Add "Export" button on timeline page (for creators)
- Show in share menu or timeline actions

---

## 4. Social Media Post CTAs

### Twitter/X Thread CTA

**Format:**
"This was made with our AI image generator. You get 30 free image credits to try it yourself. Link in bio!"

**Implementation:**
- Manual content (not code)
- But can create template generator tool

### Instagram Carousel CTA

**Format:**
"Want to create visuals like this in minutes? Get 30 free AI image credits when you sign up for Storywall."

**Implementation:**
- Manual content
- Can create caption templates

### TikTok/Reels CTA

**Format:**
On-screen text: "Get 30 Free AI Images on Storywall.com"

**Implementation:**
- Manual video creation
- Can create video templates or screen recording guides

---

## 5. Implementation Checklist

### Phase 1: Core Viral Loop (Week 1)
- [ ] Watermark component (`ImageWithWatermark.tsx`)
- [ ] Apply watermark to first/last images on timeline pages
- [ ] Apply watermark to first/last images on story pages
- [ ] Test watermark visibility and clickability

### Phase 2: Onboarding (Week 2)
- [ ] Welcome email template
- [ ] Email sending integration (webhook or direct)
- [ ] Test email delivery
- [ ] Verify 30 tokens granted on signup

### Phase 3: Creator Tools (Week 3-4)
- [ ] AI Gallery export endpoint
- [ ] Before/After template generator
- [ ] Export UI (buttons/menu)
- [ ] Test image generation and downloads

### Phase 4: Social Integration (Month 2)
- [ ] Social media caption templates (documentation)
- [ ] Video creation guides (documentation)
- [ ] Analytics tracking for viral loop effectiveness

---

## 6. Technical Notes

### Watermark Detection Logic

```typescript
// In timeline page
const events = timeline.events || [];
const firstEvent = events[0];
const lastEvent = events[events.length - 1];

// In story page
const currentEventIndex = allEvents.findIndex(e => e.id === event.id);
const isFirst = currentEventIndex === 0;
const isLast = currentEventIndex === allEvents.length - 1;
```

### Image Collage Algorithm

1. Fetch all events with AI-generated images (have `image_prompt`)
2. Download images
3. Calculate grid layout (e.g., Math.ceil(Math.sqrt(count)))
4. Resize images to fit grid cells
5. Create canvas and composite images
6. Add logo overlay
7. Add username text
8. Export as PNG/JPG

### Before/After Template Algorithm

1. Fetch event with description and AI image
2. Create canvas with 2 columns
3. Left column: Render text description (styled)
4. Right column: Render AI image
5. Add "Before" and "After" labels
6. Export as PNG/JPG

---

## 7. Dependencies

**Required Packages:**
- `sharp` - Image manipulation (recommended)
  - Or `canvas` - Alternative image manipulation
- Email service (Resend, SendGrid, etc.)

**Install:**
```bash
npm install sharp
# or
npm install canvas
```

---

## 8. Testing

### Watermark Testing
- [ ] Watermark appears on first image only
- [ ] Watermark appears on last image only
- [ ] Watermark does NOT appear on middle images
- [ ] Watermark is clickable (Storywall.com link)
- [ ] Watermark is visible on light and dark images
- [ ] Watermark only shows on public timelines

### Export Testing
- [ ] AI Gallery includes all AI-generated images
- [ ] AI Gallery excludes manual uploads
- [ ] Logo and username appear correctly
- [ ] Before/After template generates correctly
- [ ] Downloads work on mobile and desktop
- [ ] Images are high resolution

### Email Testing
- [ ] Welcome email sends on signup
- [ ] Email subject is correct
- [ ] Email content mentions 30 free credits
- [ ] Links in email work correctly

