import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { initFFmpeg } from './ffmpegSetup';
import { SlideshowOptions } from './tiktokSlideshow';

/**
 * Generate slideshow video from images using FFmpeg
 */
export async function generateSlideshowVideo(
  images: Blob[],
  options: SlideshowOptions,
  audioBlob?: Blob
): Promise<Blob> {
  console.log('[generateSlideshowVideo] Starting video generation', {
    imageCount: images.length,
    aspectRatio: options.aspectRatio,
    durationPerSlide: options.durationPerSlide,
    hasAudio: !!audioBlob,
    audioSize: audioBlob ? audioBlob.size : 0,
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
    
    // Video filter: scale, pad, then fps to duplicate frames
    // With input framerate 1/duration, timestamps are already spaced correctly
    // fps filter duplicates frames to fill gaps at output framerate
    // Lower output fps (10 instead of 15) reduces total frames to encode
    const outputFps = 10; // Lower fps for faster encoding
    const scaleFilter = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`;
    const fpsFilter = `fps=${outputFps}`; // Duplicate frames to reach output fps
    const vf = `${scaleFilter},${fpsFilter}`;
    console.log('[generateSlideshowVideo] Video filter:', vf);
    console.log('[generateSlideshowVideo] Output FPS:', outputFps);
    command.push('-vf', vf);
    
    // Set output frame rate
    command.push('-r', outputFps.toString());
    
    // Use larger GOP (group of pictures) to reduce keyframes and improve compression
    // This makes frames reference each other more efficiently
    command.push('-g', (outputFps * duration).toString()); // One keyframe per image duration
    command.push('-keyint_min', (outputFps * duration).toString());
    
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

