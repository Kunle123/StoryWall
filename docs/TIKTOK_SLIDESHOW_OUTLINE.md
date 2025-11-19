# TikTok Slideshow Video Generation - Implementation Outline

## Overview
Generate downloadable slideshow videos from timeline images that users can manually upload to TikTok. This feature will create a video file combining timeline images with text overlays, transitions, optional background music, and **voiceover narration**.

---

## 1. Technical Approach

### Option A: Client-Side Generation (Recommended for MVP)
- **Pros**: 
  - No server load
  - Fast for users
  - No storage costs
  - Privacy-friendly (all processing in browser)
- **Cons**: 
  - Limited by browser capabilities
  - May be slower for long timelines
  - Requires modern browser

**Libraries:**
- `ffmpeg.wasm` - WebAssembly FFmpeg for video encoding in browser
- `html2canvas` - Convert timeline cards to images (if needed)
- `remotion` (alternative) - React-based video generation

### Option B: Server-Side Generation
- **Pros**: 
  - More reliable/consistent
  - Better performance for long videos
  - Can use full FFmpeg features
- **Cons**: 
  - Server load and costs
  - Storage for temporary files
  - Longer processing time

**Libraries:**
- `fluent-ffmpeg` (Node.js)
- `sharp` - Image processing
- `canvas` - Text rendering

### Recommendation: **Start with Client-Side (Option A)**

---

## 2. Voiceover Options

### Can We Use TikTok's Voiceover?
**No** - TikTok doesn't provide an API for programmatically adding voiceover. Users must add voiceover manually in the TikTok app after uploading.

### Solution: Add Voiceover Before Upload
We can generate voiceover narration and embed it in the video file, so users get a complete video ready to upload.

### Text-to-Speech (TTS) API Options

#### Option 1: OpenAI TTS API (Recommended)
- **Model**: `tts-1` (standard) or `tts-1-hd` (higher quality)
- **Voices**: `alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`
- **Pricing**: 
  - `tts-1`: $15 per 1M characters (~$0.015 per 1K characters)
  - `tts-1-hd`: $30 per 1M characters (~$0.030 per 1K characters)
- **Pros**: 
  - High quality, natural voices
  - Easy integration
  - Good pricing
  - Fast generation
- **Cons**: 
  - Requires API key
  - Costs per character
- **Best for**: Most use cases, good balance of quality and cost

#### Option 2: ElevenLabs
- **Pricing**: 
  - Free tier: 10,000 characters/month
  - Starter ($5/month): 30,000 characters
  - Creator ($22/month): 100,000 characters
  - Pro ($99/month): 500,000 characters
- **Pros**: 
  - Very high quality, human-like voices
  - Many voice options
  - Voice cloning available (paid)
- **Cons**: 
  - More expensive
  - Character limits on lower tiers
- **Best for**: Premium quality when budget allows

#### Option 3: Google Cloud Text-to-Speech
- **Pricing**: 
  - Standard voices: $4 per 1M characters
  - WaveNet voices: $16 per 1M characters
- **Pros**: 
  - Very affordable (standard voices)
  - Many languages/voices
  - Reliable Google infrastructure
- **Cons**: 
  - Standard voices less natural than OpenAI/ElevenLabs
  - WaveNet more expensive
- **Best for**: Budget-conscious, multi-language support

#### Option 4: Browser Web Speech API (Free)
- **API**: `window.speechSynthesis`
- **Pros**: 
  - Completely free
  - No API calls
  - No character limits
- **Cons**: 
  - Lower quality (robotic)
  - Limited voice options
  - Browser-dependent
  - May not work on all browsers
- **Best for**: MVP/testing, free option

### Recommendation: **OpenAI TTS API**
- Best balance of quality, price, and reliability
- Easy to integrate
- Good voice options
- Reasonable cost (~$0.015 per 1K characters)

**Cost Estimate**: 
- Average timeline description: ~500 characters per event
- 10 events = ~5,000 characters = ~$0.075 per slideshow
- Very affordable for users

### Voiceover Generation Flow

1. **Extract Text**: 
   - Timeline title
   - Event titles
   - Event descriptions (optional, can be shortened)
   - Timeline description (optional)

