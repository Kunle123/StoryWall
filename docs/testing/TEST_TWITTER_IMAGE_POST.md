# Testing Twitter Image Post with curl

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

## Method 2: Using curl with Session Cookie

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

## Method 3: Using the Test Script

```bash
# Get your session token from browser DevTools → Application → Cookies → __session
CLERK_SESSION="your_session_token_here" npx tsx scripts/test-twitter-image-post.ts
```

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

