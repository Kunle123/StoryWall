import 'dotenv/config';
import { prisma } from '../lib/db/prisma';
import { transportationEvolutionTimeline } from '../lib/data/mockTimelines';
import { TimelineEvent } from '../components/timeline/Timeline';

const TEST_USER_ID = process.env.TEST_USER_ID || '4b499a69-c3f1-48ee-a938-305cce4c19e8';

function formatEventDate(event: TimelineEvent): string {
  const day = event.day || 1;
  const month = event.month || 1;
  return `${event.year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

async function updateTransportationTimeline() {
  console.log('🚀 Updating Transportation Evolution timeline...\n');

  try {
    // Verify test user exists
    const user = await prisma.user.findUnique({
      where: { id: TEST_USER_ID },
    });

    if (!user) {
      console.error(`❌ Test user not found. Please run: npm run test:setup-user`);
      process.exit(1);
    }

    console.log(`✅ Using test user: ${user.username} (${user.email})\n`);

    // Find the transportation timeline
    const timeline = await prisma.timeline.findFirst({
      where: {
        slug: 'transportation',
        creatorId: TEST_USER_ID,
      },
      include: {
        _count: { select: { events: true } },
      },
    });

    if (!timeline) {
      console.error(`❌ Transportation timeline not found. Please run: npm run seed:all`);
      process.exit(1);
    }

    console.log(`📋 Found timeline: "${timeline.title}" (${timeline._count.events} existing events)`);
    console.log(`🗑️  Deleting existing events...\n`);

    // Delete all existing events for this timeline
    await prisma.event.deleteMany({
      where: { timelineId: timeline.id },
    });

    console.log(`✅ Deleted ${timeline._count.events} old events\n`);

    // Create new events with updated data
    console.log(`📝 Creating ${transportationEvolutionTimeline.length} updated events...\n`);

    let eventCount = 0;
    for (const eventData of transportationEvolutionTimeline) {
      try {
        const dateStr = formatEventDate(eventData);
        
        await prisma.event.create({
          data: {
            timelineId: timeline.id,
            title: eventData.title,
            description: eventData.description || undefined,
            date: new Date(dateStr),
            imageUrl: eventData.image || undefined,
            category: eventData.category || undefined,
            links: [],
            createdBy: TEST_USER_ID,
          },
        });
        eventCount++;
        
        if (eventCount % 10 === 0) {
          console.log(`   ✅ Created ${eventCount}/${transportationEvolutionTimeline.length} events...`);
        }
      } catch (error: any) {
        console.error(`   ⚠️  Error creating event "${eventData.title}":`, error.message);
      }
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✅ Update complete!`);
    console.log(`   📊 Events created: ${eventCount}`);
    console.log(`   📊 Events with images: ${transportationEvolutionTimeline.filter(e => e.image).length}`);
    console.log(`   📊 Events with detailed descriptions: ${transportationEvolutionTimeline.filter(e => e.description && e.description.length > 100).length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Verify the update
    const updatedTimeline = await prisma.timeline.findUnique({
      where: { id: timeline.id },
      include: { _count: { select: { events: true } } },
    });

    console.log(`📋 Updated timeline: "${updatedTimeline?.title}"`);
    console.log(`   📊 Total events: ${updatedTimeline?._count.events}\n`);
  } catch (error: any) {
    console.error('❌ Update failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateTransportationTimeline();

