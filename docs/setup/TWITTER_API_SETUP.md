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
   - **CRITICAL:** Set App permissions to **"Read and write"** (this includes media upload permissions)
     - ⚠️ **Important:** If you change permissions after users have already authorized, they must revoke and re-authorize to get tokens with the new permissions. See [X Developer docs](https://docs.x.com/fundamentals/developer-apps#app-permissions)
   - **IMPORTANT:** Scroll down and click **"Save"** button
   - Set Type of App to "Web App"
   - Add callback URLs:
     - `https://www.storywall.com/api/twitter/callback`
     - `http://localhost:3000/api/twitter/callback` (for development)
   - Set Website URL: `https://www.storywall.com`
   - **Click "Save" again** after adding callback URLs

   **Note:** The app requests the following OAuth 2.0 scopes:
   - `tweet.read` - Read tweets
   - `tweet.write` - Post tweets
   - `users.read` - Read user information
   - `offline.access` - Refresh tokens
   - `media.write` - Upload media (images) for tweets

4. **Configure OAuth 1.0a Settings (Required for Image Uploads)**
   - In your app settings, go to "User authentication settings"
   - **Scroll down to find the OAuth 1.0a section** (separate from OAuth 2.0)
   - Enable OAuth 1.0a (you can have both OAuth 2.0 and OAuth 1.0a enabled)
   - **CRITICAL:** Set App permissions to **"Read and write"** in the OAuth 1.0a section
     - ⚠️ **IMPORTANT:** OAuth 2.0 and OAuth 1.0a have SEPARATE permission settings
     - ⚠️ **IMPORTANT:** You must set "Read and write" in BOTH sections
   - **IMPORTANT:** Scroll down and click **"Save"** button (separate from OAuth 2.0 save)
   - Add callback URLs:
     - `https://www.storywall.com/api/twitter/oauth1/callback`
     - `http://localhost:3000/api/twitter/oauth1/callback` (for development)
   - **Click "Save" again** after adding callback URLs
   
   **⚠️ CRITICAL:** If permissions revert to "Read only" after refreshing, see [TWITTER_PERMISSIONS_NOT_SAVING.md](../debugging/TWITTER_PERMISSIONS_NOT_SAVING.md)
   
   **Why OAuth 1.0a is required:** Twitter's v1.1 media upload endpoint (`upload.twitter.com/1.1/media/upload.json`) requires OAuth 1.0a authentication. OAuth 2.0 cannot be used for media uploads.

5. **Get Your API Keys**
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

**"Image not attaching to tweet" or "Bad Authentication data" (code 215) on media upload:**
- This indicates your OAuth 1.0a tokens don't have "Read and write" permissions
- **Root Cause:** According to [X Developer documentation](https://docs.x.com/fundamentals/developer-apps#app-permissions), if app permissions are changed, existing user tokens must be discarded and users must re-authorize to inherit the updated permissions
- **Solution (Step-by-Step):**
  1. **Verify App Permissions:**
     - Go to [Twitter Developer Portal](https://developer.x.com/en/portal/projects-and-apps)
     - Open your app settings
     - Go to "User authentication settings"
     - Ensure "App permissions" is set to **"Read and write"** (not "Read only")
     - Save changes if you modified permissions
  
  2. **Revoke App Access (Required):**
     - Go to [Twitter Settings → Apps and sessions](https://twitter.com/settings/apps)
     - Find "StoryWall" (or your app name)
     - Click **"Revoke access"** or **"Remove app"**
     - This discards the old tokens with incorrect permissions
  
  3. **Reconnect in StoryWall:**
     - Go to the timeline share dialog
     - Click **"Connect Twitter Account"**
     - Authorize the app again
     - This will issue new tokens with "Read and write" permissions
  
  **Why this works:** Regenerating tokens in the Developer Portal only updates app-level tokens, not user-specific OAuth tokens. Revoking app access forces Twitter to issue completely new user tokens with the current app permissions.

**OAuth callback not working:**
- Verify callback URL matches exactly in Twitter app settings
- Check that redirect URI environment variable is correct
- Ensure HTTPS is used in production

