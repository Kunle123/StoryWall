# Twitter OAuth 1.0a Token Management

This document explains how OAuth 1.0a access tokens and access token secrets are obtained, stored, retrieved, and used in StoryWall.

## Overview

OAuth 1.0a tokens are required for Twitter's v1.1 media upload endpoint (`upload.twitter.com/1.1/media/upload.json`). Unlike OAuth 2.0 tokens (used for posting tweets), OAuth 1.0a tokens are **user-specific** and must be obtained through a 3-legged OAuth flow.

## Token Lifecycle

### ⚠️ **Critical: Are We Requesting New Tokens or Reusing Existing Ones?**

**Answer: We're REQUESTING new tokens, but Twitter may RETURN existing tokens.**

**How it works:**
1. **We request:** Each OAuth 1.0a flow requests a NEW access token from Twitter
2. **Twitter decides:** If the user has already authorized the app and hasn't revoked access, Twitter may return the **SAME existing token** instead of creating a new one
3. **Why this matters:** If the existing token lacks write permissions, we'll get the same read-only token back

**Twitter OAuth 1.0a Limitations:**
- ❌ **No "force" parameter:** Unlike OAuth 2.0, OAuth 1.0a doesn't support forcing token regeneration
- ❌ **No automatic regeneration:** Twitter doesn't automatically issue new tokens if permissions changed
- ✅ **Solution:** User must **manually revoke app access** in Twitter Settings first, then reconnect

**Our Detection:**
We detect when Twitter returns the same token:
```typescript
// app/api/twitter/oauth1/callback/route.ts (lines 220-227)
isSameToken = existingUser?.twitterOAuth1Token === accessTokenData.oauth_token;
if (isSameToken) {
  // Twitter returned the same token - likely still read-only
  // User must revoke app access first
}
```

**What we use:**
- `oauth/authorize` (not `oauth/authenticate`) - always shows authorization screen
- But Twitter may still return existing token if user hasn't revoked access

### 1. **Token Storage (Database Schema)**

Tokens are stored in the `users` table:

```prisma
model User {
  // OAuth 1.0a credentials for media uploads (v1.1 endpoint requires OAuth 1.0a)
  twitterOAuth1Token String? @map("twitter_oauth1_token") @db.Text
  twitterOAuth1TokenSecret String? @map("twitter_oauth1_token_secret") @db.Text
}
```

**Storage Details:**
- **Type:** `TEXT` (PostgreSQL) - can store long token strings
- **Nullable:** Yes - tokens may not exist if user hasn't completed OAuth 1.0a flow
- **Encryption:** Currently stored as plain text (consider encryption for production)
- **Location:** PostgreSQL database via Prisma ORM

### 2. **Token Acquisition (OAuth 1.0a Flow)**

#### Step 1: Request Token (Initiate Flow)
**Endpoint:** `GET /api/twitter/oauth1`

```typescript
// app/api/twitter/oauth1/route.ts
const requestTokenData = await getOAuth1RequestToken(
  consumerKey,      // From TWITTER_API_KEY env var
  consumerSecret, // From TWITTER_API_SECRET env var
  redirectUri      // OAuth 1.0a callback URL
);
```

**What happens:**
1. App requests a **request token** from Twitter
2. Twitter returns `oauth_token` and `oauth_token_secret` (temporary)
3. Request token secret is stored in **HTTP-only cookie** (not database)
4. User is redirected to Twitter authorization page

**Storage:** Request token secret stored in cookie `twitter_oauth1_request_token_secret`

#### Step 2: User Authorization
**URL:** `https://api.twitter.com/oauth/authorize?oauth_token={request_token}`

**What happens:**
1. User authorizes the app on Twitter
2. Twitter redirects back to callback with `oauth_token` and `oauth_verifier`

#### Step 3: Exchange for Access Token
**Endpoint:** `GET /api/twitter/oauth1/callback`

```typescript
// app/api/twitter/oauth1/callback/route.ts
const accessTokenData = await exchangeOAuth1RequestTokenForAccessToken(
  consumerKey,
  consumerSecret,
  requestToken,      // From callback URL
  requestTokenSecret, // From cookie
  oauthVerifier      // From callback URL
);
```

**What Twitter returns:**
```json
{
  "oauth_token": "user_access_token_here",
  "oauth_token_secret": "user_access_token_secret_here"
}
```

#### Step 4: Store Access Tokens in Database

```typescript
// app/api/twitter/oauth1/callback/route.ts (lines 238-244)
await prisma.user.update({
  where: { id: user.id },
  data: {
    twitterOAuth1Token: accessTokenData.oauth_token,
    twitterOAuth1TokenSecret: accessTokenData.oauth_token_secret,
  },
});
```

**Custody Chain Verification:**
- Tokens are logged **BEFORE** database storage
- Tokens are retrieved **AFTER** database storage
- Comparison verifies tokens weren't corrupted during storage

### 3. **Token Retrieval (When Needed)**

#### For Image Uploads

**Endpoint:** `POST /api/twitter/post-tweet`

