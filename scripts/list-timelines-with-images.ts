/**
 * List all timelines and their images
 * Useful for finding a timeline to test deletion
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n📋 Listing all timelines with images...\n');

  const timelines = await prisma.timeline.findMany({
    include: {
      events: {
        select: {
          id: true,
          title: true,
          imageUrl: true,
        },
      },
      creator: {
        select: {
          username: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (timelines.length === 0) {
    console.log('No timelines found.');
    return;
  }

  timelines.forEach((timeline, index) => {
    const eventsWithImages = timeline.events.filter(e => e.imageUrl);
    const cloudinaryImages = eventsWithImages.filter(e => 
      e.imageUrl?.includes('res.cloudinary.com')
    );

    console.log(`${index + 1}. ${timeline.title}`);
    console.log(`   ID: ${timeline.id}`);
    console.log(`   Creator: ${timeline.creator.username}`);
    console.log(`   Events: ${timeline.events.length} total, ${eventsWithImages.length} with images`);
    if (cloudinaryImages.length > 0) {
      console.log(`   ☁️  Cloudinary images: ${cloudinaryImages.length}`);
      cloudinaryImages.forEach(event => {
        console.log(`      - ${event.title}: ${event.imageUrl?.substring(0, 80)}...`);
      });
    }
    console.log('');
  });

  console.log(`\n✅ Found ${timelines.length} timeline(s)`);
  const timelinesWithImages = timelines.filter(t => 
    t.events.some(e => e.imageUrl?.includes('res.cloudinary.com'))
  );
  console.log(`   ${timelinesWithImages.length} timeline(s) have Cloudinary images\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

