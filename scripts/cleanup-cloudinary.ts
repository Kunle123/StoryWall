/**
 * Script to clean up orphaned images in Cloudinary
 * Run with: npx tsx scripts/cleanup-cloudinary.ts
 */

import { v2 as cloudinary } from 'cloudinary';
import { config } from 'dotenv';
import path from 'path';

// Load .env.local
config({ path: path.join(process.cwd(), '.env.local') });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function cleanupCloudinary() {
  try {
    console.log('🧹 Starting Cloudinary cleanup...\n');

    // Get all resources in the storywall folder
    let allResources: any[] = [];
    let nextCursor: string | undefined;

    do {
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: 'storywall/ai-generated',
        max_results: 500,
        next_cursor: nextCursor,
      });

      allResources = allResources.concat(result.resources);
      nextCursor = result.next_cursor;
      
      console.log(`📦 Found ${result.resources.length} images (total so far: ${allResources.length})`);
    } while (nextCursor);

    if (allResources.length === 0) {
      console.log('\n✨ No images to clean up!');
      return;
    }

    console.log(`\n🗑️  Deleting ${allResources.length} images...`);

    // Delete in batches of 100 (Cloudinary API limit)
    const batchSize = 100;
    let deleted = 0;

    for (let i = 0; i < allResources.length; i += batchSize) {
      const batch = allResources.slice(i, i + batchSize);
      const publicIds = batch.map(r => r.public_id);

      try {
        const result = await cloudinary.api.delete_resources(publicIds);
        deleted += Object.keys(result.deleted).length;
        console.log(`   ✅ Deleted batch ${Math.floor(i / batchSize) + 1} (${deleted}/${allResources.length})`);
      } catch (error) {
        console.error(`   ❌ Failed to delete batch:`, error);
      }
    }

    console.log(`\n✨ Cleanup complete! Deleted ${deleted} images.`);
  } catch (error: any) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  }
}

cleanupCloudinary();