```typescript
// app/api/twitter/post-tweet/route.ts (lines 30-40)
const userWithToken = await prisma.user.findUnique({
  where: { id: user.id },
  select: {
    twitterAccessToken: true,        // OAuth 2.0 (for posting)
    twitterOAuth1Token: true,        // OAuth 1.0a (for media upload)
    twitterOAuth1TokenSecret: true,  // OAuth 1.0a secret
  },
});
```

**What happens:**
1. User requests to post a tweet with an image
2. API route queries database for user's OAuth 1.0a tokens
3. Tokens are passed to `uploadMediaOAuth1()` function
4. Tokens are used to sign OAuth 1.0a requests to Twitter

### 4. **Token Usage (Media Upload)**

**Function:** `uploadMediaOAuth1()` in `lib/twitter/api.ts`

```typescript
// lib/twitter/api.ts (lines 455-820)
export async function uploadMediaOAuth1(
  consumerKey: string,      // From TWITTER_API_KEY env var
  consumerSecret: string,   // From TWITTER_API_SECRET env var
  token: string,           // From database: twitterOAuth1Token
  tokenSecret: string,     // From database: twitterOAuth1TokenSecret
  imageUrl: string
): Promise<string>
```

**How tokens are used:**
1. **OAuth 1.0a Signature Generation:**
   ```typescript
   const { signature } = generateOAuth1Signature(
     'POST',
     uploadUrl,
     params,
     consumerKey,    // App credentials
     consumerSecret, // App credentials
     token,          // User's access token
     tokenSecret     // User's access token secret
   );
   ```

2. **Authorization Header:**
   ```typescript
   const authHeader = createOAuth1Header(
     consumerKey,
     token,        // User's access token
     signature,
     timestamp,
     nonce
   );
   ```

3. **API Request:**
   ```typescript
   await fetch('https://upload.twitter.com/1.1/media/upload.json', {
     method: 'POST',
     headers: {
       'Authorization': authHeader, // Contains token + signature
     },
     body: formData,
   });
   ```

## Token Security

### Current Implementation

1. **Storage:** Plain text in PostgreSQL database
2. **Access Control:** 
   - Only accessible via authenticated API routes
   - User can only access their own tokens (via Clerk authentication)
3. **Transmission:** 
   - Tokens only sent over HTTPS
   - Never exposed to client-side JavaScript
   - Only passed between server-side functions

### Security Considerations

⚠️ **Current Limitations:**
- Tokens stored as plain text (not encrypted at rest)
- No token rotation mechanism
- No automatic token expiration handling

✅ **Security Measures in Place:**
- Tokens only accessible via authenticated API routes
- User isolation (users can only access their own tokens)
- HTTPS-only transmission
- HTTP-only cookies for temporary request tokens
- Comprehensive logging for audit trail

## Token Validation

### Permission Verification

After storing tokens, we immediately verify they have write permissions:

```typescript
// app/api/twitter/oauth1/callback/route.ts (lines 289-331)
const verification = await verifyOAuth1TokenPermissions(
  consumerKey,
  consumerSecret,
  accessTokenData.oauth_token,
  accessTokenData.oauth_token_secret
);

if (!verification.hasWritePermissions) {
  // Clear tokens - they're read-only
  await prisma.user.update({
    where: { id: user.id },
    data: {
      twitterOAuth1Token: null,
      twitterOAuth1TokenSecret: null,
    },
  });
}
```

### Same Token Detection

We detect if Twitter returns the same token after reconnection (indicates permission issue):

```typescript
// app/api/twitter/oauth1/callback/route.ts (lines 212-227)
const existingUser = await prisma.user.findUnique({
  where: { id: user.id },
  select: {
    twitterOAuth1Token: true,
    twitterOAuth1TokenSecret: true,
  },
});

isSameToken = existingUser?.twitterOAuth1Token === accessTokenData.oauth_token;
if (isSameToken) {
  // Token didn't change - likely still read-only
  // Clear tokens and prompt user to revoke app access
}
```

## Token Cleanup

### Automatic Cleanup

Tokens are automatically cleared in these scenarios:

1. **Token Permission Error:**
   ```typescript
   // app/api/twitter/post-tweet/route.ts (lines 204-220)
   if (isTokenPermissionError && userId) {
     await prisma.user.update({
       where: { id: user.id },
       data: {
         twitterOAuth1Token: null,
         twitterOAuth1TokenSecret: null,
       },
     });
   }
   ```

2. **Read-Only Token Detected:**
   ```typescript
   // app/api/twitter/oauth1/callback/route.ts (lines 320-326)
   if (!verification.hasWritePermissions) {
     await prisma.user.update({
       where: { id: user.id },
       data: {
         twitterOAuth1Token: null,
         twitterOAuth1TokenSecret: null,
       },
     });
   }
   ```

3. **Before OAuth 1.0a Reconnection:**
   ```typescript
   // app/api/twitter/callback/route.ts (lines 178-185)
   // Clear existing tokens before reconnecting
   await prisma.user.update({
     where: { id: user.id },
     data: {
       twitterOAuth1Token: null,
       twitterOAuth1TokenSecret: null,
     },
   });
   ```

### Manual Cleanup

