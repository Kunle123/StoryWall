# Twitter API Setup for Automated Thread Posting

This guide explains how to set up Twitter API integration to enable automated thread posting.

## Prerequisites

1. **Twitter Developer Account**
   - Go to [https://developer.twitter.com](https://developer.twitter.com)
   - Sign up for a developer account (free tier available)
   - Complete the application process

2. **Create a Twitter App**
   - Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
   - Click "Create App" or "Create Project"
   - Fill in app details:
     - App name: `StoryWall` (or your app name)
     - App description: Timeline sharing application
     - Website URL: `https://www.storywall.com` (or your domain)
     - Callback URL: `https://www.storywall.com/api/twitter/callback` (or your domain)

3. **Configure OAuth 2.0 Settings**
   - In your app settings, go to "User authentication settings"
   - Enable OAuth 2.0
   - Set App permissions to "Read and write" (this includes media upload permissions)
   - Set Type of App to "Web App"
   - Add callback URLs:
     - `https://www.storywall.com/api/twitter/callback`
     - `http://localhost:3000/api/twitter/callback` (for development)
   - Set Website URL: `https://www.storywall.com`
   
   **Note:** The app requests the following OAuth 2.0 scopes:
   - `tweet.read` - Read tweets
   - `tweet.write` - Post tweets
   - `users.read` - Read user information
   - `offline.access` - Refresh tokens
   - `media.write` - Upload media (images) for tweets

4. **Get Your API Keys**
   - In your app settings, go to "Keys and tokens"
   - Copy:
     - **Client ID** (OAuth 2.0 Client ID)
     - **Client Secret** (OAuth 2.0 Client Secret)
     - **API Key** (OAuth 1.0a Consumer Key) - Required for media uploads
     - **API Secret** (OAuth 1.0a Consumer Secret) - Required for media uploads
   
   **Note:** OAuth 1.0a credentials are required for image uploads. Twitter's v1.1 media upload endpoint requires OAuth 1.0a authentication, not OAuth 2.0.

## Environment Variables

Add these to your `.env.local` (development) and Railway (production):

```bash
# Twitter API OAuth 2.0 (for posting tweets)
TWITTER_CLIENT_ID=your_client_id_here
TWITTER_CLIENT_SECRET=your_client_secret_here
TWITTER_REDIRECT_URI=https://www.storywall.com/api/twitter/callback

# Twitter API OAuth 1.0a (required for media uploads)
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_secret_here
```

For local development:
```bash
TWITTER_REDIRECT_URI=http://localhost:3000/api/twitter/callback
```

## Database Migration

After adding the Twitter token fields to the User model, run:

```bash
npx prisma migrate dev --name add_twitter_tokens
```

Or manually add the columns to your database:

```sql
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "twitter_access_token" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "twitter_refresh_token" TEXT;
```

## How It Works

1. **User connects Twitter**: Click "Connect Twitter" button in the Twitter Thread Dialog
2. **OAuth flow**: User is redirected to Twitter to authorize the app
3. **Token storage**: Access token is stored securely in the database
4. **Automated posting**: When user clicks "Post Thread", the app automatically:
   - Posts the first tweet
   - Waits 1 second
   - Replies to the first tweet with the second tweet
   - Continues until all tweets are posted

## Rate Limits

Twitter API v2 has rate limits:
- **Tweet creation**: 300 tweets per 15 minutes per user
- **OAuth requests**: Varies by endpoint

The implementation includes a 1-second delay between tweets to avoid hitting rate limits.

## Security Notes

- Access tokens are stored encrypted in the database
- Tokens are user-specific and never shared
- Users can revoke access at any time via Twitter settings
- OAuth 2.0 flow uses PKCE for additional security

## Troubleshooting

**"Twitter not connected" error:**
- Make sure you've completed the OAuth flow
- Check that tokens are stored in the database
- Verify environment variables are set correctly

**"Failed to post tweet" error:**
- Check Twitter API status
- Verify your app has "Read and write" permissions
- Check rate limits haven't been exceeded
- Ensure access token hasn't expired (implement refresh token logic)

**"Image not attaching to tweet" or 403 Forbidden on media upload:**
- This usually means your access token doesn't have the `media.write` scope
- **Solution:** Disconnect and reconnect your Twitter account to grant the new permissions
- The app now requests `media.write` scope, but users who connected before this was added need to reconnect
- Go to the timeline share dialog and click "Reconnect" or "Connect Twitter Account"

**OAuth callback not working:**
- Verify callback URL matches exactly in Twitter app settings
- Check that redirect URI environment variable is correct
- Ensure HTTPS is used in production

