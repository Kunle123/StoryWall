# Testing Twitter Image Upload on Railway

This document explains how to test the Twitter image upload functionality directly on the Railway deployment using curl.

## Prerequisites

1. You need to be logged into StoryWall in your browser
2. You need to extract your Clerk session token from browser cookies

## Getting Your Session Token

1. Open StoryWall in your browser (https://www.storywall.com)
2. Open DevTools (F12 or Cmd+Option+I)
3. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
4. Click on **Cookies** > `https://www.storywall.com`
5. Find the `__session` cookie
6. Copy the **Value** (this is your session token)

## Running the Test

### Option 1: Using the Script

```bash
# Set your session token
export CLERK_SESSION="your_session_token_here"

# Run the test script
./scripts/test-twitter-upload-railway.sh
```

### Option 2: Using curl Directly

```bash
# Replace YOUR_SESSION_TOKEN with your actual session token
curl -X POST "https://www.storywall.com/api/twitter/post-tweet" \
  -H "Content-Type: application/json" \
  -H "Cookie: __session=YOUR_SESSION_TOKEN" \
  -d '{
    "text": "Test tweet with image",
    "imageUrl": "https://res.cloudinary.com/dnybzkkfn/image/upload/v1763367993/storywall/ai-generated/qiwvaruecspjsracbtcg.jpg"
  }' \
  -v
```

## What to Look For

The response will show:
- **HTTP Status Code**: Should be 200 for success
- **Response Body**: JSON with `success`, `tweetId`, `imageAttached`, and `warning` fields
- **Server Logs**: Check Railway logs for detailed error messages

## Expected Errors to Debug

1. **500 Internal Server Error**: Check server logs for OAuth library errors
2. **"Could not authenticate you" (code 32)**: OAuth 1.0a signature issue
3. **"Duplicate content"**: Twitter API error (try different tweet text)
4. **401 Unauthorized**: Session token expired or invalid

## Server Logs

Check Railway logs for:
- `[Twitter Upload Media OAuth1]` - Media upload process
- `[Twitter Post Tweet]` - Tweet posting process
- `OAuth library error` - Errors from oauth-1.0a library
- Any stack traces or error messages