Users can manually disconnect via:
- **API Endpoint:** `DELETE /api/twitter/oauth1-tokens`
- **Frontend:** "Disconnect Twitter" button (if implemented)

## Token Dependencies

### Critical Relationship

OAuth 1.0a tokens are **cryptographically tied** to the consumer key/secret pair:

```
User Token + Consumer Key/Secret = Valid OAuth 1.0a Request
```

**Implications:**
1. If `TWITTER_API_KEY` or `TWITTER_API_SECRET` changes, **all existing tokens become invalid**
2. Tokens must be obtained using the **same consumer key/secret** that will be used for API calls
3. Regenerating API keys requires **all users to reconnect** to get new tokens

### Token-Key Matching

We verify tokens match the consumer key/secret:

```typescript
// Logging shows token and consumer key together
console.log('[Twitter OAuth1 Callback] Consumer Key:', consumerKey.substring(0, 20));
console.log('[Twitter OAuth1 Callback] Token:', accessTokenData.oauth_token.substring(0, 20));
console.log('[Twitter OAuth1 Callback] ⚠️  IMPORTANT: If consumer key/secret changes, these tokens will become invalid');
```

## Token Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER INITIATES OAUTH 1.0A FLOW                           │
│    GET /api/twitter/oauth1                                   │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. REQUEST TOKEN FROM TWITTER                                │
│    - Consumer Key/Secret from env vars                       │
│    - Request token returned                                  │
│    - Request token secret stored in HTTP-only cookie         │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. USER AUTHORIZES ON TWITTER                                │
│    Redirect: oauth/authorize?oauth_token={request_token}    │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. TWITTER CALLBACK                                          │
│    GET /api/twitter/oauth1/callback                           │
│    - oauth_token (request token)                             │
│    - oauth_verifier                                           │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. EXCHANGE FOR ACCESS TOKEN                                 │
│    - Request token + verifier → Access token                 │
│    - Twitter returns:                                        │
│      • oauth_token (access token)                            │
│      • oauth_token_secret (access token secret)              │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. STORE IN DATABASE                                         │
│    prisma.user.update({                                      │
│      twitterOAuth1Token: oauth_token,                        │
│      twitterOAuth1TokenSecret: oauth_token_secret           │
│    })                                                         │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. VERIFY PERMISSIONS                                        │
│    verifyOAuth1TokenPermissions()                            │
│    - If read-only: Clear tokens                              │
│    - If write: Keep tokens                                   │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. TOKEN READY FOR USE                                       │
│    - Stored in database                                      │
│    - Available for media uploads                            │
└─────────────────────────────────────────────────────────────┘
```

## Usage Flow (When Posting Tweet with Image)

```
┌─────────────────────────────────────────────────────────────┐
│ USER POSTS TWEET WITH IMAGE                                  │
│ POST /api/twitter/post-tweet                                 │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ RETRIEVE TOKENS FROM DATABASE                                │
│ prisma.user.findUnique({                                     │
│   twitterOAuth1Token,                                        │
│   twitterOAuth1TokenSecret                                   │
│ })                                                            │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ CALL uploadMediaOAuth1()                                     │
│ - Consumer Key/Secret (from env vars)                        │
│ - Access Token/Secret (from database)                        │
│ - Image URL                                                  │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ GENERATE OAUTH 1.0A SIGNATURE                               │
│ - Combine consumer key/secret + token/secret                 │
│ - Sign request with HMAC-SHA1                                │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ UPLOAD TO TWITTER                                            │
│ POST upload.twitter.com/1.1/media/upload.json               │
│ - Authorization header with signed request                    │
│ - Returns media_id                                          │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ POST TWEET WITH MEDIA_ID                                    │
│ POST api.twitter.com/2/tweets                                │
│ - OAuth 2.0 Bearer token (for posting)                     │
│ - media_ids: [media_id]                                      │
└─────────────────────────────────────────────────────────────┘
```

## Key Points

1. **Tokens are user-specific:** Each user has their own OAuth 1.0a tokens
2. **Tokens are tied to consumer key/secret:** Changing API keys invalidates all tokens
3. **Tokens stored in database:** Persisted in PostgreSQL for reuse
4. **Tokens never exposed to client:** Only used server-side
5. **Automatic cleanup:** Tokens cleared if permissions are wrong
6. **Custody chain verification:** Logging tracks tokens from Twitter → Database → Usage

## Troubleshooting

### Tokens Missing
- **Symptom:** `twitterOAuth1Token` is `null` in database
- **Solution:** User needs to complete OAuth 1.0a flow

### Tokens Invalid
- **Symptom:** "Bad Authentication data" (code 215)
- **Causes:**
  - Consumer key/secret changed but tokens not regenerated
  - Tokens lack write permissions
  - Token/secret mismatch
- **Solution:** Regenerate API keys, update env vars, have user reconnect

### Same Token Returned
- **Symptom:** Twitter returns same token after reconnection
- **Cause:** App permissions not actually "Read and write" in Developer Portal
- **Solution:** Set OAuth 1.0a permissions to "Read and write", regenerate API keys, have user revoke app access and reconnect

