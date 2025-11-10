# Image Source APIs Setup

This document explains how to set up additional image sources to supplement Wikimedia Commons.

## Current Sources

1. **GPT-4o** (Primary) - Uses OpenAI to find direct image URLs
2. **Unsplash** (Supplement) - High-quality free stock photos
3. **Pexels** (Supplement) - High-quality free stock photos  
4. **Wikimedia Commons** (Fallback) - Public domain images (can have 403 errors)

## Setup Instructions

### Unsplash API

1. Go to [Unsplash Developers](https://unsplash.com/developers)
2. Create a free account
3. Create a new application
4. Copy your Access Key
5. Add to `.env.local`:
   ```bash
   UNSPLASH_ACCESS_KEY=your_access_key_here
   ```

**Free Tier:**
- 50 requests per hour
- Unlimited requests per month (with rate limiting)
- Perfect for supplementing Wikimedia

### Pexels API

1. Go to [Pexels API](https://www.pexels.com/api/)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Add to `.env.local`:
   ```bash
   PEXELS_API_KEY=your_api_key_here
   ```

**Free Tier:**
- 200 requests per hour
- 20,000 requests per month
- High-quality photos

## Search Order

When searching for reference images, the system tries sources in this order:

1. **GPT-4o** - Finds direct URLs from various sources (most accurate)
2. **Wikimedia Commons** - Best for celebrities, public figures, politicians (official/press photos)
3. **Pexels** - Has some celebrity photos, good for famous people
4. **Unsplash** - Primarily stock photos, better for generic portraits (not great for specific celebrities)

**Why this order?**
- **Wikimedia** is prioritized for celebrities/public figures because it has:
  - Official government photos
  - Press photos from news agencies
  - Best coverage of famous people
  - Public domain images
  
- **Pexels** has some celebrity content but less comprehensive than Wikimedia

- **Unsplash** is primarily stock photography, not ideal for specific celebrities

This ensures:
- Best coverage for famous people (Wikimedia)
- Multiple fallbacks for reliability
- Wikimedia prioritized for celebrity/public figure searches

## Notes

- Both Unsplash and Pexels are optional - the system works without them
- If API keys are not configured, the system will skip those sources
- Wikimedia remains as a fallback for maximum coverage
