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
  if (images.length === 0) {
    throw new Error('No images provided');
  }

  const ffmpeg = await initFFmpeg();
  
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

  try {
    // Write images to FFmpeg's virtual file system
    for (let i = 0; i < images.length; i++) {
      const imageData = await fetchFile(images[i]);
      await ffmpeg.writeFile(`image${i.toString().padStart(3, '0')}.jpg`, imageData);
    }

    // Write audio if provided
    if (audioBlob) {
      const audioData = await fetchFile(audioBlob);
      await ffmpeg.writeFile('audio.mp3', audioData);
    }

    // Build FFmpeg command
    const duration = options.durationPerSlide;
    const totalDuration = duration * images.length;
    
    // Build command array
    const command: string[] = [];
    
    // Input: image sequence
    command.push('-framerate', (1 / duration).toString());
    command.push('-i', 'image%03d.jpg');
    
    // Video filter: scale and pad to target dimensions
    const vf = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,fps=30`;
    command.push('-vf', vf);
    
    // Video codec settings
    command.push('-c:v', 'libx264');
    command.push('-pix_fmt', 'yuv420p');
    command.push('-preset', 'medium');
    command.push('-crf', '23');
    
    // Add audio if provided
    if (audioBlob) {
      command.push('-i', 'audio.mp3');
      command.push('-c:a', 'aac');
      command.push('-b:a', '128k');
      command.push('-shortest'); // End when shortest stream ends
    } else {
      // No audio - set duration
      command.push('-t', totalDuration.toString());
    }
    
    // Output file
    command.push('output.mp4');

    // Execute FFmpeg
    await ffmpeg.exec(command);

    // Read output file
    const data = await ffmpeg.readFile('output.mp4');
    
    // Clean up
    for (let i = 0; i < images.length; i++) {
      await ffmpeg.deleteFile(`image${i.toString().padStart(3, '0')}.jpg`);
    }
    if (audioBlob) {
      await ffmpeg.deleteFile('audio.mp3');
    }
    await ffmpeg.deleteFile('output.mp4');

    // Convert to blob - FileData can be Uint8Array or string
    if (data instanceof Uint8Array) {
      // For binary data (MP4), create a new ArrayBuffer from the Uint8Array
      // This ensures we have a proper ArrayBuffer (not SharedArrayBuffer)
      const arrayBuffer = new Uint8Array(data).buffer;
      return new Blob([arrayBuffer], { type: 'video/mp4' });
    } else {
      // If it's a string (shouldn't happen for binary files), convert to blob
      return new Blob([data], { type: 'video/mp4' });
    }
  } catch (error: any) {
    console.error('Error generating video:', error);
    throw new Error(`Failed to generate video: ${error.message}`);
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