2. **Generate Script**:
   - Combine into natural narration script
   - Example: "Welcome to [Timeline Title]. Let's explore [Event 1 Title]..."
   - Can be AI-generated for better flow

3. **Generate Audio**:
   - Call TTS API with script
   - Receive MP3/WAV audio file
   - Duration should match video duration

4. **Sync with Video**:
   - Align audio with image transitions
   - Ensure narration matches current slide
   - Add pauses between events if needed

5. **Combine Audio + Video**:
   - Use FFmpeg to merge audio track with video
   - Adjust audio levels
   - Export final MP4 with embedded audio

### Implementation Notes

- **Script Generation**: Can use GPT to create natural narration from timeline data
- **Timing**: Audio duration should match video duration (or slightly shorter)
- **Pauses**: Add 0.5-1 second pauses between event narrations
- **Volume**: Normalize audio levels for consistent volume
- **Format**: Generate as MP3 or WAV, then embed in MP4

---

## 3. TikTok Video Requirements

### Technical Specs
- **Format**: MP4 (H.264 video codec, AAC audio codec)
- **Aspect Ratio**: 
  - Vertical: 9:16 (1080x1920px) - **Most common for slideshows**
  - Horizontal: 16:9 (1920x1080px)
  - Square: 1:1 (1080x1080px)
- **Duration**: 15 seconds to 10 minutes (slideshows typically 30-60 seconds)
- **File Size**: Max 287MB
- **Frame Rate**: 30fps recommended
- **Resolution**: Minimum 720p, recommended 1080p

### Content Guidelines
- Each slide should be visible for 2-5 seconds
- Text should be readable (large, high contrast)
- Transitions should be smooth
- Consider adding captions/subtitles

---

## 4. Implementation Steps

### Step 1: Create TikTok Slideshow Dialog Component
**File**: `components/timeline/TikTokSlideshowDialog.tsx`

Similar to `TwitterThreadDialog.tsx`, but for video generation:

```typescript
interface TikTokSlideshowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timelineTitle: string;
  timelineDescription?: string;
  events: TimelineEvent[];
}

// Features:
// - Preview of slideshow settings
// - Duration per slide selector (2-5 seconds)
// - Aspect ratio selector (9:16, 16:9, 1:1)
// - Transition style selector (fade, slide, zoom)
// - Text overlay options (title, date, description)
// - Background music toggle
// - "Generate Video" button
// - Download button (appears after generation)
// - Progress indicator during generation
```

### Step 2: Add Share Option to Bottom Menu Bar
**File**: `components/layout/ExperimentalBottomMenuBar.tsx`

Add "Share as TikTok Slideshow" option to the share popover (alongside "Share Link" and "Share as Twitter Thread").

### Step 3: Image Preparation
**File**: `lib/utils/tiktokSlideshow.ts`

```typescript
// Functions needed:
- fetchAndPrepareImages(events: TimelineEvent[]): Promise<ImageData[]>
  // Download images from Cloudinary URLs
  // Resize/crop to target aspect ratio
  // Ensure consistent dimensions

- addTextOverlay(image: ImageData, text: string, position: 'top' | 'bottom'): ImageData
  // Add text overlay to image
  // Use readable font (Arial, Helvetica, etc.)
  // High contrast (white text with black outline, or vice versa)
  // Position at top or bottom to avoid TikTok UI overlap

- createSlide(image: ImageData, duration: number): VideoSegment
  // Create a video segment from an image
  // Apply transition effects
```

### Step 4: Video Generation (Client-Side)
**File**: `lib/utils/tiktokSlideshow.ts` (continued)

