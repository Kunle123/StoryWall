# Twitter Image Upload Issues - Root Cause Analysis

## Problem Summary
Image uploads to Twitter/X are failing with OAuth 1.0a signature error (code 32: "Could not authenticate you") during the APPEND step of the media upload process.

## What Works
1. ✅ **INIT step** - Successfully initializes media upload and receives `media_id`
2. ✅ **OAuth 1.0a credentials** - User tokens are stored and retrieved correctly
3. ✅ **Image download** - Images are successfully downloaded from URLs
4. ✅ **Tweet posting** - Tweets post successfully (without images)

## What Fails
1. ❌ **APPEND step** - Fails with code 32 (OAuth signature error)
2. ❌ **Image attachment** - Images never attach to tweets

## Root Cause Analysis

### Issue 1: Inconsistent Signature Calculation
- **INIT step**: Uses manual `generateOAuth1Signature()` function ✅
- **APPEND step**: Uses `oauth-1.0a` npm library ❌
- **FINALIZE step**: Uses manual `generateOAuth1Signature()` function ✅

**Problem**: The `oauth-1.0a` library may not correctly handle OAuth 1.0a signatures for multipart/form-data requests. Twitter's OAuth 1.0a specification for multipart requests requires:
- Signature base string includes ONLY form field parameters (command, media_id, segment_index)
- Binary data (the image chunk) is NOT included in the signature
- The library might be including the FormData boundary or other multipart-specific data in the signature

### Issue 2: Multipart Form-Data Signature Requirements
For multipart/form-data requests, Twitter's OAuth 1.0a signature must:
1. Use the base URL (no query parameters)
2. Include only form field parameters in the signature base string
3. Exclude binary data from signature calculation
4. Use the exact same parameter encoding as the form fields

### Issue 3: Library vs Manual Implementation
The `oauth-1.0a` library is designed for general OAuth 1.0a requests, but Twitter's multipart media upload has specific requirements that may not be handled correctly by the library.

## Solution

**Use consistent manual signature calculation for all steps** (INIT, APPEND, FINALIZE) to ensure:
1. Consistent signature generation across all steps
2. Correct handling of multipart/form-data for APPEND
3. Full control over the signature base string construction

## Implementation Plan

1. Replace `oauth-1.0a` library usage in APPEND step with manual signature calculation
2. Ensure multipart/form-data signature includes only form field parameters
3. Test with a small image to verify the fix
4. Add enhanced error logging to capture signature details

## Testing Checklist

- [ ] INIT step succeeds (already working)
- [ ] APPEND step succeeds with manual signature
- [ ] FINALIZE step succeeds (already working)
- [ ] Image attaches to tweet
- [ ] Large images (>5MB) are chunked correctly
- [ ] Error handling provides clear messages

