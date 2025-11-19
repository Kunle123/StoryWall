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
 * Generate a natural narration script from timeline data (single combined script)
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
 * Generate narration script for a single event (fallback - use AI endpoint for better results)
 */
export function generateEventNarrationScript(
  event: TimelineEvent,
  isFirst: boolean = false,
  isLast: boolean = false
): string {
  let script = '';
  
  if (isFirst) {
    script += `Let's begin with `;
  }
  
  script += `${event.title}.`;
  
  if (event.description) {
    // Use full description - no truncation
    script += ` ${event.description}`;
  }
  
  if (isLast) {
    script += ' Thanks for watching!';
  }
  
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
 * Wrap text to fit within a maximum width
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine + ' ' + word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);
  return lines;
}

/**
 * Add dial overlay to image showing the date
 */
export async function addDialOverlay(
  imageBlob: Blob,
  event: TimelineEvent,
  aspectRatio: '9:16' | '16:9' | '1:1'
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
      
      // Calculate dial size based on image dimensions (smaller for slides)
      const dialSize = Math.min(img.width, img.height) * 0.15; // 15% of smaller dimension
      const radius = dialSize / 2 - 4;
      const centerX = img.width - dialSize / 2 - 20; // Top right corner with padding
      const centerY = dialSize / 2 + 20; // Top right corner with padding
      
      // Draw dial background circle
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 4, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw dial circle
      ctx.strokeStyle = '#FF6B35'; // Orange accent
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Draw arc (270 degrees from -225° to +45°)
      const startAngle = -225;
      const endAngle = 45;
      const totalRange = endAngle - startAngle;
      const timelinePosition = 0.5; // Middle position for slides
      const currentAngle = startAngle + totalRange * timelinePosition;
      
      const toRadians = (deg: number) => (deg * Math.PI) / 180;
      const polarToCartesian = (angle: number) => ({
        x: centerX + radius * Math.cos(toRadians(angle)),
        y: centerY + radius * Math.sin(toRadians(angle))
      });
      
      const start = polarToCartesian(startAngle);
      const end = polarToCartesian(currentAngle);
      
      // Draw progress arc
      ctx.strokeStyle = '#FF6B35';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, toRadians(startAngle), toRadians(currentAngle), false);
      ctx.stroke();
      
      // Format date for dial
      let dateText = '';
      if (event.number !== undefined) {
        dateText = event.number.toString();
      } else if (event.year) {
        if (event.day && event.month) {
          const monthName = new Date(event.year, event.month - 1, event.day).toLocaleDateString('en-US', { month: 'short' });
          dateText = `${monthName}\n${event.day}\n${event.year}`;
        } else if (event.month) {
          const monthName = new Date(event.year, event.month - 1).toLocaleDateString('en-US', { month: 'short' });
          dateText = `${monthName}\n${event.year}`;
        } else {
          dateText = event.year.toString();
        }
      }
      
      // Draw date text in center of dial
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${Math.max(12, dialSize * 0.15)}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const dateLines = dateText.split('\n');
      const lineHeight = dialSize * 0.2;
      const startY = centerY - (dateLines.length - 1) * lineHeight / 2;
      
      dateLines.forEach((line, index) => {
        ctx.fillText(line, centerX, startY + index * lineHeight);
      });
      
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
 * Add text overlay to image with text wrapping
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
      
      // Calculate maximum text width (80% of canvas width with padding)
      const maxTextWidth = canvas.width * 0.8;
      const padding = 20;
      const lineHeight = fontSize * 1.2; // Line height with spacing
      
      // Split text into lines (handle newlines and wrapping)
      const textLines: string[] = [];
      const paragraphs = text.split('\n');
      paragraphs.forEach(paragraph => {
        const wrapped = wrapText(ctx, paragraph, maxTextWidth);
        textLines.push(...wrapped);
      });
      
      // Calculate total text height
      const totalTextHeight = textLines.length * lineHeight;
      
      // Calculate text position
      const x = canvas.width / 2;
      const y = position === 'top' 
        ? 40 + padding 
        : canvas.height - 40 - totalTextHeight - padding;
      
      // Add semi-transparent background for text readability
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(
        x - maxTextWidth / 2 - padding,
        y - padding,
        maxTextWidth + padding * 2,
        totalTextHeight + padding * 2
      );
      
      // Draw each line of text with white color and black stroke for contrast
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.fillStyle = '#FFFFFF';
      
      textLines.forEach((line, index) => {
        const lineY = y + (index * lineHeight);
        ctx.strokeText(line, x, lineY);
        ctx.fillText(line, x, lineY);
      });
      
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
      
      // Always show title, and add text overlay if needed
      // Title is always shown, date and description are optional
      let overlayText = '';
      
      // Always include title
      overlayText = event.title;
      
      if (options.showDate && event.year) {
        const dateStr = formatEventDate(event.year, event.month, event.day);
        overlayText += ` - ${dateStr}`;
      }
      
      if (options.showDescription && event.description) {
        // Show full description - no truncation
        overlayText += `\n${event.description}`;
      }
      
      if (overlayText) {
        processedImage = await addTextOverlay(
          processedImage,
          overlayText,
          options.textPosition
        );
      }
      
      // Add dial visualization showing the date
      if (event.year) {
        processedImage = await addDialOverlay(
          processedImage,
          event,
          options.aspectRatio
        );
      }
      
      preparedImages.push(processedImage);
    } catch (error) {
      console.error(`Error processing image for event ${event.title}:`, error);
      // Continue with other images even if one fails
    }
  }
  
  return preparedImages;
}

