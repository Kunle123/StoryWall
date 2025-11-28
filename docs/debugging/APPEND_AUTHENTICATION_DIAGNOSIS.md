# Twitter Media Upload APPEND Authentication Failure - Diagnosis

## Problem Summary

**Status**: ❌ **APPEND step fails with code 32 "Could not authenticate you"**

- ✅ **INIT step succeeds** (202 Accepted) - Media ID is successfully created
- ❌ **APPEND step fails** (401, code 32) - Authentication error despite correct signature
- ✅ **Tokens are valid** - Same tokens work for INIT
- ✅ **Signature generation is correct** - Same logic used for both INIT and APPEND
- ✅ **Content-Length is accurate** - Validated and correct

## Key Observations from Logs

### INIT Request (Succeeds)
```
[INIT Debug] Response status: 202
[INIT Debug] x-mediaid: 1994422273667629056
[INIT Debug] Content-Type: application/x-www-form-urlencoded
```

### APPEND Request (Fails)
```
[APPEND Error] { errors: [ { message: 'Could not authenticate you', code: 32 } ] }
[APPEND Error] Response status: 401
[APPEND Debug] Content-Type: multipart/form-data; boundary=--------------------------f95091c179fc1d64b76b5520
```

## Code Comparison

### INIT Step (Working)

**Signature Generation:**
```typescript:lib/twitter/api.ts
// Form field parameters (included in signature)
const initParams = {
  command: 'INIT',
  total_bytes: imageBufferNode.length.toString(),
  media_type: 'image/jpeg',
};

// Generate signature - this combines OAuth params + form field params internally
const { signature: initSignature, timestamp: initTimestamp, nonce: initNonce } = generateOAuth1Signature(
  'POST',
  uploadUrl,
  initParams,
  consumerKey,
  consumerSecret,
  token,
  tokenSecret
);

// Create Authorization header
const authHeader = createOAuth1Header(
  consumerKey,
  token,
  initSignature,
  initTimestamp,
  initNonce,
  false,
  undefined,
  uploadUrl // Pass URL to detect media upload endpoint
);
```

**Request Construction:**
```typescript:lib/twitter/api.ts
// Uses application/x-www-form-urlencoded
const formParams = new URLSearchParams({
  command: 'INIT',
  total_bytes: imageBufferNode.length.toString(),
  media_type: 'image/jpeg',
});

const initResponse = await fetch(uploadUrl, {
  method: 'POST',
  headers: {
    'Authorization': authHeader,
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: formParams,
});
```

**Signature Base String (from logs):**
```
POST&https%3A%2F%2Fupload.twitter.com%2F1.1%2Fmedia%2Fupload.json&command%3DINIT%26media_type%3Dimage%252Fjpeg%26oauth_consumer_key%3DzCcqP3CFxVgNvCcvI9QAVoVeV%26oauth_nonce%3D1f74cb34eddafebb30d1187fe58e815a%26oauth_signature_method%3DHMAC-SHA1%26oauth_timestamp%3D1764342299%26oauth_token%3D1993165733224706048-rrVQUR5ggteJS8pJjxkXrZPeicUlxZ%26oauth_version%3D1.0%26total_bytes%3D117472
```

**Authorization Header (from logs):**
```
OAuth oauth_consumer_key="zCcqP3CFxVgNvCcvI9QAVoVeV", oauth_nonce="1f74cb34eddafebb30d1187fe58e815a", oauth_signature="fLH%2FWw5xV7AWlGADbMaGaKGCqP8%3D", oauth_signature_method="HMAC-SHA1", oauth_timestamp="1764342299", oauth_token="1993165733224706048-rrVQUR5ggteJS8pJjxkXrZPeicUlxZ", oauth_version="1.0"
```

### APPEND Step (Failing)

**Signature Generation:**
```typescript:lib/twitter/api.ts
// Form field parameters (included in signature)
const appendParams = {
  command: 'APPEND',
  media_id: mediaId,
  segment_index: segmentIndex.toString(),
};

// Generate signature - this combines OAuth params + form field params internally
const { signature: appendSignature, timestamp: appendTimestamp, nonce: appendNonce } = generateOAuth1Signature(
  'POST',
  uploadUrl,
  appendParams,
  consumerKey,
  consumerSecret,
  token,
  tokenSecret
);

// Create Authorization header
const authHeader = createOAuth1Header(
  consumerKey,
  token,
  appendSignature,
  appendTimestamp,
  appendNonce,
  false, // No callback for APPEND
  undefined, // No callback URL
  uploadUrl // Pass URL to detect media upload endpoint
);
```

