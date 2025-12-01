# TikTok Demo Video Script & Checklist

## Video Requirements Summary
- **Length:** 2-5 minutes (show complete flow)
- **Format:** MP4 or MOV
- **Max size:** 50MB per file
- **Must show:** Complete end-to-end flow, UI interactions, actual website
- **Environment:** Use TikTok Developer Portal sandbox (if app not approved before)

---

## Video Script (Step-by-Step)

### **Part 1: Introduction & Context (0:00 - 0:30)**

**What to show:**
1. Open browser and navigate to your StoryWall website (e.g., `https://www.storywall.com` or your domain)
2. Show the homepage/landing page
3. Narrate: "This is StoryWall, a timeline creation platform. I'll demonstrate how users can create timeline slideshows and upload them directly to TikTok."

**Key points:**
- ✅ Website domain must match the URL you provided in the app submission
- ✅ Show the actual website, not a mockup

---

### **Part 2: Create/Select a Timeline (0:30 - 1:00)**

**What to show:**
1. Log in to StoryWall (or show an existing timeline)
2. Navigate to an existing timeline OR create a new timeline with events and images
3. Show the timeline with multiple events that have images
4. Narrate: "Here's a timeline with multiple events. Now I'll show how to create a TikTok slideshow from this timeline."

**Key points:**
- ✅ Show actual timeline content (events with images)
- ✅ Make sure timeline has at least 3-5 events with images for a good slideshow

---

### **Part 3: Generate TikTok Slideshow (1:00 - 2:00)**

**What to show:**
1. Navigate to the timeline detail page
2. Click on "Share" or navigate to `/timeline/[id]/share/tiktok`
3. Show the TikTok slideshow creation page
4. Show the preview of the slideshow (the "Preview" section)
5. Select "Video File" mode (not native TikTok mode)
6. Click "Generate Video" or show the generation process
7. Wait for video to generate (can speed up this part)
8. Show the generated video preview
9. Narrate: "I've generated a slideshow video from the timeline. Now I'll show how to upload it to TikTok."

**Key points:**
- ✅ Clearly show the UI elements
- ✅ Show the video generation process (can be sped up)
- ✅ Show the final video preview

---

### **Part 4: Connect TikTok Account (2:00 - 3:00)**

**What to show:**
1. On the slideshow page, look for "Post to TikTok" button
2. If not connected, show "Connect & Post" button
3. Click the button
4. **IMPORTANT:** Show the OAuth flow:
   - Redirect to TikTok authorization page
   - Show the authorization screen (can blur sensitive info)
   - Show the scopes being requested: `video.upload` and `user.info.basic`
   - Click "Authorize"
   - Redirect back to StoryWall
5. Show the profile page "Connected Accounts" section showing TikTok is connected
6. Narrate: "I've connected my TikTok account. Notice the scopes requested: video.upload and user.info.basic. Now I'm redirected back to StoryWall."

**Key points:**
- ✅ **CRITICAL:** Must show the OAuth authorization screen
- ✅ **CRITICAL:** Must clearly show the scopes: `video.upload` and `user.info.basic`
- ✅ Show the redirect back to StoryWall
- ✅ Show connection status in profile page

---

### **Part 5: Upload Video to TikTok (3:00 - 4:00)**

**What to show:**
1. Navigate back to the slideshow page (or refresh)
2. Show the "Post to TikTok" button (now enabled since connected)
3. Click "Post to TikTok" button
4. Show the upload progress indicator
5. Show the success message: "Video uploaded to TikTok! Check your TikTok inbox to finalize and post."
6. Narrate: "I'm uploading the video to my TikTok inbox. The video will appear there for me to review and post."

**Key points:**
- ✅ Show the upload progress
- ✅ Show the success message
- ✅ Explain that video goes to inbox (not auto-posted)

---

### **Part 6: Verify in TikTok (4:00 - 4:30)**

**What to show:**
1. Open TikTok app or website in a new tab
2. Navigate to TikTok inbox/notifications
3. Show the video in the inbox (if visible)
4. Narrate: "The video appears in my TikTok inbox where I can review it, add captions, and post it. This ensures I have full control over what gets posted."

**Key points:**
- ✅ If possible, show video in TikTok inbox
- ✅ If inbox isn't accessible in sandbox, at least show the success message and explain
- ✅ Emphasize user control

---

### **Part 7: Summary (4:30 - 5:00)**

