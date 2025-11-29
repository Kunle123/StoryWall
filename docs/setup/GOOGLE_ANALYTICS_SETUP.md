# Google Analytics Setup Guide

This guide walks you through setting up Google Analytics for StoryWall to track visitors and user behavior.

## Quick Start

1. **Get your Measurement ID** from Google Analytics (see steps below)
2. **Add to environment variables**:
   ```env
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```
3. **Deploy** - Analytics will automatically start tracking

## Detailed Setup

### Step 1: Create Google Analytics Account

1. Visit [Google Analytics](https://analytics.google.com/)
2. Sign in with your Google account
3. Click **"Start measuring"** or go to **Admin** → **Create Account**

### Step 2: Create Property

1. **Account name**: `StoryWall` (or your company name)
2. **Property name**: `StoryWall Web`
3. **Reporting time zone**: Select your timezone
4. **Currency**: Select your currency (e.g., USD)
5. Click **"Next"** → **"Create"**

### Step 3: Set Up Data Stream

1. After creating the property, you'll see **"Data Streams"**
2. Click **"Add stream"** → **"Web"**
3. Enter:
   - **Website URL**: `https://www.storywall.com` (your production domain)
   - **Stream name**: `StoryWall Web`
4. Click **"Create stream"**
5. **Copy your Measurement ID** (format: `G-XXXXXXXXXX`)

### Step 4: Add to Environment Variables

#### Local Development

Add to `.env.local`:
```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

#### Railway Production

1. Go to Railway → Your Project → Your Service
2. Click **Variables** tab
3. Click **+ New Variable**
4. Enter:
   - **Name**: `NEXT_PUBLIC_GA_MEASUREMENT_ID`
   - **Value**: `G-XXXXXXXXXX` (your Measurement ID)
5. Click **Add**
6. Railway will automatically redeploy

### Step 5: Verify Installation

1. **Wait for deployment** (if on Railway)
2. **Visit your website**
3. **Open browser DevTools** (F12)
4. **Go to Network tab**
5. **Filter by**: `google-analytics` or `gtag`
6. **You should see requests** to Google Analytics servers
7. **In Google Analytics**:
   - Go to **Reports** → **Realtime**
   - You should see yourself as a visitor

## What Gets Tracked Automatically

### Page Views
- All page navigations are tracked automatically
- Includes timeline pages, editor, settings, etc.

### Custom Events

The following events are tracked:

| Event Name | When It Fires | Parameters |
|------------|---------------|------------|
| `sign_up` | User signs up | `method` (email/google/github) |
| `timeline_created` | User creates a timeline | `timeline_id`, `event_count`, `has_image` |
| `timeline_viewed` | User views a timeline | `timeline_id` |
| `tweet_posted` | User posts to Twitter | `has_image`, `has_hashtags` |
| `purchase` | User buys credits | `value`, `currency`, `credits` |
| `ai_generation` | User generates content | `type` (events/descriptions/images), `count` |
| `image_uploaded` | User uploads image | `source` (user/ai), `size_bytes` |
| `search` | User searches | `search_term`, `result_count` |

## Using Analytics in Your Code

### Basic Event Tracking

```typescript
import { trackEvent } from '@/lib/analytics';

// Track a custom event
trackEvent('button_clicked', {
  button_name: 'create_timeline',
  location: 'homepage',
});
```

### Pre-built Tracking Functions

```typescript
import {
  trackSignUp,
  trackTimelineCreated,
  trackTweetPosted,
  trackCreditPurchase,
  trackAIGeneration,
} from '@/lib/analytics';

// Track user sign-up
trackSignUp('google'); // or 'email', 'github'

// Track timeline creation
trackTimelineCreated('timeline-123', 10, true);

// Track tweet
trackTweetPosted(true, true); // has image, has hashtags

// Track purchase
trackCreditPurchase(9.99, 1000, 'USD');

// Track AI generation
trackAIGeneration('events', 5);
```

### Page View Tracking (Custom)

```typescript
import { trackPageView } from '@/lib/analytics';

// Track a custom page view
trackPageView('/custom-page', 'Custom Page Title');
```

## Viewing Analytics Data

### Real-time Reports

1. Go to Google Analytics dashboard
2. Click **Reports** → **Realtime**
3. See:
   - Active users right now
   - Top pages being viewed
   - Events happening in real-time

### Standard Reports

1. **Reports** → **Engagement** → **Events**
   - See all custom events
   - Filter by event name
   - See event counts and parameters

2. **Reports** → **Acquisition** → **Traffic acquisition**
   - See where users come from
   - Organic search, direct, social, etc.

3. **Reports** → **Engagement** → **Pages and screens**
   - See most viewed pages
   - Average time on page
   - Bounce rate

## Privacy & Compliance

### GDPR Compliance

Google Analytics is configured to:
- ✅ Respect user privacy preferences
- ✅ Anonymize IP addresses (if configured in GA dashboard)
- ✅ Comply with cookie consent (if you implement cookie banner)

### Cookie Policy

Make sure your Cookie Policy mentions Google Analytics:
- See `app/(main)/legal/cookies/page.tsx` - already includes analytics cookies section

### Disabling Analytics

If you need to disable analytics:
1. Remove `NEXT_PUBLIC_GA_MEASUREMENT_ID` from environment variables
2. Analytics will not load (no errors, just silently disabled)

## Troubleshooting

### Analytics Not Working

1. **Check environment variable**:
   - Make sure `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set
   - Must start with `G-`
   - No quotes or spaces

2. **Check browser console**:
   - Open DevTools → Console
   - Look for errors related to `gtag` or `google-analytics`

3. **Check Network tab**:
   - Filter by `google-analytics`
   - Should see requests to `www.google-analytics.com`

4. **Check Google Analytics dashboard**:
   - Go to **Admin** → **Data Streams**
   - Verify your Measurement ID matches

### Events Not Showing

1. **Wait 24-48 hours** for events to appear in standard reports
2. **Check Realtime reports** for immediate verification
3. **Verify event names** match what you're tracking
4. **Check browser console** for tracking errors

## Best Practices

1. **Don't track PII** (Personally Identifiable Information)
   - Don't include emails, names, or user IDs in event parameters
   - Use anonymous IDs or hashed values

2. **Use consistent event names**
   - Use snake_case: `timeline_created` not `timelineCreated`
   - Be descriptive: `button_clicked` not `click`

3. **Track meaningful events**
   - Focus on business metrics: sign-ups, purchases, content creation
   - Don't track every single click (too noisy)

4. **Review regularly**
   - Check analytics weekly/monthly
   - Identify trends and user behavior
   - Use insights to improve the product

## Next Steps

- Set up **conversion goals** in Google Analytics
- Create **custom dashboards** for key metrics
- Set up **alerts** for unusual traffic patterns
- Consider **Google Tag Manager** for more advanced tracking

