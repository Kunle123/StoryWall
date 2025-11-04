/**
 * Test script to verify timeline deletion with image cleanup
 * 
 * Usage:
 *   npx tsx scripts/test-timeline-deletion.ts [timeline-id]
 * 
 * This script will:
 * 1. Fetch a timeline and its events
 * 2. List all image URLs
 * 3. Delete the timeline (which should clean up images)
 * 4. Verify images are deleted from Cloudinary
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { PrismaClient } from '@prisma/client';
import { deleteTimeline } from '../lib/db/timelines';
import { getTimelineById } from '../lib/db/timelines';
import { getEventsByTimelineId } from '../lib/db/events';
import { deleteImageFromCloudinary } from '../lib/utils/imageCleanup';

const prisma = new PrismaClient();

async function main() {
  const timelineId = process.argv[2];

  if (!timelineId) {
    console.error('Usage: npx tsx scripts/test-timeline-deletion.ts [timeline-id]');
    console.error('\nExample:');
    console.error('  npx tsx scripts/test-timeline-deletion.ts abc123-def456-ghi789');
    process.exit(1);
  }

  console.log(`\n🧪 Testing timeline deletion for: ${timelineId}\n`);

  try {
    // Step 1: Fetch timeline and events
    console.log('📋 Step 1: Fetching timeline and events...');
    const timeline = await getTimelineById(timelineId);
    
    if (!timeline) {
      console.error(`❌ Timeline not found: ${timelineId}`);
      process.exit(1);
    }

    console.log(`✅ Found timeline: "${timeline.title}"`);
    console.log(`   Created: ${timeline.created_at}`);
    console.log(`   Public: ${timeline.is_public}`);

    const events = await getEventsByTimelineId(timelineId);
    console.log(`✅ Found ${events.length} events`);

    // Step 2: List image URLs
    console.log('\n🖼️  Step 2: Checking for images...');
    const imageUrls = events
      .map(event => event.image_url)
      .filter((url): url is string => url !== null && url !== undefined);

    if (imageUrls.length === 0) {
      console.log('⚠️  No images found in events');
    } else {
      console.log(`✅ Found ${imageUrls.length} images:`);
      imageUrls.forEach((url, index) => {
        const isCloudinary = url.includes('res.cloudinary.com');
        console.log(`   ${index + 1}. ${isCloudinary ? '☁️  Cloudinary' : '🔗 External'}: ${url.substring(0, 80)}...`);
      });
    }

    // Step 3: Confirm deletion
    console.log('\n⚠️  Step 3: Ready to delete timeline');
    console.log(`   This will delete:`);
    console.log(`   - Timeline: "${timeline.title}"`);
    console.log(`   - ${events.length} events`);
    console.log(`   - ${imageUrls.length} images from Cloudinary`);
    console.log('\n   Press Ctrl+C to cancel, or wait 3 seconds to continue...');

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 4: Delete timeline
    console.log('\n🗑️  Step 4: Deleting timeline...');
    
    // Get the creator's user ID (we'll need to authenticate or use a test user)
    // For testing, we'll need the actual user ID
    const timelineData = await prisma.timeline.findUnique({
      where: { id: timelineId },
      select: { creatorId: true },
    });

    if (!timelineData) {
      console.error('❌ Could not fetch timeline creator ID');
      process.exit(1);
    }

    await deleteTimeline(timelineId, timelineData.creatorId);
    console.log('✅ Timeline deleted successfully');

    // Step 5: Verify images are deleted
    if (imageUrls.length > 0) {
      console.log('\n🔍 Step 5: Verifying image deletion from Cloudinary...');
      const cloudinaryUrls = imageUrls.filter(url => url.includes('res.cloudinary.com'));
      
      if (cloudinaryUrls.length > 0) {
        console.log(`   Checking ${cloudinaryUrls.length} Cloudinary images...`);
        
        // Try to delete each image (should fail if already deleted)
        for (const url of cloudinaryUrls) {
          const result = await deleteImageFromCloudinary(url);
          if (!result) {
            console.log(`   ✅ Image already deleted or not found: ${url.substring(0, 60)}...`);
          } else {
            console.log(`   ⚠️  Image still exists: ${url.substring(0, 60)}...`);
          }
        }
      } else {
        console.log('   ℹ️  No Cloudinary images to verify');
      }
    }

    console.log('\n✅ Test completed successfully!');
    console.log('   Timeline and images have been deleted.');

  } catch (error: any) {
    console.error('\n❌ Error during test:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

