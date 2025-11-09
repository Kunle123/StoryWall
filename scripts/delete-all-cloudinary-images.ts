/**
 * Script to delete all images from Cloudinary
 */

import { v2 as cloudinary } from 'cloudinary';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function deleteAllImages() {
  try {
    console.log('Fetching all images from Cloudinary...\n');
    
    // Get all resources
    const result = await cloudinary.api.resources({
      type: 'upload',
      max_results: 500,
      prefix: 'storywall/ai-generated', // Only delete images in our folder
    });
    
    const imageCount = result.resources.length;
    console.log(`Found ${imageCount} images to delete\n`);
    
    if (imageCount === 0) {
      console.log('✅ No images to delete');
      return;
    }
    
    // Calculate total size before deletion
    const totalBytes = result.resources.reduce((sum: number, r: any) => sum + r.bytes, 0);
    console.log(`Total storage to free: ${(totalBytes / 1024 / 1024).toFixed(2)} MB\n`);
    
    // Delete in batches
    const publicIds = result.resources.map((r: any) => r.public_id);
    const batchSize = 100; // Cloudinary allows max 100 per delete call
    
    for (let i = 0; i < publicIds.length; i += batchSize) {
      const batch = publicIds.slice(i, i + batchSize);
      console.log(`Deleting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(publicIds.length / batchSize)} (${batch.length} images)...`);
      
      await cloudinary.api.delete_resources(batch);
      console.log(`✅ Deleted ${batch.length} images`);
    }
    
    console.log(`\n✅ Successfully deleted all ${imageCount} images!`);
    console.log(`✅ Freed ${(totalBytes / 1024 / 1024).toFixed(2)} MB of storage`);
    
  } catch (error: any) {
    console.error('❌ Error deleting images:', error.message);
    throw error;
  }
}

deleteAllImages();