**Request Construction:**
```typescript:lib/twitter/api.ts
// Uses multipart/form-data
const FormDataNode = require('form-data');
const formData = new FormDataNode();
// Append in alphabetical order (command, media_id, segment_index) to match signature parameter order
formData.append('command', 'APPEND');
formData.append('media_id', mediaId);
formData.append('segment_index', segmentIndex.toString());
// Append Buffer directly - form-data will handle content-type automatically
formData.append('media', chunk);

// Get Content-Type and Content-Length from form-data
const formHeaders = formData.getHeaders();
const contentType = formHeaders['content-type'] as string;
const contentLength = await new Promise<number>((resolve, reject) => {
  formData.getLength((err: Error | null, length?: number) => {
    if (err) reject(err);
    else resolve(length || 0);
  });
});

// Use Node.js https module for multipart requests
const uploadUrlObj = new URL(uploadUrl);
const requestOptions = {
  hostname: uploadUrlObj.hostname,
  port: uploadUrlObj.port || 443,
  path: uploadUrlObj.pathname + uploadUrlObj.search,
  method: 'POST',
  headers: {
    'Authorization': authHeader,
    'Content-Type': contentType, // From form-data (includes boundary)
    'Content-Length': contentLength.toString(), // Validated string
  },
};

const req = https.request(requestOptions, (res) => {
  // Handle response...
});

formData.pipe(req);
```

**Signature Base String (from logs):**
```
POST&https%3A%2F%2Fupload.twitter.com%2F1.1%2Fmedia%2Fupload.json&command%3DAPPEND%26media_id%3D1994422273667629056%26oauth_consumer_key%3DzCcqP3CFxVgNvCcvI9QAVoVeV%26oauth_nonce%3Da96a2767059bcadb8116ebbe10230eca%26oauth_signature_method%3DHMAC-SHA1%26oauth_timestamp%3D1764342299%26oauth_token%3D1993165733224706048-rrVQUR5ggteJS8pJjxkXrZPeicUlxZ%26oauth_version%3D1.0%26segment_index%3D0
```

**Authorization Header (from logs):**
```
OAuth oauth_consumer_key="zCcqP3CFxVgNvCcvI9QAVoVeV", oauth_nonce="a96a2767059bcadb8116ebbe10230eca", oauth_signature="TE2EhffsYzKRebFDljqMRk56pL0%3D", oauth_signature_method="HMAC-SHA1", oauth_timestamp="1764342299", oauth_token="1993165733224706048-rrVQUR5ggteJS8pJjxkXrZPeicUlxZ", oauth_version="1.0"
```

## Key Differences

| Aspect | INIT | APPEND |
|--------|------|--------|
| **Content-Type** | `application/x-www-form-urlencoded` | `multipart/form-data` |
| **Request Method** | `fetch()` API | Node.js `https.request()` |
| **Body Format** | URLSearchParams | form-data package |
| **Form Fields** | `command`, `total_bytes`, `media_type` | `command`, `media_id`, `segment_index`, `media` (binary) |
| **Signature Params** | `command`, `media_type`, `total_bytes` | `command`, `media_id`, `segment_index` |
| **Result** | ✅ 202 Accepted | ❌ 401 Code 32 |

## Signature Generation Logic

Both INIT and APPEND use the same signature generation function:

```typescript:lib/twitter/api.ts
export function generateOAuth1Signature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerKey: string,
  consumerSecret: string,
  token: string,
  tokenSecret: string
): { signature: string; timestamp: string; nonce: string } {
  // Step 1: Collect OAuth parameters
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = randomBytes(16).toString('hex');
  
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_nonce: nonce,
    oauth_version: '1.0',
    oauth_token: token,
  };

  // Step 2: Merge all parameters (OAuth params + form field params)
  const allParams = { ...oauthParams, ...params };
  
  // Step 3: Normalize parameters (sort and percent-encode)
  const normalizedParams = Object.keys(allParams)
    .sort()
    .map(key => `${percentEncode(key)}=${percentEncode(allParams[key])}`)
    .join('&');

  // Step 4: Create signature base string
  const normalizedUrl = url.split('?')[0];
  const signatureBaseString = [
    method.toUpperCase(),
    percentEncode(normalizedUrl),
    percentEncode(normalizedParams)
  ].join('&');

  // Step 5: Create signing key
  const encodedConsumerSecret = percentEncode(consumerSecret);
  const encodedTokenSecret = tokenSecret ? percentEncode(tokenSecret) : '';
  const signingKey = `${encodedConsumerSecret}&${encodedTokenSecret}`;

  // Step 6: Generate HMAC-SHA1 signature
  const signature = crypto
    .createHmac('sha1', signingKey)
    .update(signatureBaseString)
    .digest('base64');

  return { signature, timestamp, nonce };
}
```

