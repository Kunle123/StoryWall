import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { initFFmpeg } from './ffmpegSetup';
import { SlideshowOptions } from './tiktokSlideshow';

/**
 * Generate a video segment from a single image with specific duration
 */
async function generateImageSegment(
  ffmpeg: FFmpeg,
  imageBlob: Blob,
  imageIndex: number,
  duration: number,
  width: number,
  height: number,
  outputFps: number
): Promise<string> {
  const imageFileName = `img${imageIndex.toString().padStart(3, '0')}.jpg`;
  const outputFileName = `seg${imageIndex.toString().padStart(3, '0')}.mp4`;
  
  // Write image to filesystem
  const imageData = await fetchFile(imageBlob);
  await ffmpeg.writeFile(imageFileName, imageData);
  
  // Generate video segment: use single frame, loop it for duration
  // No need to encode multiple frames - just one frame extended for the duration
  // This is much more efficient than encoding duplicate frames
  const command = [
    '-loop', '1',           // Loop the single image
    '-framerate', '1',      // Input framerate (1 frame from image)
    '-i', imageFileName,
    '-vf', `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
    '-t', duration.toString(),  // Duration to show this frame
    '-r', '1',              // Output 1 frame per second (minimal, just for compatibility)
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'ultrafast',
    '-crf', '23',
    '-g', '1',              // GOP of 1 (one keyframe) since it's a single static frame
    '-keyint_min', '1',
    '-y',
    outputFileName
  ];
  
  await ffmpeg.exec(command);
  
  // Clean up image file
  await ffmpeg.deleteFile(imageFileName);
  
  return outputFileName;
}

/**
 * Generate video with per-image durations by creating segments and concatenating
 */
async function generateVideoWithPerImageDurations(
  ffmpeg: FFmpeg,
  images: Blob[],
  perImageDurations: number[],
  width: number,
  height: number,
  outputFps: number,
  audioBlob?: Blob
): Promise<Blob> {
  console.log('[generateVideoWithPerImageDurations] Generating video segments with per-image durations');
  
  // Ensure we have a duration for each image
  const durations = perImageDurations.slice(0, images.length);
  while (durations.length < images.length) {
    durations.push(durations[durations.length - 1] || 3); // Use last duration or default to 3
  }
  
  // Generate individual video segments - each segment matches its corresponding audio duration
  const segmentFiles: string[] = [];
  for (let i = 0; i < images.length; i++) {
    console.log(`[generateVideoWithPerImageDurations] Generating segment ${i + 1}/${images.length} (duration: ${durations[i]}s) - this slide will match audio segment ${i + 1}`);
    const segmentFile = await generateImageSegment(
      ffmpeg,
      images[i],
      i,
      durations[i],
      width,
      height,
      outputFps
    );
    segmentFiles.push(segmentFile);
    console.log(`[generateVideoWithPerImageDurations] Segment ${i + 1} created with duration ${durations[i]}s`);
  }
  
  // Create concat file for video segments
  const concatList: string[] = [];
  segmentFiles.forEach(file => {
    concatList.push(`file '${file}'`);
  });
  const concatFileContent = concatList.join('\n');
  await ffmpeg.writeFile('video_concat.txt', concatFileContent);
  console.log('[generateVideoWithPerImageDurations] Created video concat file');
  
  // Concatenate video segments
  const command: string[] = [
    '-f', 'concat',
    '-safe', '0',
    '-i', 'video_concat.txt',
  ];
  
  // Calculate total video duration from per-image durations
  const totalVideoDuration = durations.reduce((sum, d) => sum + d, 0);
  console.log('[generateVideoWithPerImageDurations] Total video duration:', totalVideoDuration, 'seconds');
  console.log('[generateVideoWithPerImageDurations] Per-image durations:', durations);
  
  // Add audio if provided
  if (audioBlob) {
    const audioData = await fetchFile(audioBlob);
    await ffmpeg.writeFile('audio.mp3', audioData);
    command.push('-i', 'audio.mp3');
  }
  
  // Video codec settings
  command.push('-c:v', 'libx264');
  command.push('-pix_fmt', 'yuv420p');
  command.push('-preset', 'ultrafast');
  command.push('-crf', '23');
  
  // Audio codec settings (if audio provided)
  if (audioBlob) {
    command.push('-c:a', 'aac');
    command.push('-b:a', '128k');
    // Video segments are created with durations matching audio segments
    // Since they're concatenated in the same order, they should sync perfectly
    // Use -shortest to handle any minor timing differences gracefully
    command.push('-shortest');
    console.log('[generateVideoWithPerImageDurations] Using -shortest to sync video and audio');
  }
  
  command.push('-y', 'output.mp4');
  
  console.log('[generateVideoWithPerImageDurations] Concatenating segments with audio');
  await ffmpeg.exec(command);
  
  // Read output file
  const data = await ffmpeg.readFile('output.mp4');
  if (!data) {
    throw new Error('Output file is empty or does not exist');
  }
  
  // Clean up
  segmentFiles.forEach(file => ffmpeg.deleteFile(file).catch(() => {}));
  await ffmpeg.deleteFile('video_concat.txt').catch(() => {});
  if (audioBlob) {
    await ffmpeg.deleteFile('audio.mp3').catch(() => {});
  }
  await ffmpeg.deleteFile('output.mp4').catch(() => {});
  
  // Convert to blob
  if (data instanceof Uint8Array) {
    const arrayBuffer = new Uint8Array(data).buffer;
    return new Blob([arrayBuffer], { type: 'video/mp4' });
  } else {
    return new Blob([data], { type: 'video/mp4' });
  }
}

/**
 * Generate slideshow video from images using FFmpeg
 * If perImageDurations is provided, each image will use its corresponding duration
 */
export async function generateSlideshowVideo(
  images: Blob[],
  options: SlideshowOptions,
  audioBlob?: Blob,
  perImageDurations?: number[]
): Promise<Blob> {
  console.log('[generateSlideshowVideo] Starting video generation', {
    imageCount: images.length,
    aspectRatio: options.aspectRatio,
    durationPerSlide: options.durationPerSlide,
    hasAudio: !!audioBlob,
    audioSize: audioBlob ? audioBlob.size : 0,
    hasPerImageDurations: !!perImageDurations,
  });

  if (images.length === 0) {
    console.error('[generateSlideshowVideo] No images provided');
    throw new Error('No images provided');
  }

  console.log('[generateSlideshowVideo] Initializing FFmpeg...');
  const ffmpeg = await initFFmpeg();
  console.log('[generateSlideshowVideo] FFmpeg initialized successfully');
  
  // Set up error and log handlers
  const ffmpegErrors: string[] = [];
  const ffmpegLogs: string[] = [];
  
  ffmpeg.on('log', ({ message }) => {
    console.log('[FFmpeg log]', message);
    ffmpegLogs.push(message);
  });
  
  // Calculate dimensions
  let width: number, height: number;
  switch (options.aspectRatio) {
    case '9:16':
      width = 1080;
      height = 1920;
      break;
    case '16:9':
      width = 1920;
      height = 1080;
      break;
    case '1:1':
      width = 1080;
      height = 1080;
      break;
  }

  // Use minimal fps (1fps) - we're encoding one frame per slide, not multiple duplicate frames
  // Each slide is a single static frame extended for its duration
  const outputFps = 1; // Minimal fps - one frame per slide

  // If per-image durations are provided, use segment-based approach
  if (perImageDurations && perImageDurations.length > 0) {
    console.log('[generateSlideshowVideo] Using per-image duration approach');
    // FFmpeg is already initialized above
    return await generateVideoWithPerImageDurations(
      ffmpeg,
      images,
      perImageDurations,
      width,
      height,
      outputFps,
      audioBlob
    );
  }

  // Build FFmpeg command (declare outside try block for error handling)
  const duration = options.durationPerSlide;
  const totalDuration = duration * images.length;
  const command: string[] = [];

  console.log('[generateSlideshowVideo] Calculated dimensions and duration', {
    width,
    height,
    duration,
    totalDuration,
  });

  try {
    // Write images to FFmpeg's virtual file system
    console.log('[generateSlideshowVideo] Writing images to FFmpeg virtual filesystem...');
    for (let i = 0; i < images.length; i++) {
      const imageFileName = `image${i.toString().padStart(3, '0')}.jpg`;
      console.log(`[generateSlideshowVideo] Processing image ${i + 1}/${images.length}: ${imageFileName} (size: ${images[i].size} bytes)`);
      try {
        const imageData = await fetchFile(images[i]);
        console.log(`[generateSlideshowVideo] Fetched image data for ${imageFileName}, size: ${imageData instanceof Uint8Array ? imageData.length : 'unknown'}`);
        await ffmpeg.writeFile(imageFileName, imageData);
        console.log(`[generateSlideshowVideo] Successfully wrote ${imageFileName} to FFmpeg filesystem`);
      } catch (imageError: any) {
        console.error(`[generateSlideshowVideo] Failed to process image ${i + 1}:`, {
          fileName: imageFileName,
          error: imageError?.message || imageError?.toString(),
          stack: imageError?.stack,
        });
        throw new Error(`Failed to process image ${i + 1}: ${imageError?.message || 'Unknown error'}`);
      }
    }
    console.log(`[generateSlideshowVideo] Successfully wrote all ${images.length} images to FFmpeg filesystem`);

    // Write audio if provided
    if (audioBlob) {
      console.log('[generateSlideshowVideo] Writing audio to FFmpeg virtual filesystem...', {
        audioSize: audioBlob.size,
        audioType: audioBlob.type,
      });
      try {
        const audioData = await fetchFile(audioBlob);
        console.log('[generateSlideshowVideo] Fetched audio data, size:', audioData instanceof Uint8Array ? audioData.length : 'unknown');
        await ffmpeg.writeFile('audio.mp3', audioData);
        console.log('[generateSlideshowVideo] Successfully wrote audio.mp3 to FFmpeg filesystem');
      } catch (audioError: any) {
        console.error('[generateSlideshowVideo] Failed to process audio:', {
          error: audioError?.message || audioError?.toString(),
          stack: audioError?.stack,
        });
        throw new Error(`Failed to process audio: ${audioError?.message || 'Unknown error'}`);
      }
    } else {
      console.log('[generateSlideshowVideo] No audio provided, skipping audio processing');
    }

    // Build FFmpeg command
    console.log('[generateSlideshowVideo] Building FFmpeg command...');
    
    // Use image2 input with sequence pattern - reads all images as a sequence
    // Input framerate: 1/duration (so each image is read at the right rate)
    // This means each image is read once, then fps filter duplicates frames to fill gaps
    const inputFramerate = 1 / duration;
    console.log('[generateSlideshowVideo] Using image sequence input with efficient frame duplication');
    console.log('[generateSlideshowVideo] Input framerate:', inputFramerate, 'fps (1 image per', duration, 'seconds)');
    command.push('-framerate', inputFramerate.toString());
    command.push('-i', 'image%03d.jpg'); // Standard FFmpeg sequence pattern: image000.jpg, image001.jpg, etc.
    
    // Add audio input if provided (must come after video input)
    if (audioBlob) {
      console.log('[generateSlideshowVideo] Adding audio input to command');
      command.push('-i', 'audio.mp3');
    }
    
    // Video filter: scale and pad only - no fps filter needed
    // We're encoding one frame per image, extended for its duration
    // No need to duplicate frames since each image is static
    const outputFps = 1; // Minimal fps - one frame per slide
    const scaleFilter = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`;
    const vf = scaleFilter; // No fps filter - we want one frame per image
    console.log('[generateSlideshowVideo] Video filter:', vf);
    console.log('[generateSlideshowVideo] Output FPS:', outputFps);
    command.push('-vf', vf);
    
    // Set output frame rate
    command.push('-r', outputFps.toString());
    
    // Use GOP of 1 - one keyframe per image (since each image is a single static frame)
    // This is the most efficient for static content
    command.push('-g', '1'); // One keyframe per image
    command.push('-keyint_min', '1');
    
    // Video codec settings - use faster preset for better performance
    command.push('-c:v', 'libx264');
    command.push('-pix_fmt', 'yuv420p');
    command.push('-preset', 'ultrafast'); // Changed from 'medium' to 'ultrafast' for speed
    command.push('-crf', '23');
    
    // Audio codec settings (if audio provided)
    if (audioBlob) {
      console.log('[generateSlideshowVideo] Adding audio codec settings');
      command.push('-c:a', 'aac');
      command.push('-b:a', '128k');
      command.push('-shortest'); // End when shortest stream ends
    } else {
      // No audio - set duration explicitly
      console.log('[generateSlideshowVideo] No audio - setting duration', {
        duration: totalDuration,
      });
      command.push('-t', totalDuration.toString());
    }
    
    // Output file
    command.push('-y'); // Overwrite output file if it exists
    command.push('output.mp4');

    const commandString = command.join(' ');
    console.log('[generateSlideshowVideo] Complete FFmpeg command:', commandString);
    console.log('[generateSlideshowVideo] Command array length:', command.length);

    // Execute FFmpeg
    console.log('[generateSlideshowVideo] Executing FFmpeg command...');
    const execStartTime = Date.now();
    try {
      await ffmpeg.exec(command);
      const execDuration = Date.now() - execStartTime;
      console.log(`[generateSlideshowVideo] FFmpeg command executed successfully in ${execDuration}ms`);
      console.log('[generateSlideshowVideo] FFmpeg logs (last 10):', ffmpegLogs.slice(-10));
    } catch (execError: any) {
      const execDuration = Date.now() - execStartTime;
      console.error('[generateSlideshowVideo] FFmpeg exec error:', {
        error: execError,
        message: execError?.message,
        name: execError?.name,
        stack: execError?.stack,
        duration: execDuration,
        command: commandString,
        logs: ffmpegLogs.slice(-20),
      });
      const errorMsg = execError?.message || execError?.toString() || 'FFmpeg execution failed';
      throw new Error(`FFmpeg exec failed: ${errorMsg}. Logs: ${ffmpegLogs.slice(-10).join('; ')}`);
    }

    // Read output file
    console.log('[generateSlideshowVideo] Reading output file from FFmpeg filesystem...');
    let data;
    try {
      data = await ffmpeg.readFile('output.mp4');
      if (!data) {
        console.error('[generateSlideshowVideo] Output file is null or undefined');
        throw new Error('Output file is empty or does not exist');
      }
      const dataSize = data instanceof Uint8Array ? data.length : (typeof data === 'string' ? data.length : 'unknown');
      const dataType = data instanceof Uint8Array ? 'Uint8Array' : typeof data;
      console.log('[generateSlideshowVideo] Output file read successfully', {
        size: dataSize,
        type: dataType,
      });
    } catch (readError: any) {
      console.error('[generateSlideshowVideo] Failed to read output file:', {
        error: readError,
        message: readError?.message,
        name: readError?.name,
        stack: readError?.stack,
        logs: ffmpegLogs.slice(-10),
      });
      throw new Error(`Failed to read output file: ${readError?.message || 'Unknown error'}. FFmpeg logs: ${ffmpegLogs.slice(-10).join('; ')}`);
    }
    
    // Clean up
    console.log('[generateSlideshowVideo] Cleaning up FFmpeg filesystem...');
    try {
      for (let i = 0; i < images.length; i++) {
        const imageFileName = `image${i.toString().padStart(3, '0')}.jpg`;
        await ffmpeg.deleteFile(imageFileName);
      }
      if (audioBlob) {
        await ffmpeg.deleteFile('audio.mp3');
      }
      await ffmpeg.deleteFile('output.mp4');
      console.log('[generateSlideshowVideo] Cleanup completed successfully');
    } catch (cleanupError: any) {
      console.warn('[generateSlideshowVideo] Cleanup error (non-fatal):', cleanupError?.message);
      // Don't throw - cleanup errors are not critical
    }

    // Convert to blob - FileData can be Uint8Array or string
    console.log('[generateSlideshowVideo] Converting output to Blob...');
    try {
      if (data instanceof Uint8Array) {
        // For binary data (MP4), create a new ArrayBuffer from the Uint8Array
        // This ensures we have a proper ArrayBuffer (not SharedArrayBuffer)
        const arrayBuffer = new Uint8Array(data).buffer;
        const blob = new Blob([arrayBuffer], { type: 'video/mp4' });
        console.log('[generateSlideshowVideo] Successfully created Blob from Uint8Array', {
          blobSize: blob.size,
          blobType: blob.type,
        });
        return blob;
      } else {
        // If it's a string (shouldn't happen for binary files), convert to blob
        console.warn('[generateSlideshowVideo] Output data is not Uint8Array, treating as string');
        const blob = new Blob([data], { type: 'video/mp4' });
        console.log('[generateSlideshowVideo] Successfully created Blob from string', {
          blobSize: blob.size,
          blobType: blob.type,
        });
        return blob;
      }
    } catch (blobError: any) {
      console.error('[generateSlideshowVideo] Failed to create Blob:', {
        error: blobError,
        message: blobError?.message,
        dataType: data instanceof Uint8Array ? 'Uint8Array' : typeof data,
        dataSize: data instanceof Uint8Array ? data.length : 'unknown',
      });
      throw new Error(`Failed to create Blob: ${blobError?.message || 'Unknown error'}`);
    }
  } catch (error: any) {
    console.error('[generateSlideshowVideo] Error generating video:', {
      error,
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
      toString: error?.toString(),
    });
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    const errorDetails = {
      message: errorMessage,
      stack: error?.stack,
      name: error?.name,
      command: command.join(' '),
      commandLength: command.length,
      imagesCount: images.length,
      hasAudio: !!audioBlob,
      aspectRatio: options.aspectRatio,
      durationPerSlide: options.durationPerSlide,
      ffmpegLogs: ffmpegLogs.slice(-20),
      ffmpegErrors: ffmpegErrors.slice(-10),
    };
    console.error('[generateSlideshowVideo] Video generation error details:', JSON.stringify(errorDetails, null, 2));
    throw new Error(`Failed to generate video: ${errorMessage}`);
  }
}

