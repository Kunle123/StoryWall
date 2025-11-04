import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Extract public_id from a Cloudinary URL
 * Example: https://res.cloudinary.com/cloud_name/image/upload/v1234567/storywall/ai-generated/abc.jpg
 * Returns: storywall/ai-generated/abc
 */
function extractPublicIdFromUrl(url: string): string | null {
  try {
    // Check if it's a Cloudinary URL
    if (!url.includes('res.cloudinary.com')) {
      return null;
    }

    // Extract the public_id from the URL
    // Cloudinary URLs have format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{transformations}/{public_id}.{format}
    const urlParts = url.split('/upload/');
    if (urlParts.length < 2) {
      return null;
    }

    // Get everything after /upload/
    const afterUpload = urlParts[1];
    
    // Remove version prefix if present (v1234567/)
    const withoutVersion = afterUpload.replace(/^v\d+\//, '');
    
    // Remove file extension
    const withoutExtension = withoutVersion.replace(/\.(jpg|jpeg|png|gif|webp|avif)$/i, '');
    
    return withoutExtension;
  } catch (error) {
    console.error('[Image Cleanup] Error extracting public_id from URL:', url, error);
    return null;
  }
}

/**
 * Delete a single image from Cloudinary by URL
 * Returns true if successful, false otherwise
 */
export async function deleteImageFromCloudinary(imageUrl: string | null | undefined): Promise<boolean> {
  if (!imageUrl) {
    return true; // No image to delete, consider it successful
  }

  // Check if Cloudinary is configured
  if (!process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET) {
    console.warn('[Image Cleanup] Cloudinary not configured, skipping deletion');
    return false;
  }

  // Check if it's a Cloudinary URL
  if (!imageUrl.includes('res.cloudinary.com')) {
    console.log('[Image Cleanup] URL is not a Cloudinary URL, skipping:', imageUrl.substring(0, 80));
    return true; // Not a Cloudinary image, nothing to delete
  }

  try {
    const publicId = extractPublicIdFromUrl(imageUrl);
    if (!publicId) {
      console.warn('[Image Cleanup] Could not extract public_id from URL:', imageUrl);
      return false;
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
    });

    if (result.result === 'ok') {
      console.log(`[Image Cleanup] Successfully deleted image: ${publicId}`);
      return true;
    } else if (result.result === 'not found') {
      console.log(`[Image Cleanup] Image not found (may already be deleted): ${publicId}`);
      return true; // Consider it successful if already deleted
    } else {
      console.error(`[Image Cleanup] Failed to delete image: ${publicId}`, result);
      return false;
    }
  } catch (error: any) {
    console.error('[Image Cleanup] Error deleting image from Cloudinary:', error);
    return false;
  }
}

/**
 * Delete multiple images from Cloudinary
 * Returns the number of successfully deleted images
 */
export async function deleteImagesFromCloudinary(imageUrls: (string | null | undefined)[]): Promise<number> {
  const validUrls = imageUrls.filter((url): url is string => url !== null && url !== undefined);
  
  if (validUrls.length === 0) {
    return 0;
  }

  console.log(`[Image Cleanup] Deleting ${validUrls.length} images from Cloudinary...`);

  // Delete all images in parallel
  const deletePromises = validUrls.map(url => deleteImageFromCloudinary(url));
  const results = await Promise.all(deletePromises);

  const successCount = results.filter(result => result === true).length;
  console.log(`[Image Cleanup] Successfully deleted ${successCount}/${validUrls.length} images`);

  return successCount;
}