```typescript
// Using ffmpeg.wasm:
- generateSlideshowVideo(
    slides: VideoSegment[],
    options: SlideshowOptions
  ): Promise<Blob>
  
  // Steps:
  1. Load ffmpeg.wasm
  2. Write images to virtual file system
  3. Create FFmpeg command:
     - Input: sequence of images
     - Output: MP4 with H.264 codec
     - Duration: sum of slide durations
     - Frame rate: 30fps
     - Resolution: based on aspect ratio
  4. Execute FFmpeg
  5. Return video blob
  6. Create download link

// Slideshow Options:
interface SlideshowOptions {
  aspectRatio: '9:16' | '16:9' | '1:1';
  durationPerSlide: number; // seconds
  transition: 'fade' | 'slide' | 'zoom' | 'none';
  showTitle: boolean;
  showDate: boolean;
  showDescription: boolean;
  textPosition: 'top' | 'bottom';
  backgroundColor?: string;
  backgroundMusic?: boolean; // Future: add music
}
```

### Step 5: FFmpeg.wasm Setup
**File**: `lib/utils/ffmpegSetup.ts`

```typescript
// Initialize FFmpeg.wasm
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

const ffmpeg = createFFmpeg({
  log: true,
  corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'
});

export async function initFFmpeg() {
  if (!ffmpeg.isLoaded()) {
    await ffmpeg.load();
  }
  return ffmpeg;
}
```

### Step 6: Image Download & Processing
**File**: `lib/utils/tiktokSlideshow.ts`

```typescript
// Download images from Cloudinary
async function downloadImage(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to download image');
  return await response.blob();
}

// Resize image to target aspect ratio
async function resizeImage(
  imageBlob: Blob,
  aspectRatio: '9:16' | '16:9' | '1:1'
): Promise<Blob> {
  // Use Canvas API to:
  // 1. Load image
  // 2. Calculate crop/resize dimensions
  // 3. Draw to canvas with correct aspect ratio
  // 4. Export as blob
}
```

### Step 7: Text Overlay Rendering
**File**: `lib/utils/tiktokSlideshow.ts`

```typescript
// Add text to image using Canvas
async function addTextOverlay(
  imageBlob: Blob,
  text: string,
  position: 'top' | 'bottom',
  fontSize: number = 48
): Promise<Blob> {
  // 1. Create canvas
  // 2. Draw image
  // 3. Add semi-transparent background for text (optional)
  // 4. Draw text with:
  //    - Large, readable font
  //    - High contrast (white with black stroke)
  //    - Position at top or bottom
  // 5. Export as blob
}
```

### Step 8: FFmpeg Command Generation
**File**: `lib/utils/tiktokSlideshow.ts`

```typescript
// Generate FFmpeg command for slideshow
function generateFFmpegCommand(
  imageFiles: string[],
  durations: number[],
  outputPath: string,
  options: SlideshowOptions
): string[] {
  // FFmpeg filter complex for:
  // - Image sequence input
  // - Duration per image
  // - Transitions (fade, slide, zoom)
  // - Resolution/scaling
  // - Frame rate
  
  // Example command structure:
  // ffmpeg -framerate 1/3 -i img%03d.jpg -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2" -c:v libx264 -pix_fmt yuv420p output.mp4
}
```

### Step 9: Download & Share Flow
**File**: `components/timeline/TikTokSlideshowDialog.tsx`

```typescript
// After video generation:
1. Create blob URL from video blob
2. Create download link with filename: `${timelineTitle}-tiktok-slideshow.mp4`
3. Show download button
4. Optionally: Open TikTok upload page with instructions
5. Show toast: "Video ready! Download and upload to TikTok"
```

---

## 5. UI/UX Flow

### User Journey:
1. User views timeline
2. Clicks share button (dial) → "Share as TikTok Slideshow"
3. Dialog opens with:
   - Preview of timeline events (first 10-15)
   - Settings:
     - Duration per slide: 2-5 seconds (slider)
     - Aspect ratio: 9:16 (default), 16:9, 1:1
     - Transition: Fade (default), Slide, Zoom, None
     - Text overlay: Toggle title, date, description
     - Text position: Top or Bottom
     - **Voiceover**: Toggle "Add voiceover narration"
     - **Voice selection**: Dropdown (if enabled)
     - **Script preview**: Show/edit generated narration (if enabled)
   - "Generate Video" button
4. User clicks "Generate Video"
   - Progress indicator shows:
     - "Downloading images..."
     - "Processing images..."
     - "Generating narration script..." (if voiceover enabled)
     - "Creating voiceover..." (if voiceover enabled)
     - "Generating video..."
     - "Merging audio..." (if voiceover enabled)
     - "Finalizing..."
