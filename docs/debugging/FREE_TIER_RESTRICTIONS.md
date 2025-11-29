# Twitter API Free Tier and v1.1/v2 Access Restrictions

## Important: Apps Without Projects

**According to Twitter API documentation:**
> "v1.1 access for a restricted set of existing endpoints that connect to the X API. Apps without Projects are limited to this level."

This means:
- **Apps without Projects**: Only have access to v1.1 endpoints (restricted set)
- **Apps with Projects**: Have access to both v1.1 and v2 endpoints

## Question
Could the free subscription tier or lack of a Project be preventing OAuth 1.0a request_token or v2 endpoints from working?

## Analysis

### What We Know
1. **INIT/APPEND work** ✅ - These use OAuth 1.0a and work successfully
2. **Request Token fails** ❌ - Getting code 215 on `/oauth/request_token`
3. **OAuth 2.0 works** ✅ - Can post tweets using OAuth 2.0 (if you have v2 access)

### Twitter API Tiers (as of 2024)
- **Free Tier**: Limited access, primarily for testing
  - **Without Project**: Only v1.1 endpoints (restricted set)
  - **With Project**: v1.1 + v2 endpoints (but with strict rate limits)
- **Basic Tier**: $100/month - 50,000 post requests, 10,000 read requests
- **Enterprise Tier**: Custom pricing, higher limits

### Key Insight
**If INIT/APPEND work, then OAuth 1.0a is supported on your tier.**

The fact that INIT/APPEND work proves:
- ✅ OAuth 1.0a authentication is enabled for your app
- ✅ Your tier supports OAuth 1.0a endpoints
- ✅ Your credentials are valid

### Why Request Token Might Still Fail

Even though INIT/APPEND work, request_token might have different requirements:

1. **Endpoint-Specific Restrictions**
   - `/oauth/request_token` might require a higher tier
   - But this seems unlikely if other OAuth 1.0a endpoints work

2. **Rate Limiting**
   - Free tier might have stricter rate limits on request_token
   - But code 215 is "Bad Authentication", not rate limit (429)

3. **App-Level Restrictions**
   - Free tier apps might have restrictions on generating new tokens
   - But you should still be able to get request_token

## How to Check Your Tier and Project Status

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Click on your app (StoryWall)
3. Check the subscription/billing section
4. Look for your current tier (Free/Basic/Enterprise)
5. **Check if you have a Project**:
   - If you see "Projects" in the sidebar, you have a Project
   - If you only see "Apps" without Projects, you're limited to v1.1 endpoints
   - Apps without Projects cannot access v2 endpoints like `/2/tweets`

## Recommendation

**Check Your Project Status First**

1. **Do you have a Project?**
   - If NO: You're limited to v1.1 endpoints only
   - `/2/tweets` (v2) will NOT work - you'll get 403 Forbidden or similar errors
   - You can only use v1.1 endpoints like `/1.1/statuses/update.json`
   - **Solution**: Create a Project in Twitter Developer Portal to get v2 access

2. **If you have a Project but still hitting rate limits:**
   - Free tier with Project: ~50-150 POST /2/tweets per 15 minutes per user
   - Rate limits are per-user, not per-app
   - All apps using your Twitter account share the same rate limit
   - **Solution**: Check https://twitter.com/settings/apps and revoke unused apps

**Request Token Failure:**
Since INIT/APPEND work, your tier supports OAuth 1.0a. The request_token failure is likely:
- A Twitter API quirk specific to request_token
- An app-level configuration issue
- A callback URL validation issue
- Or related to Project/access level restrictions

## Next Steps

1. **Check if you have a Project** in Developer Portal
   - If NO: Create a Project to get v2 endpoint access
   - If YES: Continue troubleshooting rate limits

2. **Check your tier** in Developer Portal
3. **Look for restrictions** or warnings in app settings
4. **Check connected apps** at https://twitter.com/settings/apps
   - Revoke unused apps (they share your rate limit)
5. **Consider upgrading** to Basic tier if you're on Free (if budget allows)
6. **Contact Twitter Support** - Ask specifically about:
   - Project requirements for v2 endpoints
   - Free tier restrictions
   - Rate limit behavior

## Alternative: Use Existing Tokens

If you already have OAuth 1.0a tokens (from INIT/APPEND working), you might be able to:
- Reuse existing tokens instead of generating new ones
- But this requires tokens to already exist in the database

## Conclusion

**Key Points:**
- **Apps without Projects**: Limited to v1.1 endpoints only - `/2/tweets` will NOT work
- **Apps with Projects**: Can use both v1.1 and v2 endpoints
- INIT/APPEND work (proving OAuth 1.0a is supported for v1.1 endpoints)
- Code 215 is "Bad Authentication", not a tier restriction error
- Tier restrictions usually show different error codes (403 Forbidden for endpoint access)

**If you're getting 403 errors on `/2/tweets`:**
- You likely don't have a Project
- Create a Project in Twitter Developer Portal
- Or you're on a tier that doesn't support v2 endpoints

**If you're hitting rate limits:**
- Check your Project status
- Check connected apps at https://twitter.com/settings/apps
- Consider upgrading tier if budget allows

