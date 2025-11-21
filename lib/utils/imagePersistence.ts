import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Convert buffer to readable stream for Cloudinary
function bufferToStream(buffer: Buffer): Readable {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
}

/**
 * Downloads an image from a URL and uploads it to Cloudinary
 * Returns the permanent Cloudinary URL
 */
export async function persistImageToCloudinary(imageUrl: string): Promise<string | null> {
  // Check if Cloudinary is configured
  if (!process.env.CLOUDINARY_CLOUD_NAME || 
      !process.env.CLOUDINARY_API_KEY || 
      !process.env.CLOUDINARY_API_SECRET) {
    console.warn('[Image Persistence] Cloudinary not configured, returning original URL');
    return imageUrl; // Return original URL if Cloudinary not configured
  }

  // Skip if already a Cloudinary URL
  if (imageUrl.includes('res.cloudinary.com')) {
    console.log('[Image Persistence] URL is already a Cloudinary URL, skipping');
    return imageUrl;
  }

  try {
    // Download the image from the source URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary
    return new Promise<string | null>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'storywall/ai-generated', // Organize AI-generated images in a subfolder
          resource_type: 'image',
          transformation: [
            { quality: 'auto' }, // Auto-optimize quality
            { fetch_format: 'auto' }, // Auto-optimize format (WebP, AVIF)
          ],
        },
        (error, result) => {
          if (error) {
            console.error('[Image Persistence] Cloudinary upload error:', error);
            // Return original URL if upload fails (graceful degradation)
            resolve(imageUrl);
          } else if (result) {
            console.log(`[Image Persistence] Successfully persisted image to Cloudinary: ${result.secure_url.substring(0, 80)}...`);
            resolve(result.secure_url);
          } else {
            console.error('[Image Persistence] Upload failed - no result');
            // Return original URL if upload fails (graceful degradation)
            resolve(imageUrl);
          }
        }
      );

      // Pipe buffer to upload stream
      bufferToStream(buffer).pipe(uploadStream);
    });
  } catch (error: any) {
    console.error('[Image Persistence] Error persisting image:', error);
    // Return original URL if anything fails (graceful degradation)
    return imageUrl;
  }
}

/**
 * Persists multiple images to Cloudinary in parallel
 * Returns an array of Cloudinary URLs (or original URLs if persistence fails)
 */
export async function persistImagesToCloudinary(imageUrls: (string | null)[]): Promise<(string | null)[]> {
  // Filter out null values for processing
  const validUrls = imageUrls.filter((url): url is string => url !== null);
  
  if (validUrls.length === 0) {
    return imageUrls; // Return as-is if no valid URLs
  }

  console.log(`[Image Persistence] Persisting ${validUrls.length} images to Cloudinary...`);
  const startTime = Date.now();

  // Process all images in parallel
  const persistencePromises = validUrls.map(url => persistImageToCloudinary(url));
  const persistedUrls = await Promise.all(persistencePromises);
  
  const totalTime = Date.now() - startTime;
  const avgTimePerImage = totalTime / validUrls.length;
  console.log(`[Image Persistence] Completed persisting ${validUrls.length} images in ${(totalTime / 1000).toFixed(1)}s (avg ${(avgTimePerImage / 1000).toFixed(1)}s per image)`);

  // Map back to original array structure (preserving null values)
  let persistedIndex = 0;
  return imageUrls.map(url => {
    if (url === null) {
      return null;
    }
    return persistedUrls[persistedIndex++];
  });
}