5. Video ready:
   - Preview player (small)
   - Download button (large, prominent)
   - "Open TikTok" button (opens TikTok upload page)
   - Instructions: "Download the video, then upload it to TikTok"

### Loading States:
- Initial: Settings visible, "Generate" button enabled
- Generating: Settings disabled, progress bar, "Generating..." text
- Complete: Download button visible, settings still visible (for regeneration)

---

## 6. Technical Considerations

### Performance:
- **Limit events**: For long timelines, limit to first 15-20 events (or let user select)
- **Image optimization**: Use Cloudinary transformations to get appropriately sized images
- **Progressive loading**: Show progress as images download
- **Error handling**: Handle failed image downloads gracefully

### Browser Compatibility:
- **ffmpeg.wasm**: Requires modern browser (Chrome, Firefox, Safari 14+)
- **Canvas API**: Widely supported
- **File API**: Widely supported
- **Fallback**: If ffmpeg.wasm fails, show error with manual instructions

### File Size:
- **Optimization**: Use appropriate bitrate for TikTok
- **Compression**: FFmpeg H.264 encoding with reasonable quality settings
- **Warning**: If video > 100MB, warn user it may be slow to generate

### CORS Issues:
- **Cloudinary images**: Should be CORS-enabled (check Cloudinary settings)
- **Fallback**: If CORS fails, may need server-side proxy

---

## 7. Dependencies to Add

```json
{
  "@ffmpeg/ffmpeg": "^0.12.0",
  "@ffmpeg/util": "^0.12.0",
  "openai": "^4.47.1"  // Already installed, for TTS API
}
```

**Note**: ffmpeg.wasm is large (~30MB). Consider:
- Lazy loading (only load when dialog opens)
- Show loading indicator while FFmpeg initializes
- Consider CDN hosting for faster loads

---

## 8. Alternative: Server-Side Generation (Future)

If client-side proves too slow/unreliable:

### API Endpoint:
**File**: `app/api/timeline/[id]/tiktok-slideshow/route.ts`

```typescript
// POST /api/timeline/[id]/tiktok-slideshow
// Body: { options: SlideshowOptions }
// Response: { videoUrl: string, expiresAt: Date }

// Process:
1. Fetch timeline events
2. Download images from Cloudinary
3. Process images (resize, add text)
4. Generate video with fluent-ffmpeg
5. Upload to Cloudinary (temporary, 24h expiry)
6. Return video URL
```

**Pros**: More reliable, faster for long videos
**Cons**: Server costs, storage, processing time

---

## 9. Testing Checklist

- [ ] Generate slideshow with 5 events
- [ ] Generate slideshow with 20 events
- [ ] Test all aspect ratios (9:16, 16:9, 1:1)
- [ ] Test all transitions (fade, slide, zoom, none)
- [ ] Test text overlay options (title, date, description)
- [ ] Test with timeline that has missing images
- [ ] Test download functionality
- [ ] Test on mobile browser
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Verify video plays in TikTok app after upload
- [ ] Test with very long timeline (50+ events) - should limit or warn

---

## 10. Future Enhancements

1. **Background Music**: Add royalty-free music options
2. **Custom Branding**: Add StoryWall watermark (optional)
3. **Auto-upload**: If TikTok API becomes available
4. **Template Styles**: Different visual styles (minimal, bold, etc.)
5. **Animation**: Animate text appearance
6. **Filters**: Apply TikTok-style filters to images
7. **Batch Generation**: Generate multiple aspect ratios at once

---

## 11. File Structure

```
components/
  timeline/
    TikTokSlideshowDialog.tsx    # Main dialog component
    TikTokSlideshowPreview.tsx    # Preview component (optional)

lib/
  utils/
    tiktokSlideshow.ts           # Core generation logic
    ffmpegSetup.ts               # FFmpeg initialization
    imageProcessing.ts            # Image download/resize/overlay

app/
  api/
    timeline/
      [id]/
        tiktok-slideshow/
          route.ts               # Server-side endpoint (future)
```

---

## 12. Estimated Implementation Time

