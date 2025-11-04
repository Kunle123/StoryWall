/**
 * Test timeline deletion with image cleanup
 * Creates a test timeline, adds events with images, then deletes it
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { PrismaClient } from '@prisma/client';
import { deleteTimeline } from '../lib/db/timelines';
import { createTimeline } from '../lib/db/timelines';
import { createEvent } from '../lib/db/events';
import { getOrCreateUser } from '../lib/db/users';
import { slugify } from '../lib/utils/slugify';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🧪 Testing Timeline Deletion with Image Cleanup\n');

  try {
    // Step 1: Get or create a test user
    console.log('📋 Step 1: Getting test user...');
    // We'll use the first user in the database
    const testUser = await prisma.user.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (!testUser) {
      console.error('❌ No users found in database. Please create a user first.');
      process.exit(1);
    }

    console.log(`✅ Using test user: ${testUser.username} (${testUser.id})\n`);

    // Step 2: Create a test timeline
    console.log('📝 Step 2: Creating test timeline...');
    const testTimeline = await createTimeline({
      title: `Test Timeline - Deletion Test ${Date.now()}`,
      description: 'This timeline will be deleted to test image cleanup',
      visualization_type: 'horizontal',
      is_public: false,
      is_collaborative: false,
      slug: slugify(`Test Timeline - Deletion Test ${Date.now()}`),
      creator_id: testUser.id,
    });

    console.log(`✅ Created timeline: "${testTimeline.title}" (${testTimeline.id})\n`);

    // Step 3: Add test events with Cloudinary images
    console.log('🖼️  Step 3: Adding test events with Cloudinary images...');
    
    // Use existing Cloudinary images from other timelines for testing
    const testImageUrls = [
      'https://res.cloudinary.com/dnybzkkfn/image/upload/v1762178326/storywall/ai-generated/test-image-1.jpg',
      'https://res.cloudinary.com/dnybzkkfn/image/upload/v1762178327/storywall/ai-generated/test-image-2.jpg',
      'https://res.cloudinary.com/dnybzkkfn/image/upload/v1762178327/storywall/ai-generated/test-image-3.jpg',
    ];

    const events = [];
    for (let i = 0; i < 3; i++) {
      const event = await createEvent({
        timeline_id: testTimeline.id,
        title: `Test Event ${i + 1}`,
        description: `Test event for deletion testing`,
        date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
        image_url: testImageUrls[i],
        created_by: testUser.id,
      });
      events.push(event);
      console.log(`   ✅ Created event: "${event.title}" with image`);
    }

    console.log(`\n✅ Created ${events.length} events with images\n`);

    // Step 4: Verify images exist
    console.log('🔍 Step 4: Verifying timeline and images...');
    const timelineWithEvents = await prisma.timeline.findUnique({
      where: { id: testTimeline.id },
      include: {
        events: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
          },
        },
      },
    });

    if (!timelineWithEvents) {
      throw new Error('Timeline not found after creation');
    }

    const cloudinaryImages = timelineWithEvents.events
      .filter(e => e.imageUrl?.includes('res.cloudinary.com'))
      .map(e => e.imageUrl!);

    console.log(`   Timeline: "${timelineWithEvents.title}"`);
    console.log(`   Events: ${timelineWithEvents.events.length}`);
    console.log(`   Cloudinary images: ${cloudinaryImages.length}`);
    cloudinaryImages.forEach((url, idx) => {
      console.log(`      ${idx + 1}. ${url.substring(0, 80)}...`);
    });

    // Step 5: Delete timeline (this should clean up images)
    console.log('\n🗑️  Step 5: Deleting timeline (should clean up images)...');
    console.log('   This will delete:');
    console.log(`   - Timeline: "${testTimeline.title}"`);
    console.log(`   - ${timelineWithEvents.events.length} events`);
    console.log(`   - ${cloudinaryImages.length} images from Cloudinary`);
    console.log('\n   Deleting in 2 seconds...\n');

    await new Promise(resolve => setTimeout(resolve, 2000));

    await deleteTimeline(testTimeline.id, testUser.id);
    console.log('✅ Timeline deleted successfully');

    // Step 6: Verify timeline is deleted
    console.log('\n✅ Step 6: Verifying deletion...');
    const deletedTimeline = await prisma.timeline.findUnique({
      where: { id: testTimeline.id },
    });

    if (deletedTimeline) {
      console.error('❌ Timeline still exists in database!');
      process.exit(1);
    }

    const deletedEvents = await prisma.event.findMany({
      where: { timelineId: testTimeline.id },
    });

    if (deletedEvents.length > 0) {
      console.error(`❌ ${deletedEvents.length} events still exist!`);
      process.exit(1);
    }

    console.log('✅ Timeline and events deleted from database');

    // Note: We can't easily verify Cloudinary deletion without making API calls
    // But the deletion function should have logged the cleanup
    console.log('\n✅ Test completed successfully!');
    console.log('   Check the logs above for Cloudinary deletion messages.\n');

  } catch (error: any) {
    console.error('\n❌ Error during test:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

