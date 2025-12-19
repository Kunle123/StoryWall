hat c# TikTok App Submission - Product and Scope Explanation

Use this response for the "Explain how each product and scope works within your app or website" question in the TikTok Developer Portal.

---

## Response:

### Product: Content Publishing API

**How it works in StoryWall:**

The Content Publishing API is used to enable users to upload slideshow videos generated from their timelines directly to their TikTok inbox. Here's the complete user flow:

1. **User creates a timeline** - Users create interactive timelines with events, descriptions, and images on StoryWall
2. **User generates slideshow** - Users navigate to the "Create TikTok Slideshow" feature and generate a video slideshow (9:16 format, optimized for TikTok) from their timeline content
3. **User initiates upload** - User clicks "Post to TikTok" button on the slideshow page
4. **OAuth authorization** - If not already connected, user is redirected to TikTok OAuth to authorize StoryWall
5. **Video upload initialization** - StoryWall calls the Content Publishing API `/v2/post/publish/inbox/video/init/` endpoint to initialize the upload and receive an upload URL and publish_id
6. **Video file upload** - StoryWall uploads the video file to the provided upload URL using a PUT request
7. **Video appears in TikTok inbox** - The video appears in the user's TikTok inbox where they can review, add captions/hashtags, and post it

**Why we need it:**
- Allows users to seamlessly share their timeline stories on TikTok
- Streamlines the content creation and sharing workflow
- Videos are uploaded to user's inbox (not auto-posted), giving users full control

---

### Scope: `video.upload`

**How it works in StoryWall:**

The `video.upload` scope is used to upload slideshow videos to the user's TikTok inbox via the Content Publishing API.

**Specific implementation:**
- When a user clicks "Post to TikTok" after generating a slideshow, StoryWall calls our backend API endpoint (`/api/tiktok/post-video`)
- This endpoint uses the user's stored TikTok access token (obtained during OAuth) to call TikTok's `/v2/post/publish/inbox/video/init/` endpoint
- TikTok returns an upload URL and publish_id
- StoryWall then uploads the video file to the provided upload URL
- The video appears in the user's TikTok inbox for them to finalize and post

**Where in the app:**
- Used in the TikTok slideshow page (`/timeline/[id]/share/tiktok`)
- Triggered when user clicks "Post to TikTok" button
- Only works after user has connected their TikTok account via OAuth

**Why we need it:**
- Essential for the core functionality of uploading timeline slideshows to TikTok
- Without this scope, users would have to manually download and upload videos, defeating the purpose of the integration
- All uploads are user-initiated and user-controlled

---

### Scope: `user.info.basic`

**How it works in StoryWall:**

The `user.info.basic` scope is used to display the connected TikTok account information to the user, providing transparency about which account is connected.

**Specific implementation:**
- After OAuth authorization, StoryWall receives the user's `open_id` which is stored in our database
- This information is used to:
  - Display connection status in the user's profile page ("Connected Accounts" section)
  - Show which TikTok account is connected
  - Verify that the user has successfully connected their TikTok account before allowing video uploads

**Where in the app:**
- Displayed in the user profile page (`/profile`) under "Connected Accounts" section
- Used to check connection status before allowing "Post to TikTok" functionality
- Shows a checkmark icon when TikTok is connected, or prompts user to connect if not connected

**Why we need it:**
- Provides user transparency about which TikTok account is connected
- Helps users verify their connection status
- Enables us to show appropriate UI (connect button vs. post button) based on connection status
- Improves user experience by clearly indicating account connection state

---

### Summary

All products and scopes are used exclusively for user-initiated content sharing. Users create timelines on StoryWall, generate slideshow videos from their own content, and choose to upload those videos to their TikTok inbox. Videos are never auto-posted - they appear in the user's TikTok inbox where they must manually review and post them. This ensures full user control and compliance with TikTok's guidelines.

