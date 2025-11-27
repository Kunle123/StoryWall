# Twitter Developer Support Request Template

## Issue Summary
Getting code 215 "Bad Authentication data" when requesting OAuth 1.0a request token, despite all configuration being verified and credentials being correct.

## App Information
- **App Name**: StoryWall
- **App ID**: [Your App ID from Developer Portal]
- **Consumer Key**: `eNmO4GWJSRrqZ2qZkBJyxLlt2` (first 25 chars shown)
- **Consumer Secret**: 50 characters (length verified)

## Configuration Verified
✅ **OAuth 1.0a Permissions**: "Read and write" (set in Developer Portal)
✅ **OAuth 1.0a Enabled**: Yes
✅ **Callback URLs Registered**:
   - `https://www.storywall.com/api/twitter/callback` (OAuth 2.0)
   - `https://www.storywall.com/api/twitter/oauth1/callback` (OAuth 1.0a)
✅ **App Type**: "Web App, Automated App or Bot"
✅ **Environment Variables**: Verified (no quotes, no spaces, correct values)
✅ **Application Redeployed**: After updating credentials

## Error Details
- **Endpoint**: `POST https://api.twitter.com/oauth/request_token`
- **Error Code**: 215
- **Error Message**: "Bad Authentication data"
- **HTTP Status**: 400

## Critical Evidence: INIT/APPEND Work
**This is the key point**: Our OAuth 1.0a implementation works for other endpoints:
- ✅ **INIT step** (media upload): Works successfully
- ✅ **APPEND step** (media upload): Works successfully
- ❌ **Request Token step**: Fails with code 215

This proves:
1. Our signature generation is correct (same code used for all endpoints)
2. Our credentials are valid (INIT/APPEND authenticate successfully)
3. The issue is specific to the `/oauth/request_token` endpoint

## Request Details

### Signature Base String (from logs)
```
POST&https%3A%2F%2Fapi.twitter.com%2Foauth%2Frequest_token&oauth_callback%3Dhttps%253A%252F%252Fwww.storywall.com%252Fapi%252Ftwitter%252Foauth1%252Fcallback%26oauth_consumer_key%3DeNmO4GWJSRrqZ2qZkBJyxLlt2%26oauth_nonce%3D9df8e6fcec8ae57c87c5044f20772a75%26oauth_signature_method%3DHMAC-SHA1%26oauth_timestamp%3D1764206439%26oauth_version%3D1.0
```

### Authorization Header (from logs)
```
OAuth oauth_callback="https%3A%2F%2Fwww.storywall.com%2Fapi%2Ftwitter%2Foauth1%2Fcallback", oauth_consumer_key="eNmO4GWJSRrqZ2qZkBJyxLlt2", oauth_nonce="9df8e6fcec8ae57c87c5044f20772a75", oauth_signature="ReZ+2B9Lbrq/kdDNKG00ngJAWVo=", oauth_signature_method="HMAC-SHA1", oauth_timestamp="1764206439", oauth_version="1.0"
```

### Parameters Included
- `oauth_callback`: `https://www.storywall.com/api/twitter/oauth1/callback`
- `oauth_consumer_key`: `eNmO4GWJSRrqZ2qZkBJyxLlt2`
- `oauth_nonce`: [random hex string]
- `oauth_signature_method`: `HMAC-SHA1`
- `oauth_timestamp`: [Unix timestamp]
- `oauth_version`: `1.0`

## What We've Tried
1. ✅ Verified Consumer Key/Secret match Developer Portal exactly
2. ✅ Verified callback URL matches Developer Portal exactly
3. ✅ Regenerated API Key and Secret
4. ✅ Updated environment variables (no quotes, no spaces)
5. ✅ Redeployed application
6. ✅ Verified OAuth 1.0a permissions are "Read and write"
7. ✅ Verified OAuth 1.0a is enabled
8. ✅ Tried adding Content-Type header
9. ✅ Verified signature generation matches OAuth 1.0a spec

## Questions for Twitter Support
1. Is there a known issue with the `/oauth/request_token` endpoint?
2. Are there any app-level restrictions that might prevent request token generation?
3. Is there a difference in how request_token validates signatures vs other endpoints?
4. Could there be a callback URL validation issue specific to request_token?
5. Are there any additional requirements for request_token that differ from other OAuth 1.0a endpoints?

## Additional Context
- Our implementation follows OAuth 1.0a RFC 5849 specification
- Signature generation works correctly (proven by INIT/APPEND success)
- All configuration has been verified multiple times
- This issue persists across multiple credential regenerations

## Request
Please investigate why `/oauth/request_token` returns code 215 when:
- Same credentials work for other OAuth 1.0a endpoints (INIT/APPEND)
- All configuration is verified correct
- Signature generation follows OAuth 1.0a spec

This suggests either:
- A Twitter API quirk specific to request_token
- An app-level restriction we're not aware of
- A callback URL validation issue

## Contact Information
- **Developer Email**: [Your email]
- **App Name**: StoryWall
- **App ID**: [Your App ID]

---

## How to Submit
1. Go to [Twitter Developer Support](https://developer.x.com/en/support)
2. Create a new support ticket
3. Copy the above information
4. Attach relevant logs if requested

