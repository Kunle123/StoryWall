import { PrismaClient } from '@prisma/client';
import { deleteImagesFromCloudinary } from '@/lib/utils/imageCleanup';

const prisma = new PrismaClient();

async function deleteTestTimelines() {
  try {
    const testUserEmail = 'test@example.com';
    const testUser = await prisma.user.findUnique({
      where: { email: testUserEmail }
    });
    
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }
    
    console.log(`✅ Found test user: ${testUserEmail} (ID: ${testUser.id})`);
    
    // Get all timelines by test user with their events
    const timelines = await prisma.timeline.findMany({
      where: { creatorId: testUser.id },
      include: {
        events: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
          }
        }
      }
    });
    
    console.log(`\n📋 Found ${timelines.length} timelines by test user`);
    
    // Collect all image URLs
    const imageUrls: string[] = [];
    timelines.forEach(timeline => {
      console.log(`\n  Timeline: ${timeline.title} (ID: ${timeline.id})`);
      console.log(`    Events: ${timeline.events.length}`);
      timeline.events.forEach(event => {
        if (event.imageUrl) {
          imageUrls.push(event.imageUrl);
          console.log(`      - ${event.title}: ${event.imageUrl.substring(0, 80)}...`);
        }
      });
    });
    
    console.log(`\n🖼️  Total image URLs to delete: ${imageUrls.length}`);
    
    // Delete images from Cloudinary
    if (imageUrls.length > 0) {
      console.log('\n🗑️  Deleting images from Cloudinary...');
      try {
        const deletedCount = await deleteImagesFromCloudinary(imageUrls);
        console.log(`✅ Deleted ${deletedCount}/${imageUrls.length} images from Cloudinary`);
      } catch (error: any) {
        console.error('❌ Error deleting images from Cloudinary:', error.message);
        // Continue with timeline deletion even if image deletion fails
      }
    }
    
    // Delete timelines (this will cascade delete events, comments, likes, etc.)
    console.log('\n🗑️  Deleting timelines...');
    for (const timeline of timelines) {
      try {
        await prisma.timeline.delete({
          where: { id: timeline.id }
        });
        console.log(`✅ Deleted timeline: ${timeline.title}`);
      } catch (error: any) {
        console.error(`❌ Error deleting timeline ${timeline.title}:`, error.message);
      }
    }
    
    console.log(`\n✅ Successfully deleted ${timelines.length} test timelines and ${imageUrls.length} images`);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

deleteTestTimelines();

