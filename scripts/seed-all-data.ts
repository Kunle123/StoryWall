import 'dotenv/config';
import { prisma } from '../lib/db/prisma';
import { slugify } from '../lib/utils/slugify';
import {
  carTimelineEvents,
  ukWarsTimeline,
} from '../lib/data/timelineData';
import {
  spaceExplorationTimeline,
  musicEvolutionTimeline,
  medicalBreakthroughsTimeline,
  fashionThroughAgesTimeline,
  computingRevolutionTimeline,
  sportsHistoryTimeline,
  artMovementsTimeline,
  environmentalHistoryTimeline,
  foodEvolutionTimeline,
  communicationTechnologyTimeline,
  architectureTimeline,
  transportationEvolutionTimeline,
} from '../lib/data/mockTimelines';
import { TimelineEvent } from '../components/timeline/Timeline';

const TEST_USER_ID = process.env.TEST_USER_ID || '4b499a69-c3f1-48ee-a938-305cce4c19e8';

interface TimelineData {
  id: string;
  title: string;
  description?: string;
  category: string;
  events: TimelineEvent[];
  pixelsPerYear?: number;
}

const timelinesToSeed: TimelineData[] = [
  {
    id: 'auto-history',
    title: 'Automotive History',
    description: 'A comprehensive timeline of automotive milestones and innovations',
    category: 'Technology',
    events: carTimelineEvents,
    pixelsPerYear: 30,
  },
  {
    id: 'uk-wars',
    title: 'UK Wars & Conflicts Timeline',
    description: 'Timeline of wars and conflicts involving the United Kingdom since its formation',
    category: 'History',
    events: ukWarsTimeline,
    pixelsPerYear: 15,
  },
  {
    id: 'space-exploration',
    title: 'Space Exploration Milestones',
    description: 'Key moments in humanity\'s journey to the stars',
    category: 'Science',
    events: spaceExplorationTimeline,
    pixelsPerYear: 20,
  },
  {
    id: 'music-evolution',
    title: 'Evolution of Music Genres',
    description: 'The transformation of music technology and consumption',
    category: 'Culture',
    events: musicEvolutionTimeline,
    pixelsPerYear: 25,
  },
  {
    id: 'medical-breakthroughs',
    title: 'Medical Breakthroughs',
    description: 'Revolutionary discoveries and innovations in medicine',
    category: 'Science',
    events: medicalBreakthroughsTimeline,
    pixelsPerYear: 15,
  },
  {
    id: 'fashion-ages',
    title: 'Fashion Through the Ages',
    description: 'The evolution of style, trends, and fashion movements',
    category: 'Culture',
    events: fashionThroughAgesTimeline,
    pixelsPerYear: 20,
  },
  {
    id: 'computing-revolution',
    title: 'Computing Revolution',
    description: 'The digital age transformation',
    category: 'Technology',
    events: computingRevolutionTimeline,
    pixelsPerYear: 25,
  },
  {
    id: 'sports-history',
    title: 'Sports Legends & Records',
    description: 'Iconic moments and achievements in sports history',
    category: 'Sports',
    events: sportsHistoryTimeline,
    pixelsPerYear: 20,
  },
  {
    id: 'art-movements',
    title: 'Lives of Great Artists',
    description: 'Artistic movements and influential creators',
    category: 'Art',
    events: artMovementsTimeline,
    pixelsPerYear: 15,
  },
  {
    id: 'environmental-history',
    title: 'Environmental Movement',
    description: 'The rise of environmental awareness and action',
    category: 'Science',
    events: environmentalHistoryTimeline,
    pixelsPerYear: 20,
  },
  {
    id: 'food-evolution',
    title: 'Food & Cuisine Evolution',
    description: 'Culinary history and food culture transformation',
    category: 'Culture',
    events: foodEvolutionTimeline,
    pixelsPerYear: 20,
  },
  {
    id: 'communication-technology',
    title: 'Communication Technology',
    description: 'How we connect: from letters to instant messaging',
    category: 'Technology',
    events: communicationTechnologyTimeline,
    pixelsPerYear: 25,
  },
  {
    id: 'architecture',
    title: 'Architecture & Building',
    description: 'Landmark structures and architectural movements',
    category: 'Art',
    events: architectureTimeline,
    pixelsPerYear: 30,
  },
  {
    id: 'transportation',
    title: 'Transportation Evolution',
    description: 'From horses to hyperloops: the journey of human mobility',
    category: 'Technology',
    events: transportationEvolutionTimeline,
    pixelsPerYear: 20,
  },
];

function formatEventDate(event: TimelineEvent): string {
  const day = event.day || 1;
  const month = event.month || 1;
  return `${event.year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

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

    let totalTimelines = 0;
    let totalEvents = 0;

    for (const timelineData of timelinesToSeed) {
      try {
        // Check if timeline already exists
        const existingTimeline = await prisma.timeline.findFirst({
          where: {
            slug: timelineData.id,
            creatorId: TEST_USER_ID,
          },
        });

        if (existingTimeline) {
          console.log(`⏭️  Skipping "${timelineData.title}" (already exists)`);
          continue;
        }

        // Create timeline
        const timeline = await prisma.timeline.create({
          data: {
            title: timelineData.title,
            description: timelineData.description || '',
            slug: timelineData.id,
            creatorId: TEST_USER_ID,
            visualizationType: 'horizontal',
            isPublic: true,
            isCollaborative: false,
          },
        });

        console.log(`✅ Created timeline: "${timeline.title}" (${timelineData.events.length} events)`);

        // Create events for this timeline
        let eventCount = 0;
        for (const eventData of timelineData.events) {
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
          } catch (error: any) {
            console.error(`   ⚠️  Error creating event "${eventData.title}":`, error.message);
          }
        }

        console.log(`   ✅ Created ${eventCount} events\n`);
        totalTimelines++;
        totalEvents += eventCount;
      } catch (error: any) {
        console.error(`❌ Error creating timeline "${timelineData.title}":`, error.message);
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Seeding complete!`);
    console.log(`   📊 Timelines created: ${totalTimelines}`);
    console.log(`   📊 Events created: ${totalEvents}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Verify what was created
    const allTimelines = await prisma.timeline.findMany({
      where: { creatorId: TEST_USER_ID },
      include: { _count: { select: { events: true } } },
    });

    console.log(`📋 Total timelines in database: ${allTimelines.length}`);
    allTimelines.forEach((t) => {
      console.log(`   • ${t.title}: ${t._count.events} events`);
    });
  } catch (error: any) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();

