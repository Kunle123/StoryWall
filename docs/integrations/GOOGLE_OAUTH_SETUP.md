# Google OAuth Setup for Clerk Social Login

This guide walks you through creating Google OAuth credentials for Clerk authentication.

## Step 1: Go to Google Cloud Console

1. Visit [https://console.cloud.google.com](https://console.cloud.google.com)
2. Sign in with your Google account

## Step 2: Create or Select a Project

1. In the top bar, click the **project dropdown** (shows current project name)
2. Click **"New Project"** (or select an existing project if you have one)
3. Enter project name: **"StoryWall"** (or your preferred name)
4. Click **"Create"**
5. Wait for the project to be created, then select it from the dropdown

## Step 3: Enable Google+ API

1. In the left sidebar, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"** or **"People API"**
3. Click on **"Google+ API"** (or **"People API"**)
4. Click **"Enable"**
5. Wait for it to enable (may take a few seconds)

**Note:** You might also need **"Google Identity"** API enabled. If prompted, enable that too.

## Step 4: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** (unless you have a Google Workspace account, then you can use "Internal")
3. Click **"Create"**

### Fill in the OAuth Consent Screen:

- **App name:** `StoryWall` (or your app name)
- **User support email:** Your email address
- **App logo:** (Optional - you can skip this)
- **Application home page:** `https://storywall.com` (or your domain)
- **Application privacy policy link:** (Optional - you can add later)
- **Application terms of service link:** (Optional - you can add later)
- **Authorized domains:** Add `storywall.com` (or your domain)
- **Developer contact information:** Your email address

4. Click **"Save and Continue"**

### Scopes (Step 2):
- Click **"Add or Remove Scopes"**
- Select these scopes:
  - `.../auth/userinfo.email`
  - `.../auth/userinfo.profile`
  - `openid`
- Click **"Update"**
- Click **"Save and Continue"**

### Test Users (Step 3):
- If your app is in "Testing" mode, add test users (your email)
- Click **"Save and Continue"**

### Summary (Step 4):
- Review and click **"Back to Dashboard"**

## Step 5: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ Create Credentials"** at the top
3. Select **"OAuth client ID"**

### Configure OAuth Client:

1. **Application type:** Select **"Web application"**

2. **Name:** Enter `StoryWall Web Client` (or any name you prefer)

3. **Authorized JavaScript origins:**
   Add these URLs (click **"+ Add URI"** for each):
   ```
   https://storywall.com
   https://www.storywall.com
   http://localhost:3000
   ```
   (Replace `storywall.com` with your actual domain)

4. **Authorized redirect URIs:**
   Add these URLs (click **"+ Add URI"** for each):
   ```
   https://clerk.storywall.com/v1/oauth_callback
   https://*.clerk.accounts.dev/v1/oauth_callback
   http://localhost:3000/v1/oauth_callback
   ```
   
   **Important:** Clerk will provide the exact redirect URI when you configure Google in Clerk Dashboard. You may need to come back and add it.

5. Click **"Create"**

## Step 6: Copy Your Credentials

After creating, you'll see a popup with:
- **Your Client ID** (looks like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)
- **Your Client secret** (looks like: `GOCSPX-abcdefghijklmnopqrstuvwxyz`)

**Copy both of these** - you'll need them for Clerk!

**Note:** The Client secret is only shown once. If you lose it, you'll need to create new credentials.

## Step 7: Add Credentials to Clerk

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your **StoryWall** application
3. Go to **"User & Authentication"** → **"Social Connections"** (or **"Configure"** → **"Social Connections"**)
4. Find **"Google"** in the list
5. Toggle it **ON**
6. You'll see fields for:
   - **Client ID:** Paste your Google Client ID
   - **Client Secret:** Paste your Google Client Secret
7. Click **"Save"**

## Step 8: Update Redirect URI in Google Cloud (if needed)

1. After saving in Clerk, Clerk will show you the exact redirect URI it needs
2. Go back to Google Cloud Console → **"Credentials"**
3. Click on your OAuth 2.0 Client ID
4. Add the Clerk redirect URI to **"Authorized redirect URIs"**
5. Click **"Save"**

## Troubleshooting

**"Redirect URI mismatch" error:**
- Make sure the redirect URI in Google Cloud Console exactly matches what Clerk provides
- Check for trailing slashes, http vs https, etc.

**"Access blocked" error:**
- Make sure your OAuth consent screen is published (or add yourself as a test user)
- Check that the scopes are correct

**Can't find Google in Clerk:**
- Make sure you've enabled Google in Clerk Dashboard → Social Connections
- Refresh the page

## Security Notes

- **Never commit** your Client Secret to git
- Store it only in:
  - Clerk Dashboard (for production)
  - Railway environment variables (if needed)
  - Local `.env.local` (for development, and make sure it's gitignored)