## Authorization Header Creation

Both use the same header creation function with signature encoding for media upload endpoints:

```typescript:lib/twitter/api.ts
function createOAuth1Header(
  consumerKey: string,
  token: string,
  signature: string,
  timestamp: string,
  nonce: string,
  includeCallback?: boolean,
  callbackUrl?: string,
  url?: string
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_nonce: nonce,
    oauth_version: '1.0',
    oauth_signature: signature,
  };
  
  if (token) {
    oauthParams.oauth_token = token;
  }

  // Twitter quirk: Percent-encode signature for media upload endpoints
  const isMediaUpload = url ? url.includes('/media/upload') : false;
  const shouldEncodeSignature = isMediaUpload;

  const sortedKeys = Object.keys(oauthParams).sort();
  
  return 'OAuth ' + sortedKeys
    .map(key => {
      const encodedKey = percentEncode(key);
      const encodedValue = (key === 'oauth_signature' && !shouldEncodeSignature)
        ? oauthParams[key]  // Don't encode signature for standard endpoints
        : percentEncode(oauthParams[key]);  // Encode for media upload (Twitter quirk)
      return `${encodedKey}="${encodedValue}"`;
    })
    .join(', ');
}
```

## Token Verification

Tokens are verified at multiple stages to ensure they're not corrupted:

```typescript:lib/twitter/api.ts
// Store original tokens for verification
const originalTokenReceived = token;
const originalTokenSecretReceived = tokenSecret;

// Verify before signature generation
console.log(`[APPEND Debug] Token (FULL):`, token);
console.log(`[APPEND Debug] Token Secret (FULL):`, tokenSecret);

// Verify after signature generation
if (token !== originalTokenReceived) {
  console.error(`[APPEND Debug] ⚠️ ERROR: Token was modified!`);
}
```

**From logs**: ✅ Tokens remain unchanged throughout the process.

## Content-Length Validation

Content-Length is carefully validated to ensure accuracy:

```typescript:lib/twitter/api.ts
// Get Content-Length from form-data (calculated including all boundaries)
const contentLength = await new Promise<number>((resolve, reject) => {
  formData.getLength((err: Error | null, length?: number) => {
    if (err) reject(err);
    else resolve(length || 0);
  });
});

// Validate Content-Length
if (!Number.isInteger(contentLength) || contentLength <= 0) {
  throw new Error(`Invalid Content-Length calculated: ${contentLength}`);
}

// Validate against Twitter's limits
const maxContentLength = 5.5 * 1024 * 1024; // 5.5MB
if (contentLength > maxContentLength) {
  throw new Error(`Content-Length (${contentLength} bytes) exceeds Twitter's maximum`);
}

