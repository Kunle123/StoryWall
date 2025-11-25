# Fix: Twitter Permissions Not Saving (Changes to "Read only" on Refresh)

## Problem
- You set permissions to "Read and write" in Developer Portal
- After refreshing the page, permissions revert to "Read only"
- Tokens continue to lack write permissions

## Root Cause
**OAuth 2.0 and OAuth 1.0a have SEPARATE permission settings** that must be configured and saved independently. If you only set one, the other will remain "Read only".

Additionally, Twitter's Developer Portal sometimes requires:
1. Setting permissions in the correct section
2. Clicking "Save" after each change
3. Waiting for changes to propagate (can take 1-2 minutes)

## Solution: Set Permissions for BOTH OAuth Versions

### Step 1: Navigate to User Authentication Settings

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Click on your app (StoryWall)
3. Go to **"Settings"** tab
4. Click **"User authentication settings"**

### Step 2: Configure OAuth 2.0 Permissions

1. **Find the OAuth 2.0 section** (usually at the top)
2. Look for **"App permissions"** dropdown
3. Select **"Read and write"** (NOT "Read only")
4. **IMPORTANT:** Scroll down and click **"Save"** button
5. Wait for confirmation message: "Settings saved successfully"

### Step 3: Configure OAuth 1.0a Permissions

1. **Scroll down to find the OAuth 1.0a section** (separate from OAuth 2.0)
2. If OAuth 1.0a is not enabled:
   - Toggle **"OAuth 1.0a"** to **ON**
   - This will reveal OAuth 1.0a settings
3. Look for **"App permissions"** dropdown in the OAuth 1.0a section
4. Select **"Read and write"** (NOT "Read only")
5. **IMPORTANT:** Scroll down and click **"Save"** button again
6. Wait for confirmation message: "Settings saved successfully"

### Step 4: Verify Permissions Are Saved

**DO NOT just refresh the page immediately.** Follow these steps:

1. **After saving OAuth 2.0 permissions:**
   - Wait 10 seconds
   - Scroll back to OAuth 2.0 section
   - Verify it still shows "Read and write"
   - If it reverted, repeat Step 2 and ensure you clicked "Save"

2. **After saving OAuth 1.0a permissions:**
   - Wait 10 seconds
   - Scroll back to OAuth 1.0a section
   - Verify it still shows "Read and write"
   - If it reverted, repeat Step 3 and ensure you clicked "Save"

3. **Navigate away and come back:**
   - Click on a different tab (e.g., "Keys and tokens")
   - Go back to "Settings" → "User authentication settings"
   - Verify BOTH sections still show "Read and write"
   - If either reverted, repeat the corresponding step

### Step 5: Regenerate API Keys (Required)

**Even if permissions are saved correctly, you MUST regenerate API keys** if they were created before permissions were set:

1. Go to **"Keys and tokens"** tab
2. Find **"API Key and Secret"** section
3. Click **"Regenerate"** button
   - ⚠️ This invalidates all existing tokens
4. Copy the new **API Key**
5. Copy the new **API Secret**
6. Update environment variables:
   ```
   TWITTER_API_KEY=<new_api_key>
   TWITTER_API_SECRET=<new_api_secret>
   ```
7. **Redeploy your application**

### Step 6: Revoke App Access and Reconnect

1. Go to [Twitter Settings → Apps and sessions](https://twitter.com/settings/apps)
2. Find "StoryWall" (or your app name)
3. Click **"Revoke access"** or **"Remove app"**
4. Wait 30 seconds
5. Go back to StoryWall
6. Click **"Reconnect"** or **"Connect Twitter Account"**
7. Complete both OAuth 2.0 and OAuth 1.0a flows

## Why Permissions Revert on Refresh

### Common Causes:

1. **Only one OAuth version was configured:**
   - You set OAuth 2.0 to "Read and write" but OAuth 1.0a is still "Read only"
   - Twitter's UI might show OAuth 2.0 permissions, but OAuth 1.0a (used for media uploads) is still read-only

2. **Save button not clicked:**
   - Changes are not saved until you click "Save"
   - Each OAuth version requires its own "Save" click

3. **Browser cache:**
   - Old permissions might be cached
   - Try clearing browser cache or using incognito mode

4. **Twitter API propagation delay:**
   - Changes can take 1-2 minutes to propagate
   - Wait before refreshing

## Verification Checklist

After completing all steps, verify:

- [ ] OAuth 2.0 section shows "Read and write" (and stays that way after refresh)
- [ ] OAuth 1.0a section shows "Read and write" (and stays that way after refresh)
- [ ] Both sections have "Save" button clicked
- [ ] API Key and API Secret regenerated
- [ ] Environment variables updated with new keys
- [ ] Application redeployed
- [ ] App access revoked in Twitter Settings
- [ ] Reconnected in StoryWall
- [ ] Completed both OAuth flows
- [ ] Logs show "Token has write permissions"

## Troubleshooting: Permissions Still Reverting

If permissions still revert after following all steps:

### Option 1: Check App Status
1. Go to Developer Portal → Your App
2. Check if app status is "Active" (not suspended or restricted)
3. Look for any warnings or error messages

### Option 2: Try Different Browser
1. Clear browser cache and cookies
2. Try in incognito/private mode
3. Try a different browser

### Option 3: Create New App
1. Create a completely new app in Developer Portal
2. **Set permissions to "Read and write" BEFORE generating any keys**
3. Generate API keys
4. Use new app's keys in environment variables
5. Redeploy and reconnect

### Option 4: Contact Twitter Support
If issue persists:
- Contact [Twitter Developer Support](https://developer.twitter.com/en/support)
- Provide:
  - App ID
  - Screenshots of permission settings
  - Detailed error logs
  - Steps you've already taken

## Important Notes

1. **OAuth 2.0 and OAuth 1.0a are independent:**
   - Setting one doesn't affect the other
   - Both must be set to "Read and write"
   - Both must be saved separately

2. **API keys are tied to permissions:**
   - If keys were generated before permissions were set, tokens will be read-only
   - You MUST regenerate keys after setting permissions

3. **User tokens inherit app permissions:**
   - New tokens will have the permissions set in Developer Portal
   - Old tokens keep their original permissions
   - Users must reconnect to get new tokens

4. **Save button is critical:**
   - Changes are not saved until you click "Save"
   - Each section (OAuth 2.0 and OAuth 1.0a) requires its own save

## Quick Reference: Where to Find Settings

```
Twitter Developer Portal
└── Your App (StoryWall)
    └── Settings
        └── User authentication settings
            ├── OAuth 2.0 Settings
            │   └── App permissions: [Read and write ▼] ← SET THIS
            │   └── [Save] ← CLICK THIS
            │
            └── OAuth 1.0a Settings
                └── App permissions: [Read and write ▼] ← SET THIS
                └── [Save] ← CLICK THIS
```

