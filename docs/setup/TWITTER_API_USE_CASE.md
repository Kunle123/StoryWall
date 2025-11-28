# Twitter API Use Case Description

Use this description when applying for Twitter API access.

## Application Overview

**Application Name:** StoryWall  
**Website:** https://www.storywall.com  
**Type:** Web Application

## Use Case Description

StoryWall is a collaborative timeline platform that allows users to create, share, and discover interactive timelines. Users can build timelines on various topics (historical events, personal journeys, project milestones, etc.) and share them with the community.

### Primary Use Case: Timeline Sharing to Twitter

**What we do:**
- Users create rich, interactive timelines with events, descriptions, and images
- Users can share their timelines to Twitter/X as formatted tweet threads
- Each timeline can be converted into a multi-tweet thread that tells a cohesive story
- Images from timelines are automatically attached to tweets when shared

**Why Twitter integration is essential:**
- Twitter/X is a primary distribution channel for our users to share their timelines
- Thread format allows users to share longer-form content (timelines) in an engaging way
- Image attachments enhance the storytelling experience
- Automated posting saves users time compared to manual copying/pasting

### Specific Twitter API Features We Use

1. **Post Tweets (OAuth 2.0)**
   - Post individual tweets with text content
   - Post multi-tweet threads (replies to create thread chains)
   - Rate limit: ~300 tweets per 15 minutes per user (well within limits)

2. **Upload Media/Images (OAuth 1.0a)**
   - Upload images to attach to tweets
   - Required for visual storytelling in timeline shares
   - Uses Twitter's v1.1 media upload endpoint (requires OAuth 1.0a)

3. **Read User Information (OAuth 2.0)**
   - Verify user authentication status
   - Display connected Twitter account information

### User Flow

1. User creates a timeline in StoryWall with events, descriptions, and images
2. User clicks "Share as Twitter Thread" button
3. User authorizes StoryWall to post on their behalf (OAuth 2.0 + OAuth 1.0a)
4. StoryWall formats the timeline into a tweet thread
5. StoryWall uploads images using OAuth 1.0a media upload endpoint
6. StoryWall posts the thread using OAuth 2.0 tweet creation endpoint
7. Thread appears on user's Twitter/X timeline

### Technical Implementation

- **OAuth 2.0:** Used for posting tweets (Twitter API v2)
- **OAuth 1.0a:** Required for media uploads (Twitter API v1.1)
- **User-specific tokens:** Each user authorizes their own account
- **No automated/bot posting:** All posts are user-initiated and user-authorized
- **Rate limiting:** Built-in delays between tweets to respect API limits

### Data Handling

- **User tokens:** Stored securely in encrypted database
- **No data collection:** We don't collect or store Twitter user data beyond authentication tokens
- **User control:** Users can revoke access at any time via Twitter settings
- **Privacy:** All posting is opt-in and user-controlled

### Compliance

- ✅ All posts are user-initiated (no automated posting without user action)
- ✅ Users explicitly authorize each connection
- ✅ Users can revoke access at any time
- ✅ We respect Twitter's rate limits
- ✅ We follow Twitter's Terms of Service and API guidelines
- ✅ No spam or automated bulk posting

## Requested Permissions

**OAuth 2.0 Scopes:**
- `tweet.read` - Verify tweet posting status
- `tweet.write` - Post tweets and threads
- `users.read` - Display connected account information
- `offline.access` - Maintain connection for future posts
- `media.write` - Upload images (though OAuth 1.0a is required for actual uploads)

**OAuth 1.0a Permissions:**
- Read and write permissions (required for media upload endpoint)

## Expected Usage

- **User base:** Growing community of timeline creators
- **Posting frequency:** User-initiated, typically 1-5 threads per user per day
- **Thread length:** 2-20 tweets per thread (varies by timeline length)
- **Image uploads:** 0-1 images per thread (when timeline includes images)

## Why This Benefits Twitter/X

- Encourages quality, long-form content creation
- Brings new users to Twitter/X who want to share their timelines
- Creates engaging thread content that drives engagement
- All content is user-generated and authentic
- No spam or automated content generation

---

**Note:** This use case is for a legitimate web application that enhances user content creation and sharing. All Twitter API usage is user-authorized and user-initiated.

