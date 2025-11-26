# Twitter OAuth 1.0a Implementation Comparison

## Working Example: twitter-v1-oauth Library

### Signature Generation
```typescript
// From: https://github.com/MauricioRobayo/twitter-v1-oauth
const baseString = signatureBaseString(options);
const consumerSecret = percentEncode(options.oAuthOptions.api_secret_key);
const tokenSecret = percentEncode(options.oAuthOptions.access_token_secret);
const signingKey = `${consumerSecret}&${tokenSecret}`;
const outputString = crypto
  .createHmac("sha1", signingKey)
  .update(baseString)
  .digest("base64");
```

### Signature Base String
```typescript
// From: https://github.com/MauricioRobayo/twitter-v1-oauth
const paramString = parameterString(oAuthOptions, params, data);
return `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(paramString)}`;
```

### Percent Encode Function
```typescript
// From: https://github.com/MauricioRobayo/twitter-v1-oauth
export function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/[!'()]/g, escape)
    .replace(/\*/g, "%2A");
}
```

## Our Implementation

### Signature Generation (generateOAuth1Signature)
```typescript
// Step 4: Create signature base string
const normalizedUrl = url.split('?')[0];
const signatureBaseString = [
  method.toUpperCase(),
  percentEncode(normalizedUrl),
  percentEncode(normalizedParams) // ✅ Matches working example
].join('&');

// Step 5: Create signing key
const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`; // ✅ Matches

// Step 6: Generate signature
const signature = createHmac('sha1', signingKey)
  .update(signatureBaseString)
  .digest('base64'); // ✅ Matches
```

### Percent Encode Function
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

**Difference**: Our implementation uses individual `.replace()` calls, while the working example uses `/[!'()]/g` regex. Both should produce the same result.

## Request Token Specific Issue

### Working Example (for request token)
- Uses empty token/secret: `signingKey = ${percentEncode(consumerSecret)}&` ✅
- Includes `oauth_callback` in signature base string ✅
- Percent-encodes normalized params string in base string ✅

### Our Implementation (getOAuth1RequestToken)
```typescript
const { signature, timestamp, nonce } = generateOAuth1Signature(
  'POST',
  url,
  {}, // No form field params
  consumerKey,
  consumerSecret,
  '', // No token yet ✅
  '', // No token secret yet ✅
  true, // Include callback ✅
  callbackUrl
);
```

## Key Differences to Check

1. **Authorization Header**: The working example percent-encodes ALL values including signature (which is wrong per spec, but might be what Twitter accepts?)
2. **Parameter Normalization**: Need to verify our parameter string matches exactly
3. **Signature Base String**: Need to verify the exact format

## Next Steps

1. Add detailed logging to compare our signature base string with a known working example
2. Test with the exact same credentials to see if signature matches
3. Check if Twitter's API has any quirks with signature encoding

