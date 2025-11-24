# Testing Twitter Image Post with curl

## Quick Test for kunle2000@gmail.com Account

If you're testing with the `kunle2000@gmail.com` account:

1. **Sign in to StoryWall** as `kunle2000@gmail.com`
2. **Get your session token**:
   - Open DevTools (F12) → Application → Cookies
   - Copy the value of `__session` cookie
3. **Run the test script**:
   ```bash
   ./scripts/test-twitter-post-curl.sh YOUR_SESSION_TOKEN
   ```

Or use the **browser console method** (see below) - it's even easier!

---

## Method 1: Using Browser Console (Easiest)

1. **Sign in to StoryWall** and make sure you've:
   - Connected Twitter (OAuth 2.0) - for posting tweets
   - Enabled Image Upload (OAuth 1.0a) - for uploading images

2. **Open Browser DevTools** (F12)

3. **Go to Console tab** and run:

```javascript
// Test posting a tweet with an image
fetch('/api/twitter/post-tweet', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text: 'Test tweet from StoryWall 🚀\n\nTesting image upload!',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800'
  })
})
  .then(r => r.json())
  .then(data => {
    console.log('✅ Result:', data);
    if (data.tweetUrl) {
      console.log('🔗 Tweet URL:', data.tweetUrl);
      window.open(data.tweetUrl);
    }
  })
  .catch(console.error);
```

## Method 2: Using the Test Script (Recommended)

The easiest way to test with curl is using the provided script:

```bash
# Get session token from browser DevTools → Application → Cookies → __session
./scripts/test-twitter-post-curl.sh YOUR_SESSION_TOKEN
```

The script will:
- Show you the tweet text and image URL being used
- Make the API call
- Display formatted results
- Show whether the image was attached
- Provide the tweet URL if successful

## Method 3: Using curl with Session Cookie (Manual)

1. **Get your Clerk session cookie**:
   - Open DevTools → Application → Cookies
   - Copy the value of `__session` cookie

2. **Run curl command**:

```bash
curl -X POST https://www.storywall.com/api/twitter/post-tweet \
  -H "Content-Type: application/json" \
  -H "Cookie: __session=YOUR_SESSION_TOKEN_HERE" \
  -d '{
    "text": "Test tweet from StoryWall 🚀\n\nTesting image upload!",
    "imageUrl": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800"
  }'
```

## Method 4: Using TypeScript Test Script

```bash
# Get your session token from browser DevTools → Application → Cookies → __session
CLERK_SESSION="your_session_token_here" npx tsx scripts/test-twitter-image-post.ts
```

## Checking Token Status

To check if an account has the required Twitter tokens configured:

```bash
npx tsx scripts/check-twitter-tokens.ts
```

This will show:
- ✅ OAuth 2.0 status (for posting tweets)
- ✅ OAuth 1.0a status (for image uploads)
- ⚠️  What needs to be configured

## Expected Response

**Success:**
```json
{
  "success": true,
  "tweetId": "1234567890123456789",
  "tweetUrl": "https://twitter.com/i/web/status/1234567890123456789",
  "imageAttached": true
}
```

**If OAuth 1.0a not configured:**
```json
{
  "success": true,
  "tweetId": "1234567890123456789",
  "tweetUrl": "https://twitter.com/i/web/status/1234567890123456789",
  "imageAttached": false,
  "warning": "Tweet posted successfully, but image could not be attached..."
}
```

## Requirements

- ✅ Twitter OAuth 2.0 connected (for posting tweets)
- ✅ Twitter OAuth 1.0a tokens configured (for image uploads)
- ✅ Valid image URL (must be publicly accessible)
- ✅ Image must be under 5MB

