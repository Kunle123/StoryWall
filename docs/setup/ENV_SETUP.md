# Environment Variables Setup

This document explains how to set up environment variables for the StoryWall application.

## Local Development

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your actual API keys and credentials.

3. The `.env.local` file is gitignored and won't be committed to the repository.

## Required Environment Variables

### Database
- `DATABASE_URL` - PostgreSQL connection string
  - Format: `postgresql://user:password@host:port/database?schema=public`
  - For Railway: Available in your Railway project dashboard

### Authentication (Clerk)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Your Clerk publishable key
- `CLERK_SECRET_KEY` - Your Clerk secret key
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`

**Note:** Redirect URLs are configured in components using `fallbackRedirectUrl` prop, so `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` and `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` are not needed.

### Image Upload (Cloudinary)
- `CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Your Cloudinary API key
- `CLOUDINARY_API_SECRET` - Your Cloudinary API secret

### AI Features

**OpenAI (for text generation):**
- `OPENAI_API_KEY` - Your OpenAI API key
  - Get from: https://platform.openai.com/api-keys
  - Used for:
    - Generating timeline events (`/api/ai/generate-events`)
    - Generating event descriptions (`/api/ai/generate-descriptions`)

**Flux (for image generation):**
- `REPLICATE_API_TOKEN` - Your Replicate API token
  - Get from: https://replicate.com/account/api-tokens
  - Create account at: https://replicate.com
  - Used for:
    - Generating images (`/api/ai/generate-images` using Flux via Replicate)
  - Pricing: ~$0.001 per image (much cheaper than DALL-E 3)
  - Better quality and more flexible for historical content

### Analytics (Google Analytics)
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` - Your Google Analytics Measurement ID
  - Get from: https://analytics.google.com/
  - Format: `G-XXXXXXXXXX` (for GA4)
  - Used for:
    - Tracking page views
    - Tracking user interactions (sign-ups, timeline creation, etc.)
    - Monitoring user behavior and conversion events
  - **Optional**: If not set, Google Analytics will be disabled (no errors)
  - See [Google Analytics Setup Guide](#google-analytics-setup) below for detailed instructions

## Railway Deployment

To add environment variables in Railway:

1. Go to your Railway project dashboard
2. Click on your service (e.g., "web")
3. Go to the **Variables** tab
4. Add each environment variable:
   - Click **+ New Variable**
   - Enter the variable name (e.g., `OPENAI_API_KEY`)
   - Enter the value
   - Click **Add**

### Important Variables for Railway:
- `DATABASE_URL` - Automatically set by Railway when you add a PostgreSQL database
- `OPENAI_API_KEY` - Add manually with your OpenAI API key (for text generation)
- `REPLICATE_API_TOKEN` - Add manually with your Replicate API token (for image generation)
- `CLOUDINARY_*` - Add manually with your Cloudinary credentials
- `CLERK_*` - Add manually with your Clerk credentials
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` - Add manually with your Google Analytics Measurement ID (optional)

After adding variables, Railway will automatically redeploy your application.

## Google Analytics Setup

### Step 1: Create a Google Analytics Account

1. Go to [Google Analytics](https://analytics.google.com/)
2. Sign in with your Google account
3. Click **"Start measuring"** or **"Admin"** → **"Create Account"**
4. Fill in your account details:
   - Account name: `StoryWall` (or your preferred name)
   - Click **"Next"**

### Step 2: Create a Property

1. Property name: `StoryWall` (or your preferred name)
2. Select your reporting time zone
3. Select your currency
4. Click **"Next"**

### Step 3: Configure Business Information

1. Select your industry category
2. Select your business size
3. Select how you intend to use Google Analytics
4. Click **"Create"**
5. Accept the Terms of Service

### Step 4: Get Your Measurement ID

1. After creating the property, you'll see a **"Data Streams"** section
2. Click **"Add stream"** → **"Web"**
3. Enter your website details:
   - Website URL: `https://www.storywall.com` (or your domain)
   - Stream name: `StoryWall Web`
4. Click **"Create stream"**
5. Copy your **Measurement ID** (format: `G-XXXXXXXXXX`)

### Step 5: Add to Environment Variables

#### Local Development (`.env.local`)

Add this line:
```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Replace `G-XXXXXXXXXX` with your actual Measurement ID.

#### Railway Production

1. Go to your Railway project dashboard
2. Click on your service (e.g., "web")
3. Go to the **Variables** tab
4. Click **+ New Variable**
5. Enter:
   - Name: `NEXT_PUBLIC_GA_MEASUREMENT_ID`
   - Value: `G-XXXXXXXXXX` (your Measurement ID)
6. Click **Add**

### Step 6: Verify Setup

1. Deploy your application (Railway will auto-deploy after adding the variable)
2. Visit your website
3. Open browser DevTools → Network tab
4. Filter by "google-analytics" or "gtag"
5. You should see requests to `www.google-analytics.com` or `www.googletagmanager.com`
6. In Google Analytics dashboard, go to **Reports** → **Realtime** to see live visitors

### What Gets Tracked

The following events are automatically tracked:
- **Page views** - All page navigations
- **Sign-ups** - User registrations (with method: email/google/github)
- **Timeline creation** - When users create new timelines
- **Timeline views** - When users view timelines
- **Tweet posts** - When users post to Twitter
- **Credit purchases** - When users buy credits
- **AI generations** - When users generate events/descriptions/images
- **Image uploads** - When users upload images
- **Searches** - When users search for content

### Custom Event Tracking

You can track custom events in your code using the analytics utility:

```typescript
import { trackEvent } from '@/lib/analytics';

// Track a custom event
trackEvent('custom_action', {
  category: 'engagement',
  value: 100,
});
```

See `lib/analytics.ts` for all available tracking functions.

## Security Notes

⚠️ **Never commit `.env.local` or any file containing real API keys to git!**

- `.env.local` is already in `.gitignore`
- Use `.env.example` for documentation only (with placeholder values)
- Always use Railway's environment variables for production