/**
 * Download audio from URL and return as blob
 */
export async function downloadAudio(url: string): Promise<Blob> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download audio: ${response.statusText}`);
    }
    return await response.blob();
  } catch (error) {
    console.error('Error downloading audio:', error);
    throw error;
  }
}

/**
 * Combine multiple audio segments into a single audio file using FFmpeg
 */
export async function combineAudioSegments(audioUrls: string[]): Promise<Blob> {
  if (audioUrls.length === 0) {
    throw new Error('No audio URLs provided');
  }
  
  if (audioUrls.length === 1) {
    // Single audio, just download it
    return await downloadAudio(audioUrls[0]);
  }
  
  console.log('[combineAudioSegments] Combining', audioUrls.length, 'audio segments');
  const ffmpeg = await initFFmpeg();
  
  try {
    // Download all audio segments
    const audioBlobs: Blob[] = [];
    for (let i = 0; i < audioUrls.length; i++) {
      console.log(`[combineAudioSegments] Downloading segment ${i + 1}/${audioUrls.length}`);
      const blob = await downloadAudio(audioUrls[i]);
      audioBlobs.push(blob);
    }
    
    // Write audio files to FFmpeg filesystem
    for (let i = 0; i < audioBlobs.length; i++) {
      const fileName = `audio${i.toString().padStart(3, '0')}.mp3`;
      const audioData = await fetchFile(audioBlobs[i]);
      await ffmpeg.writeFile(fileName, audioData);
      console.log(`[combineAudioSegments] Wrote ${fileName} to FFmpeg filesystem`);
    }
    
    // Create concat file list
    const concatList: string[] = [];
    for (let i = 0; i < audioBlobs.length; i++) {
      concatList.push(`file 'audio${i.toString().padStart(3, '0')}.mp3'`);
    }
    const concatFileContent = concatList.join('\n');
    await ffmpeg.writeFile('audio_concat.txt', concatFileContent);
    console.log('[combineAudioSegments] Created concat file list');
    
    // Use FFmpeg concat demuxer to combine audio
    const command = [
      '-f', 'concat',
      '-safe', '0',
      '-i', 'audio_concat.txt',
      '-c', 'copy', // Copy codec (no re-encoding for speed)
      '-y',
      'combined_audio.mp3'
    ];
    
    console.log('[combineAudioSegments] Executing FFmpeg concat command');
    await ffmpeg.exec(command);
    
    // Read combined audio
    const data = await ffmpeg.readFile('combined_audio.mp3');
    if (!data) {
      throw new Error('Combined audio file is empty');
    }
    
    // Clean up
    for (let i = 0; i < audioBlobs.length; i++) {
      const fileName = `audio${i.toString().padStart(3, '0')}.mp3`;
      await ffmpeg.deleteFile(fileName);
    }
    await ffmpeg.deleteFile('audio_concat.txt');
    await ffmpeg.deleteFile('combined_audio.mp3');
    
    // Convert to blob
    if (data instanceof Uint8Array) {
      const arrayBuffer = new Uint8Array(data).buffer;
      return new Blob([arrayBuffer], { type: 'audio/mpeg' });
    } else {
      return new Blob([data], { type: 'audio/mpeg' });
    }
  } catch (error: any) {
    console.error('[combineAudioSegments] Error combining audio:', error);
    throw new Error(`Failed to combine audio segments: ${error.message || 'Unknown error'}`);
  }
}

