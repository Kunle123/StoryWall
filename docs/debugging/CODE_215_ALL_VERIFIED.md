# Code 215 Error - All Configuration Verified

## Status
✅ **All configuration verified:**
- Consumer Key/Secret match Developer Portal
- Callback URL matches exactly
- OAuth 1.0a permissions: "Read and write"
- Environment variables correct (no quotes, no spaces)
- Application redeployed
- OAuth 1.0a enabled in Developer Portal

## Problem
Still getting code 215 "Bad Authentication data" when requesting OAuth 1.0a request token.

## Analysis

Since INIT and APPEND steps work (they use the same signature generation), the signature generation code itself is likely correct. The difference is:
- **INIT/APPEND**: Have access tokens (work ✅)
- **Request Token**: No tokens yet (fails ❌)

This suggests the issue is specific to the request token step, not the signature generation in general.

## Possible Causes

### 1. Twitter API Quirk with Request Token
Twitter's `/oauth/request_token` endpoint might have specific requirements that differ from other endpoints.

### 2. Signature Base String for Request Token
The signature base string for request token might need to be constructed differently than we're doing.

### 3. Authorization Header Format
The Authorization header format for request token might need to be different.

## Next Steps

### Option 1: Test with Known Working Library
Test if credentials work with a known working OAuth 1.0a library:

```bash
# Install oauth-1.0a library
npm install oauth-1.0a

# Or use twitter-v1-oauth
npm install twitter-v1-oauth
```

Create a test script to verify credentials work with a working library. If it works, the issue is in our implementation. If it fails, the issue is with credentials/configuration.

### Option 2: Manual curl Test
Test the request token manually with curl to see if credentials work:

```bash
# This requires manual OAuth 1.0a signature generation
# But can verify if the endpoint itself works
```

### Option 3: Contact Twitter Support
Since all configuration is verified, contact [Twitter Developer Support](https://developer.x.com/en/support):
- Provide app ID
- Provide Consumer Key (first 10 chars)
- Provide callback URL
- Explain that all configuration is verified but still getting code 215
- Ask if there are any app-level restrictions or issues

### Option 4: Check App Status
1. Go to Developer Portal → Your App
2. Check if app status is "Active" (not suspended or restricted)
3. Look for any warnings or error messages
4. Check if there are any rate limits or restrictions

### Option 5: Try Different Callback URL Format
Try using "oob" (out-of-band) callback to see if it's a callback URL issue:

```typescript
// In getOAuth1RequestToken, try:
callbackUrl = 'oob' // Out-of-band callback
```

If this works, the issue is with the callback URL format.

### Option 6: Compare with Official Example
Compare our request token implementation byte-by-byte with the official `twauth-web` example:
- [xdevplatform/twauth-web](https://github.com/xdevplatform/twauth-web)
- Check how they construct the request token request
- Compare signature base string construction
- Compare Authorization header format

## Diagnostic Information to Collect

If contacting Twitter support, provide:

1. **App Information:**
   - App ID
   - App Name: StoryWall
   - App Status: Active/Suspended/etc.

2. **Credentials (masked):**
   - Consumer Key: `QutF0F0XCFA9Ifsli9y4...` (first 20 chars)
   - Consumer Secret length: ~50 characters
   - Callback URL: `https://www.storywall.com/api/twitter/oauth1/callback`

3. **Configuration:**
   - OAuth 1.0a permissions: "Read and write"
   - OAuth 1.0a enabled: Yes
   - Callback URLs registered: Yes

4. **Error Details:**
   - Error code: 215
   - Error message: "Bad Authentication data"
   - Endpoint: `POST https://api.twitter.com/oauth/request_token`
   - Request includes: Authorization header with OAuth 1.0a signature

5. **What Works:**
   - INIT step (media upload) works ✅
   - APPEND step (media upload) works ✅
   - OAuth 2.0 works ✅
   - Only request token fails ❌

## Alternative: Use OAuth 2.0 Only

If OAuth 1.0a continues to fail, consider:
- Using OAuth 2.0 for everything (but media upload requires OAuth 1.0a)
- Using a third-party library for OAuth 1.0a
- Using Twitter's official SDK if available

## Notes

- Our signature generation matches working examples
- INIT/APPEND work, so signature code is correct
- Issue is specific to request token step
- All configuration verified multiple times
- This suggests either:
  1. Twitter API quirk with request token
  2. Subtle bug in request token signature
  3. App-level restriction we're not aware of

## Recommendation

**Try Option 1 first** (test with known working library) to isolate whether it's our code or credentials. If a working library also fails, it's a credentials/configuration issue. If it works, it's our implementation.