- **Dialog Component**: 2-3 hours
- **Image Processing**: 3-4 hours
- **FFmpeg Integration**: 4-5 hours
- **Text Overlay**: 2-3 hours
- **Voiceover Integration**: 4-6 hours
  - TTS API integration
  - Script generation
  - Audio synchronization
  - Audio/video merging
- **UI Polish**: 2-3 hours
- **Testing & Bug Fixes**: 3-4 hours

**Total**: ~20-28 hours (with voiceover)

---

## 13. Resources

- [FFmpeg.wasm Documentation](https://ffmpegwasm.netlify.app/)
- [TikTok Video Specs](https://support.tiktok.com/en/using-tiktok/creating-videos/video-specs)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Cloudinary Image Transformations](https://cloudinary.com/documentation/image_transformations)
- [OpenAI TTS API](https://platform.openai.com/docs/guides/text-to-speech)
- [ElevenLabs API](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Google Cloud TTS](https://cloud.google.com/text-to-speech/docs)

---

## 14. Voiceover Implementation Details

### API Endpoint for TTS
**File**: `app/api/ai/generate-voiceover/route.ts`

```typescript
// POST /api/ai/generate-voiceover
// Body: { script: string, voice?: string }
// Response: { audioUrl: string, duration: number }

// Process:
1. Validate script length
2. Call OpenAI TTS API (or selected provider)
3. Store audio file temporarily (Cloudinary or S3)
4. Return audio URL and duration
5. Clean up after 24 hours
```

### Script Generation
**File**: `lib/utils/tiktokSlideshow.ts`

```typescript
// Generate natural narration script from timeline
function generateNarrationScript(
  timelineTitle: string,
  timelineDescription: string,
  events: TimelineEvent[]
): string {
  // Option 1: Simple concatenation
  // "Welcome to [Title]. [Event 1 Title]. [Event 2 Title]..."
  
  // Option 2: AI-generated (better flow)
  // Use GPT to create natural narration
  // "Join us as we explore [Title]. First, we'll discover [Event 1]..."
}

// Or use GPT to generate script:
async function generateNarrationWithGPT(
  timelineTitle: string,
  events: TimelineEvent[]
): Promise<string> {
  // Call GPT with prompt:
  // "Create a natural, engaging narration script for a TikTok slideshow
  //  about [timelineTitle]. Include [events]. Keep it concise and engaging."
}
```

### Audio Synchronization
**File**: `lib/utils/tiktokSlideshow.ts`

```typescript
// Sync audio with video slides
function calculateSlideTimings(
  events: TimelineEvent[],
  audioDuration: number,
  durationPerSlide: number
): SlideTiming[] {
  // Distribute audio across slides
  // Ensure narration matches current slide
  // Add pauses between events
  // Return array of { startTime, endTime, eventIndex }
}
```

### FFmpeg Audio Merging
**File**: `lib/utils/tiktokSlideshow.ts`

```typescript
// Merge audio with video using FFmpeg
async function mergeAudioWithVideo(
  videoBlob: Blob,
  audioBlob: Blob,
  options: SlideshowOptions
): Promise<Blob> {
  // FFmpeg command:
  // ffmpeg -i video.mp4 -i audio.mp3 -c:v copy -c:a aac -shortest output.mp4
  // -shortest: End when shortest stream ends
  // -c:v copy: Copy video codec (no re-encoding)
  // -c:a aac: Encode audio as AAC (TikTok compatible)
}
```

### UI Options for Voiceover

In `TikTokSlideshowDialog.tsx`:
- **Toggle**: "Add voiceover narration" (checkbox)
- **Voice Selection**: Dropdown (if multiple voices available)
- **Script Preview**: Show generated script (editable?)
- **Audio Preview**: Play generated audio before video generation
- **Volume Control**: Slider for voiceover volume (0-100%)

---

## 15. Next Steps

1. **Decision**: Client-side (MVP) or server-side?
2. **Prototype**: Create basic slideshow with 3 images
3. **Test**: Verify FFmpeg.wasm works in target browsers
4. **Implement**: Build full feature following this outline
5. **Test**: Upload generated video to TikTok to verify compatibility