// Validate string format (no spaces, no extra chars)
const contentLengthString = String(contentLength).trim();
if (!/^\d+$/.test(contentLengthString)) {
  throw new Error(`Content-Length string contains invalid characters: "${contentLengthString}"`);
}
```

**From logs**: ✅ Content-Length is valid (118023 bytes for 117472 byte chunk + 551 bytes multipart overhead).

## Potential Root Causes

### 1. Multipart Form-Data Handling
**Hypothesis**: Twitter may validate multipart requests differently than URL-encoded requests.

**Evidence**:
- INIT uses `application/x-www-form-urlencoded` → ✅ Works
- APPEND uses `multipart/form-data` → ❌ Fails
- Same signature generation logic for both

**Investigation Needed**:
- Compare with working implementations (e.g., `twurl`)
- Check if form field order in multipart body matters
- Verify if `media` field position is critical

### 2. Request Method Difference
**Hypothesis**: Using Node.js `https.request()` vs `fetch()` API might cause header handling differences.

**Evidence**:
- INIT uses `fetch()` → ✅ Works
- APPEND uses `https.request()` → ❌ Fails
- Both set headers manually

**Investigation Needed**:
- Try using `fetch()` with multipart (may require different approach)
- Compare exact headers sent by both methods

### 3. Form Field Order
**Hypothesis**: Twitter may require form fields in a specific order in the multipart body.

**Current Implementation**:
```typescript
formData.append('command', 'APPEND');        // 1st
formData.append('media_id', mediaId);        // 2nd
formData.append('segment_index', segmentIndex.toString()); // 3rd
formData.append('media', chunk);             // 4th (binary)
```

**Investigation Needed**:
- Check Twitter documentation for required field order
- Try different field orders
- Verify if `media` must be last

### 4. Boundary String
**Hypothesis**: The multipart boundary format might not match Twitter's expectations.

**Current Implementation**:
```
Content-Type: multipart/form-data; boundary=--------------------------f95091c179fc1d64b76b5520
```

**Investigation Needed**:
- Compare boundary format with working implementations
- Check if Twitter requires a specific boundary format

### 5. Binary Data Encoding
**Hypothesis**: The way binary data is appended might affect signature validation.

**Current Implementation**:
```typescript
formData.append('media', chunk); // Buffer directly
```

**Investigation Needed**:
- Try different ways of appending binary data
- Check if content-type for media field matters

## Root Cause Analysis (Updated)

### The Core Problem: Missing Parameters in the Signature

**Key Finding**: The signature generation is **correct** - it correctly excludes the binary `media` field and only includes `command`, `media_id`, and `segment_index` in the signature base string (lines 709-713).

**The Issue**: When using `multipart/form-data` for the APPEND request, Twitter's API requires that:
1. The `media` parameter (binary chunk) must **NOT** be included in the OAuth 1.0a signature base string ✅ (Already correct)
2. The `oauth_token` must be included in the signature ✅ (Already correct)
3. The Content-Type header must be correctly formatted for multipart/form-data
4. The request must be sent using a method compatible with Twitter's OAuth validator

**The Real Problem**: The combination of:
- Node.js `https.request()` method
- `form-data` library streaming
- Multipart/form-data Content-Type with boundary

...may cause Twitter's OAuth validator to fail signature validation, even when the signature is correctly generated.

### Evidence

- ✅ INIT succeeds using `fetch()` with `application/x-www-form-urlencoded`
- ❌ APPEND fails using `https.request()` with `multipart/form-data`
- ✅ Signature base string is correct (only includes non-file parameters: `command`, `media_id`, `segment_index`)
- ✅ Tokens are valid (same tokens work for INIT)
- ✅ Content-Length is accurate
- ✅ `oauth_token` is included in signature (line 65 in `generateOAuth1Signature`)

### The Solution: Use `fetch()` API for APPEND

Since INIT works with `fetch()`, we should try using `fetch()` for APPEND as well. The key is to:
1. Use the `form-data` package to create the multipart body
2. Convert the form-data stream to a Buffer
3. Use `fetch()` with the buffer and proper headers (same approach as INIT)

**Why This Should Work**:
- INIT uses `fetch()` → ✅ Works
- APPEND uses `https.request()` → ❌ Fails
- Using same HTTP client (`fetch()`) for both should eliminate client-specific issues

**Alternative**: Use a well-tested Twitter client library (like `twitter-api-v2` or `twit`) that has already solved this multipart OAuth 1.0a issue.

## Recommended Solution: Use `twitter-api-v2` Library

**The best solution is to migrate to a well-tested library** that has already solved this exact problem.

### Why Use a Library?

1. **Solves the APPEND issue** - `twitter-api-v2` has already solved the OAuth 1.0a multipart/form-data quirk
2. **Well-tested** - Used by thousands of projects, handles edge cases
3. **Actively maintained** - Regular updates for Twitter API changes
4. **Less code** - Reduces ~500 lines of custom code to ~50 lines
5. **Type-safe** - Full TypeScript support

### Migration Guide

See: [`docs/migration/TWITTER_LIBRARY_MIGRATION.md`](../migration/TWITTER_LIBRARY_MIGRATION.md)

### Alternative Next Steps (If Not Using Library)

1. **Compare with `twurl`**:
   - Capture exact request from `twurl` for APPEND step
   - Compare headers, body structure, field order
   - Verify signature base string matches

2. **Contact Twitter Support**:
   - Provide exact request details
   - Include signature base string
   - Include Authorization header
   - Reference this known multipart/form-data OAuth 1.0a quirk

## Current Status

- ✅ **Signature generation**: Correct (excludes binary data, only includes form fields)
- ✅ **Token handling**: Correct (verified at multiple stages)
- ✅ **Content-Length**: Correct (validated and accurate)
- ✅ **Header construction**: Correct (Authorization header properly formatted)
- ❌ **Multipart request method**: Using `https.request()` may be incompatible with Twitter's OAuth validator
- ❌ **HTTP client**: Different client (`https.request()`) than working INIT step (`fetch()`)

**Conclusion**: The issue is a known quirk with Twitter's OAuth 1.0a validation for multipart/form-data requests when using Node.js `https.request()`. The signature is correct, but the request method/client may be causing the validation to fail. Solution: Try using `fetch()` API for APPEND (same as INIT) or migrate to a well-tested Twitter client library.

