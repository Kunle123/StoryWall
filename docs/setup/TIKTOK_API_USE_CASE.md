# TikTok API Use Case Description

Use this description when applying for TikTok API access in the TikTok Developer Portal.

## Application Overview

**Application Name:** StoryWall  
**Website:** https://www.storywall.com  
**Type:** Web Application  
**Category:** Content Creation & Sharing Platform

## Use Case Description

StoryWall is a collaborative timeline platform that allows users to create, share, and discover interactive visual timelines. Users can build rich timelines on various topics (historical events, personal journeys, project milestones, artist careers, etc.) with events, descriptions, and AI-generated images.

### Primary Use Case: Timeline Slideshow Sharing to TikTok

**What we do:**
- Users create rich, interactive timelines with events, descriptions, and images
- Users can generate slideshow videos from their timelines optimized for TikTok's 9:16 format
- Users can upload these slideshow videos directly to their TikTok inbox
- Videos appear in the user's TikTok inbox where they can finalize, add captions, and post

**Why TikTok integration is essential:**
- TikTok is a primary distribution channel for our users to share their timeline stories
- Slideshow format allows users to share longer-form content (timelines) in an engaging, visual way
- Direct upload to TikTok inbox streamlines the sharing process
- Users maintain full control - videos go to their inbox for final review before posting

### Specific TikTok API Features We Use

1. **Content Publishing API - Video Upload**
   - Initialize video uploads to user's TikTok inbox
   - Upload slideshow videos generated from user timelines
   - Videos are uploaded to user's inbox (not auto-posted) for user review and finalization
   - Supports user-controlled privacy settings

2. **OAuth 2.0 Authentication**
   - Secure user authentication and authorization
   - Token-based access for video uploads
   - Automatic token refresh to maintain connections

### User Flow

1. User creates a timeline in StoryWall with events, descriptions, and images
2. User navigates to "Create TikTok Slideshow" feature
3. User generates a slideshow video from their timeline (9:16 format, optimized for TikTok)
4. User clicks "Post to TikTok" button
5. User authorizes StoryWall to upload videos on their behalf (OAuth 2.0)
6. StoryWall initializes video upload and uploads the slideshow video
7. Video appears in user's TikTok inbox
8. User opens TikTok app, reviews the video, adds caption/hashtags, and posts

### Technical Implementation

- **OAuth 2.0:** Used for user authentication and authorization
- **Content Publishing API:** Used to upload videos to user's TikTok inbox
- **User-specific tokens:** Each user authorizes their own account
- **No automated posting:** Videos are uploaded to inbox only - users must finalize and post from TikTok app
- **Privacy-first:** Users maintain full control over what gets posted

### Data Handling

- **User tokens:** Stored securely in encrypted database
- **No data collection:** We don't collect or store TikTok user data beyond authentication tokens
- **User control:** Users can revoke access at any time via TikTok settings
- **Privacy:** All uploads are opt-in and user-controlled
- **Video content:** Videos are generated from user's own timeline content

### Compliance

- ✅ All uploads are user-initiated (no automated posting without user action)
- ✅ Users explicitly authorize each connection
- ✅ Users can revoke access at any time
- ✅ Videos are uploaded to user's inbox (not auto-posted) - users must finalize in TikTok app
- ✅ We follow TikTok's Terms of Service and API guidelines
- ✅ No spam or automated bulk posting
- ✅ All content is user-generated from their own timelines

## Requested Permissions

**OAuth 2.0 Scopes:**
- `video.upload` - Upload videos to user's TikTok inbox
- `user.info.basic` - Display connected TikTok account information

## Expected Usage

- **User base:** Growing community of timeline creators
- **Upload frequency:** User-initiated, typically 1-3 slideshow videos per user per week
- **Video format:** 9:16 vertical format, optimized for TikTok
- **Video length:** 15-60 seconds per slideshow (varies by timeline length)
- **Content type:** Educational, historical, biographical, and creative timeline stories

## Content Guidelines

- All videos are generated from user-created timeline content
- Users own all content they create and upload
- No automated content generation or scraping
- All uploads require explicit user action and authorization
- Videos are educational/informational timeline stories, not promotional content

