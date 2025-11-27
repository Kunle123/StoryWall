# X Developer Platform Examples and Resources

This document references official examples from the [X Developer Platform GitHub organization](https://github.com/xdevplatform) that can help with OAuth 1.0a implementation and troubleshooting.

## Key Repositories

### 1. **twauth-web** - OAuth Authentication Example
- **Repository**: [xdevplatform/twauth-web](https://github.com/xdevplatform/twauth-web)
- **Description**: A simple Python Flask web app that demonstrates the flow of obtaining a Twitter user OAuth access token
- **Useful for**: Understanding the complete OAuth 1.0a flow, including request_token, authorize, and access_token steps
- **Language**: Python/Flask
- **Last Updated**: April 2024

### 2. **xurl** - OAuth-enabled curl tool
- **Repository**: [xdevplatform/xurl](https://github.com/xdevplatform/xurl)
- **Description**: OAuth 2.0 enabled curl for the X API (also supports OAuth 1.0a)
- **Useful for**: Testing OAuth 1.0a requests directly, understanding how OAuth signatures are generated
- **Language**: Go
- **Last Updated**: May 2025
- **Stars**: 124

### 3. **Twitter-API-v2-sample-code**
- **Repository**: [xdevplatform/Twitter-API-v2-sample-code](https://github.com/xdevplatform/Twitter-API-v2-sample-code)
- **Description**: Sample code for the Twitter API v2 endpoints
- **Useful for**: General API usage patterns, though focuses on OAuth 2.0
- **Language**: JavaScript
- **Last Updated**: January 2025
- **Stars**: 3,080

### 4. **xdk** - SDK Generator
- **Repository**: [xdevplatform/xdk](https://github.com/xdevplatform/xdk)
- **Description**: SDK generator for the X APIs
- **Useful for**: Understanding how official SDKs handle OAuth
- **Language**: TypeScript
- **Last Updated**: November 2025

## OAuth 1.0a Specific Resources

### Official Documentation
- **X Developer Docs**: [OAuth 1.0a Authentication](https://docs.x.com/fundamentals/authentication/guides/authentication-with-oauth-1-0a)
- **Request Token Endpoint**: [POST oauth/request_token](https://docs.x.com/fundamentals/authentication/api-reference/request_token)

### Community Libraries (Not Official, but Well-Tested)

1. **twitter-v1-oauth** (TypeScript)
   - Repository: [MauricioRobayo/twitter-v1-oauth](https://github.com/MauricioRobayo/twitter-v1-oauth)
   - **Why useful**: Working implementation we've compared our code against
   - **Key insight**: Uses same signature generation approach as our implementation

2. **oauth-1.0a** (JavaScript)
   - NPM package: `oauth-1.0a`
   - **Why useful**: Widely used library for OAuth 1.0a signature generation
   - **Note**: We're not using this library, but it's a good reference

## What We Can Learn from These Examples

### 1. Request Token Flow
All examples follow this pattern:
1. Generate OAuth parameters (consumer_key, nonce, timestamp, signature_method, version)
2. Include `oauth_callback` in signature base string
3. Create signature base string: `METHOD&URL&PARAMS`
4. Generate HMAC-SHA1 signature
5. Build Authorization header with all parameters

### 2. Signature Generation
Key points from examples:
- **Percent-encode**: All parameter keys and values must be percent-encoded
- **Sort parameters**: Parameters must be sorted alphabetically
- **Double-encode**: The normalized params string is percent-encoded again in the signature base string
- **Signing key**: Format is `encoded_consumer_secret&encoded_token_secret` (empty token secret for request_token)

### 3. Authorization Header
- Format: `OAuth key1="value1", key2="value2", ...`
- All values (except signature) are percent-encoded
- Signature is base64-encoded, NOT percent-encoded
- Parameters sorted alphabetically

## Comparison with Our Implementation

### ✅ What We're Doing Correctly
1. Percent-encoding all parameters
2. Sorting parameters alphabetically
3. Including callback in signature base string
4. Using correct signing key format (`consumerSecret&` for request_token)
5. Not percent-encoding the signature (it's already base64)

### ⚠️ Potential Issues to Verify
1. **Consumer Key/Secret mismatch**: Most common cause of code 215
2. **Callback URL mismatch**: Must match exactly in Developer Portal
3. **Environment variables**: May have extra spaces, quotes, or newlines
4. **OAuth 1.0a not enabled**: Must be enabled in Developer Portal

## Next Steps

1. **Verify Credentials**: Compare Consumer Key in logs with Developer Portal
2. **Check Callback URL**: Verify exact match in Developer Portal
3. **Test with xurl**: Use the official `xurl` tool to test if credentials work
4. **Review twauth-web**: Check Python implementation for any differences

## Useful Links

- [X Developer Platform GitHub](https://github.com/xdevplatform)
- [X Developer Documentation](https://developer.x.com)
- [OAuth 1.0a RFC 5849](https://tools.ietf.org/html/rfc5849)
- [X API Error Codes](https://developer.x.com/en/support/twitter-api/error-troubleshooting)

## Testing with Official Tools

### Using xurl (if available)
```bash
# Test request token (if xurl supports OAuth 1.0a)
xurl --oauth1 \
  --consumer-key YOUR_KEY \
  --consumer-secret YOUR_SECRET \
  --callback-url YOUR_CALLBACK \
  POST https://api.twitter.com/oauth/request_token
```

### Manual Testing
1. Generate signature using our code
2. Compare with signature from a working library
3. Verify all parameters match exactly

## Notes

- Most X Developer Platform examples focus on OAuth 2.0 (newer standard)
- OAuth 1.0a examples are less common but still available
- The `twauth-web` repository is the best official example for OAuth 1.0a
- Community libraries like `twitter-v1-oauth` provide working TypeScript implementations

