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

After adding variables, Railway will automatically redeploy your application.

## Security Notes

⚠️ **Never commit `.env.local` or any file containing real API keys to git!**

- `.env.local` is already in `.gitignore`
- Use `.env.example` for documentation only (with placeholder values)
- Always use Railway's environment variables for production

