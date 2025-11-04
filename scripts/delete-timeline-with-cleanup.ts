/**
 * Delete a timeline and verify image cleanup
 * Usage: npx tsx scripts/delete-timeline-with-cleanup.ts [timeline-id]
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { PrismaClient } from '@prisma/client';
import { deleteTimeline } from '../lib/db/timelines';
import { getTimelineById } from '../lib/db/timelines';
import { getEventsByTimelineId } from '../lib/db/events';

const prisma = new PrismaClient();

async function main() {
  const timelineId = process.argv[2];

  if (!timelineId) {
    console.error('Usage: npx tsx scripts/delete-timeline-with-cleanup.ts [timeline-id]');
    console.error('\nExample:');
    console.error('  npx tsx scripts/delete-timeline-with-cleanup.ts 76957de4-4e9b-4e11-8574-0cb1cfd35368');
    process.exit(1);
  }

  console.log(`\n🗑️  Deleting Timeline: ${timelineId}\n`);

  try {
    // Step 1: Fetch timeline and events
    console.log('📋 Step 1: Fetching timeline and events...');
    const timeline = await getTimelineById(timelineId);
    
    if (!timeline) {
      console.error(`❌ Timeline not found: ${timelineId}`);
      process.exit(1);
    }

    console.log(`✅ Found timeline: "${timeline.title}"`);
    console.log(`   Created: ${new Date(timeline.created_at).toLocaleDateString()}`);

    const events = await getEventsByTimelineId(timelineId);
    console.log(`✅ Found ${events.length} events`);

    // Step 2: Count Cloudinary images
    const cloudinaryImages = events
      .filter(e => e.image_url?.includes('res.cloudinary.com'))
      .map(e => e.image_url!);

    console.log(`\n🖼️  Step 2: Images found`);
    console.log(`   Total events: ${events.length}`);
    console.log(`   Events with images: ${events.filter(e => e.image_url).length}`);
    console.log(`   Cloudinary images: ${cloudinaryImages.length}`);

    if (cloudinaryImages.length > 0) {
      console.log('\n   Cloudinary image URLs:');
      cloudinaryImages.slice(0, 5).forEach((url, idx) => {
        console.log(`      ${idx + 1}. ${url.substring(0, 80)}...`);
      });
      if (cloudinaryImages.length > 5) {
        console.log(`      ... and ${cloudinaryImages.length - 5} more`);
      }
    }

    // Step 3: Get creator ID
    const timelineData = await prisma.timeline.findUnique({
      where: { id: timelineId },
      select: { creatorId: true },
    });

    if (!timelineData) {
      console.error('❌ Could not fetch timeline creator ID');
      process.exit(1);
    }

    // Step 4: Confirm deletion
    console.log('\n⚠️  Step 3: Confirmation');
    console.log(`   This will permanently delete:`);
    console.log(`   - Timeline: "${timeline.title}"`);
    console.log(`   - ${events.length} events`);
    console.log(`   - ${cloudinaryImages.length} images from Cloudinary`);
    console.log('\n   Starting deletion in 3 seconds...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 5: Delete timeline
    console.log('🗑️  Step 4: Deleting timeline...');
    await deleteTimeline(timelineId, timelineData.creatorId);
    console.log('✅ Timeline deleted successfully');

    // Step 6: Verify deletion
    console.log('\n✅ Step 5: Verifying deletion...');
    const deletedTimeline = await prisma.timeline.findUnique({
      where: { id: timelineId },
    });

    if (deletedTimeline) {
      console.error('❌ Timeline still exists in database!');
      process.exit(1);
    }

    const deletedEvents = await prisma.event.findMany({
      where: { timelineId: timelineId },
    });

    if (deletedEvents.length > 0) {
      console.error(`❌ ${deletedEvents.length} events still exist!`);
      process.exit(1);
    }

    console.log('✅ Timeline and events deleted from database');
    console.log(`✅ ${cloudinaryImages.length} images should have been deleted from Cloudinary`);
    console.log('\n✅ Deletion completed successfully!');
    console.log('   Check the logs above for Cloudinary deletion messages.\n');

  } catch (error: any) {
    console.error('\n❌ Error during deletion:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