**What to show:**
1. Return to StoryWall
2. Show the profile page with "Connected Accounts" showing TikTok connected
3. Narrate: "To summarize: Users create timelines on StoryWall, generate slideshow videos, connect their TikTok account via OAuth with video.upload and user.info.basic scopes, and upload videos to their TikTok inbox. All uploads are user-initiated and user-controlled."

**Key points:**
- ✅ Recap the complete flow
- ✅ Emphasize user control and compliance

---

## Checklist Before Recording

### Technical Setup
- [ ] Use TikTok Developer Portal sandbox environment (if app not approved)
- [ ] Ensure website domain matches the URL in app submission
- [ ] Test the complete flow before recording
- [ ] Have a timeline ready with events and images
- [ ] Clear browser cache and cookies for clean OAuth flow

### What Must Be Clearly Visible
- [ ] **Website domain/URL** - Must match submission
- [ ] **OAuth authorization screen** - Must show scopes: `video.upload` and `user.info.basic`
- [ ] **Content Publishing API usage** - Video upload initialization and upload
- [ ] **User interface** - All buttons, pages, and interactions
- [ ] **Upload progress** - Show the upload happening
- [ ] **Success confirmation** - Show video uploaded to inbox

### Scopes to Demonstrate
- [ ] **`video.upload`** - Show video being uploaded to TikTok inbox
- [ ] **`user.info.basic`** - Show connected account info in profile page

### Products to Demonstrate
- [ ] **Content Publishing API** - Show video upload flow

---

## Tips for Recording

1. **Screen Recording Software:**
   - Mac: QuickTime Player or ScreenFlow
   - Windows: OBS Studio or Camtasia
   - Browser: Loom or Screencastify

2. **Recording Settings:**
   - Resolution: 1920x1080 or 1280x720 (to keep file size down)
   - Frame rate: 30fps
   - Audio: Record narration explaining each step
   - Format: MP4 (H.264 codec)

3. **Editing Tips:**
   - Speed up long waiting periods (video generation)
   - Add text annotations if needed to highlight important parts
   - Keep OAuth flow in real-time (don't speed up)
   - Add arrows or highlights to show important UI elements

4. **File Size Optimization:**
   - If video is >50MB, compress it using HandBrake or similar
   - Target: 5-10MB per minute of video
   - Reduce resolution if needed (but keep it readable)

---

## Alternative: If TikTok Inbox Not Accessible in Sandbox

If you can't access the TikTok inbox in the sandbox environment, do this:

1. Show the upload success message clearly
2. Explain in narration: "The video has been uploaded to my TikTok inbox. In the sandbox environment, I cannot access the inbox, but in production, users will see the video in their TikTok app inbox where they can review and post it."
3. Show a screenshot or mockup of what the inbox would look like (clearly labeled as "example")

---

## Sample Narration Script

**Full narration you can use:**

"Hi, I'm demonstrating StoryWall's TikTok integration. StoryWall is a timeline creation platform where users create interactive timelines with events and images.

First, I'll show you a timeline I've created. It has multiple events with images. Now I'll navigate to the TikTok slideshow creation page.

I'll generate a slideshow video from this timeline. The video is optimized for TikTok's 9:16 format. [Wait for generation]

Great, the video is generated. Now I'll connect my TikTok account. I click 'Connect & Post' which redirects me to TikTok's authorization page.

Notice the scopes being requested: video.upload and user.info.basic. I'll authorize the connection. [Click authorize]

I'm redirected back to StoryWall, and my TikTok account is now connected. You can see this in my profile under 'Connected Accounts'.

Now I'll upload the video to TikTok. I click 'Post to TikTok' and the upload begins. [Show progress]

The upload is complete! The video has been uploaded to my TikTok inbox. Users will see it in their TikTok app where they can review it, add captions and hashtags, and post it. This ensures full user control - nothing is auto-posted.

To summarize: Users create timelines, generate slideshow videos, connect their TikTok account with video.upload and user.info.basic scopes, and upload videos to their TikTok inbox. All uploads are user-initiated and user-controlled."

---

## Final Checklist

Before submitting:
- [ ] Video shows complete end-to-end flow
- [ ] Website domain matches submission URL
- [ ] OAuth screen clearly shows both scopes
- [ ] Video upload process is visible
- [ ] UI and interactions are clear
- [ ] File is under 50MB
- [ ] Format is MP4 or MOV
- [ ] Video is 2-5 minutes long
- [ ] All selected products/scopes are demonstrated

