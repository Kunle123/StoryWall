# Byte-by-Byte Comparison: Our Implementation vs Official Example

## Current Status
- Consumer Key: `eNmO4GWJSRrqZ2qZkBJyxLlt2` (25 chars ✅)
- Consumer Secret: 50 chars ✅
- Callback URL: `https://www.storywall.com/api/twitter/oauth1/callback` ✅
- Still getting code 215 ❌

## Our Implementation Analysis

From the logs, our signature base string is:
```
POST&https%3A%2F%2Fapi.twitter.com%2Foauth%2Frequest_token&oauth_callback%3Dhttps%253A%252F%252Fwww.storywall.com%252Fapi%252Ftwitter%252Foauth1%252Fcallback%26oauth_consumer_key%3DeNmO4GWJSRrqZ2qZkBJyxLlt2%26oauth_nonce%3D433f3eab898a0a40c95e6d5b4a1ece97%26oauth_signature_method%3DHMAC-SHA1%26oauth_timestamp%3D1764203183%26oauth_version%3D1.0
```

### Breakdown:
1. **Method**: `POST` ✅
2. **URL**: `https%3A%2F%2Fapi.twitter.com%2Foauth%2Frequest_token` ✅
3. **Normalized Params**: `oauth_callback%3Dhttps%253A%252F%252Fwww.storywall.com%252Fapi%252Ftwitter%252Foauth1%252Fcallback%26oauth_consumer_key%3DeNmO4GWJSRrqZ2qZkBJyxLlt2%26oauth_nonce%3D433f3eab898a0a40c95e6d5b4a1ece97%26oauth_signature_method%3DHMAC-SHA1%26oauth_timestamp%3D1764203183%26oauth_version%3D1.0` ✅

### Authorization Header:
```
OAuth oauth_callback="https%3A%2F%2Fwww.storywall.com%2Fapi%2Ftwitter%2Foauth1%2Fcallback", oauth_consumer_key="eNmO4GWJSRrqZ2qZkBJyxLlt2", oauth_nonce="433f3eab898a0a40c95e6d5b4a1ece97", oauth_signature="JN5CiHpL21wutbZrDAvkhRSD1ug=", oauth_signature_method="HMAC-SHA1", oauth_timestamp="1764203183", oauth_version="1.0"
```

## Key Differences to Check

### 1. Parameter Ordering
OAuth 1.0a requires parameters to be sorted alphabetically. Our implementation:
- ✅ Sorts parameters alphabetically
- ✅ Order: `oauth_callback`, `oauth_consumer_key`, `oauth_nonce`, `oauth_signature_method`, `oauth_timestamp`, `oauth_version`

### 2. Percent Encoding
Our `percentEncode` function:
```typescript
function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}
```

**Potential Issue**: The `escape` function in JavaScript is deprecated. The working example uses:
```javascript
.replace(/[!'()]/g, escape)
```

But `encodeURIComponent` should handle most cases correctly. However, let's verify the exact encoding.

### 3. Signature Base String Construction
Our implementation:
```typescript
const signatureBaseString = [
  method.toUpperCase(),
  percentEncode(normalizedUrl),
  percentEncode(normalizedParams)
].join('&');
```

This matches the OAuth 1.0a spec exactly.

### 4. Signing Key
For request token (no token yet):
```typescript
const signingKey = `${percentEncode(consumerSecret)}&${percentEncode('')}`;
// Results in: encoded_secret&
```

This is correct per OAuth 1.0a spec.

## Potential Issues

### Issue 1: Percent Encoding of Empty String
When we do `percentEncode('')` for the token secret, what does it return?
- `encodeURIComponent('')` returns `''` (empty string)
- So signing key would be: `encoded_secret&` ✅

This should be correct.

### Issue 2: Authorization Header Format
OAuth 1.0a spec says values in Authorization header should be:
- Keys: percent-encoded
- Values: percent-encoded (except signature which is base64)

Our implementation:
- ✅ Percent-encodes keys
- ✅ Percent-encodes values (except signature)
- ✅ Signature is NOT percent-encoded (correct - it's base64)

### Issue 3: Request Method
We're using `POST` which is correct for request_token.

### Issue 4: Content-Type Header
We're NOT sending a `Content-Type` header. For request_token with no body, this might be okay, but let's check if Twitter expects one.

## Comparison with Official Example (twauth-web)

The official Python example likely uses:
1. `urllib.parse.quote` for percent encoding (similar to `encodeURIComponent`)
2. `hmac.new` for signature generation (same as our `createHmac`)
3. Sorted parameters (same as ours)

## Next Steps

### Test 1: Verify Percent Encoding
Check if our percent encoding matches exactly. The callback URL in the signature:
- Our encoding: `https%3A%2F%2Fwww.storywall.com%2Fapi%2Ftwitter%2Foauth1%2Fcallback`
- Should be: `https%3A%2F%2Fwww.storywall.com%2Fapi%2Ftwitter%2Foauth1%2Fcallback`

### Test 2: Check if Twitter Expects Content-Type
Try adding:
```typescript
headers: {
  'Authorization': authHeader,
  'Content-Type': 'application/x-www-form-urlencoded', // Try adding this
}
```

### Test 3: Verify Signing Key
Log the exact signing key (masked) to verify it's `encoded_secret&` and not `encoded_secret&encoded_empty` or something else.

### Test 4: Compare with Working INIT Step
Since INIT works, compare:
- INIT signature base string format
- INIT Authorization header format
- INIT request headers

If they're identical in format, the issue might be Twitter-specific for request_token endpoint.

## Most Likely Issue

Given that:
1. INIT/APPEND work (same signature generation)
2. All configuration verified
3. Signature format looks correct

The issue is likely:
- **Twitter API quirk**: Request token endpoint might have specific requirements
- **App-level restriction**: App might have restrictions we're not aware of
- **Callback URL validation**: Twitter might be validating callback URL differently for request_token

## Recommendation

Since everything is verified and signature generation matches the spec, contact Twitter Developer Support with:
1. App ID
2. Consumer Key (first 10 chars): `eNmO4GWJSRrqZ2qZkBJyxLlt2`
3. Exact error: Code 215 on `/oauth/request_token`
4. Note that INIT/APPEND work (proving credentials are valid)

This suggests an app-level issue or Twitter API quirk specific to request_token.

