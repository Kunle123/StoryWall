import { TimelineEvent } from "@/components/timeline/Timeline";
import { formatEventDate } from "./dateFormat";

export interface SlideshowOptions {
  aspectRatio: '9:16' | '16:9' | '1:1';
  durationPerSlide: number; // seconds
  transition: 'fade' | 'slide' | 'zoom' | 'none';
  showTitle: boolean;
  showDate: boolean;
  showDescription: boolean;
  textPosition: 'top' | 'bottom';
  backgroundColor?: string;
  addVoiceover: boolean;
  voice?: string;
}

export interface SlideTiming {
  startTime: number;
  endTime: number;
  eventIndex: number;
}

/**
 * Generate a natural narration script from timeline data
 */
export function generateNarrationScript(
  timelineTitle: string,
  timelineDescription: string | undefined,
  events: TimelineEvent[]
): string {
  let script = `Welcome to ${timelineTitle}.`;
  
  if (timelineDescription) {
    const shortDesc = timelineDescription.length > 200
      ? timelineDescription.substring(0, 200) + '...'
      : timelineDescription;
    script += ` ${shortDesc}`;
  }
  
  script += ' Let\'s explore the key moments.';
  
  events.forEach((event, index) => {
    if (index < 15) { // Limit to first 15 events for narration
      script += ` ${event.title}.`;
      if (event.description && event.description.length < 100) {
        script += ` ${event.description}`;
      }
    }
  });
  
  script += ' Thanks for watching!';
  
  return script;
}

/**
 * Calculate slide timings based on events and audio duration
 */
export function calculateSlideTimings(
  events: TimelineEvent[],
  audioDuration: number,
  durationPerSlide: number
): SlideTiming[] {
  const timings: SlideTiming[] = [];
  let currentTime = 0;
  
  events.forEach((event, index) => {
    const startTime = currentTime;
    const endTime = currentTime + durationPerSlide;
    
    timings.push({
      startTime,
      endTime,
      eventIndex: index,
    });
    
    currentTime = endTime;
  });
  
  return timings;
}

/**
 * Download image from URL and return as blob
 */
export async function downloadImage(url: string): Promise<Blob> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    return await response.blob();
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
}

/**
 * Resize image to target aspect ratio using Canvas API
 */
export async function resizeImage(
  imageBlob: Blob,
  aspectRatio: '9:16' | '16:9' | '1:1'
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageBlob);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width: number, height: number;
      
      // Calculate dimensions based on aspect ratio
      switch (aspectRatio) {
        case '9:16': // Vertical (TikTok)
          width = 1080;
          height = 1920;
          break;
        case '16:9': // Horizontal
          width = 1920;
          height = 1080;
          break;
        case '1:1': // Square
          width = 1080;
          height = 1080;
          break;
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // Fill background (black by default)
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
      
      // Calculate scaling to fit image while maintaining aspect ratio
      const imgAspect = img.width / img.height;
      const targetAspect = width / height;
      
      let drawWidth: number, drawHeight: number, offsetX: number, offsetY: number;
      
      if (imgAspect > targetAspect) {
        // Image is wider - fit to height
        drawHeight = height;
        drawWidth = height * imgAspect;
        offsetX = (width - drawWidth) / 2;
        offsetY = 0;
      } else {
        // Image is taller - fit to width
        drawWidth = width;
        drawHeight = width / imgAspect;
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
      }
      
      // Draw image centered
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      
      // Convert to blob
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      }, 'image/jpeg', 0.9);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * Add text overlay to image
 */
export async function addTextOverlay(
  imageBlob: Blob,
  text: string,
  position: 'top' | 'bottom',
  fontSize: number = 48
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageBlob);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // Draw original image
      ctx.drawImage(img, 0, 0);
      
      // Prepare text
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = position === 'top' ? 'top' : 'bottom';
      
      // Calculate text position
      const x = canvas.width / 2;
      const y = position === 'top' ? 40 : canvas.height - 40;
      
      // Add semi-transparent background for text readability
      const textMetrics = ctx.measureText(text);
      const textWidth = textMetrics.width;
      const textHeight = fontSize;
      const padding = 20;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(
        x - textWidth / 2 - padding,
        y - (position === 'top' ? 0 : textHeight) - padding,
        textWidth + padding * 2,
        textHeight + padding * 2
      );
      
      // Draw text with white color and black stroke for contrast
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeText(text, x, y);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(text, x, y);
      
      // Convert to blob
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      }, 'image/jpeg', 0.9);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * Prepare images for slideshow
 */
export async function prepareImagesForSlideshow(
  events: TimelineEvent[],
  options: SlideshowOptions
): Promise<Blob[]> {
  const preparedImages: Blob[] = [];
  const eventsToProcess = events.slice(0, 20); // Limit to 20 events
  
  for (const event of eventsToProcess) {
    if (!event.image) {
      // Skip events without images
      continue;
    }
    
    try {
      // Download image
      const imageBlob = await downloadImage(event.image);
      
      // Resize to target aspect ratio
      let processedImage = await resizeImage(imageBlob, options.aspectRatio);
      
      // Add text overlay if needed
      if (options.showTitle || options.showDate || options.showDescription) {
        let overlayText = '';
        
        if (options.showTitle) {
          overlayText = event.title;
        }
        
        if (options.showDate && event.year) {
          const dateStr = formatEventDate(event);
          overlayText += overlayText ? ` - ${dateStr}` : dateStr;
        }
        
        if (options.showDescription && event.description) {
          const shortDesc = event.description.length > 100
            ? event.description.substring(0, 100) + '...'
            : event.description;
          overlayText += overlayText ? `\n${shortDesc}` : shortDesc;
        }
        
        if (overlayText) {
          processedImage = await addTextOverlay(
            processedImage,
            overlayText,
            options.textPosition
          );
        }
      }
      
      preparedImages.push(processedImage);
    } catch (error) {
      console.error(`Error processing image for event ${event.title}:`, error);
      // Continue with other images even if one fails
    }
  }
  
  return preparedImages;
}

