import 'dotenv/config';
import { prisma } from '../lib/db/prisma';
import { createTimeline } from '../lib/db/timelines';
import { createEvent } from '../lib/db/events';

const TEST_USER_ID = '4b499a69-c3f1-48ee-a938-305cce4c19e8';

async function createTestData() {
  try {
    console.log('🔧 Creating test data...\n');

    // Check if test user exists
    const user = await prisma.user.findUnique({
      where: { id: TEST_USER_ID },
    });

    if (!user) {
      console.log('❌ Test user not found. Run: npm run test:setup-user');
      process.exit(1);
    }

    console.log('✅ Test user found:', user.username);

    // Check if timeline already exists
    const existingTimeline = await prisma.timeline.findFirst({
      where: { creatorId: TEST_USER_ID },
    });

    if (existingTimeline) {
      console.log('\n✅ Test timeline already exists:');
      console.log(`   ID: ${existingTimeline.id}`);
      console.log(`   Title: ${existingTimeline.title}`);
      console.log(`   Slug: ${existingTimeline.slug}`);
      
      const eventCount = await prisma.event.count({
        where: { timelineId: existingTimeline.id },
      });
      console.log(`   Events: ${eventCount}`);
      console.log(`\n📖 View at: http://localhost:3000/timeline/${existingTimeline.id}`);
      
      await prisma.$disconnect();
      return;
    }

    // Create a test timeline
    console.log('\n📝 Creating test timeline...');
    const timeline = await createTimeline({
      title: 'Test Timeline - Database Demo',
      description: 'This is a test timeline created to demonstrate the database integration. It contains several sample events showing how timelines work in StoryWall.',
      slug: 'test-timeline-database-demo',
      creator_id: TEST_USER_ID,
      visualization_type: 'vertical',
      is_public: true,
      is_collaborative: false,
    });

    console.log(`✅ Timeline created: ${timeline.id}`);

    // Create test events
    console.log('\n📅 Creating test events...');
    
    const events = [
      {
        title: 'Project Launch',
        description: 'The StoryWall project officially launched, bringing collaborative timeline creation to users worldwide.',
        date: '2024-01-15',
        category: 'milestone',
        image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
      },
      {
        title: 'First Timeline Created',
        description: 'The first user-created timeline was published, showcasing the platform\'s capabilities.',
        date: '2024-02-01',
        category: 'milestone',
        image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
      },
      {
        title: 'Database Integration Complete',
        description: 'Full PostgreSQL database integration completed, enabling real-time data persistence.',
        date: '2024-02-15',
        category: 'innovation',
        image_url: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800',
      },
      {
        title: 'API Routes Live',
        description: 'All REST API routes are now functional, allowing seamless frontend-backend communication.',
        date: '2024-03-01',
        category: 'milestone',
        image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800',
      },
      {
        title: 'Frontend Integration',
        description: 'Frontend successfully integrated with API, providing smooth user experience with database-backed data.',
        date: '2024-03-10',
        category: 'milestone',
        links: ['https://github.com/Kunle123/StoryWall'],
      },
    ];

    for (const eventData of events) {
      await createEvent({
        timeline_id: timeline.id,
        ...eventData,
        created_by: TEST_USER_ID,
      });
      console.log(`   ✅ Created: ${eventData.title}`);
    }

    console.log('\n✅ Test data created successfully!');
    console.log(`\n📖 View timeline at: http://localhost:3000/timeline/${timeline.id}`);
    console.log(`📊 View in database: Run 'npm run db:studio'`);
    console.log(`\n🎯 Next steps:`);
    console.log(`   1. Make sure dev server is running: npm run dev`);
    console.log(`   2. Visit: http://localhost:3000/timeline/${timeline.id}`);
    console.log(`   3. Or browse all timelines: http://localhost:3000/discover`);

    await prisma.$disconnect();
  } catch (error: any) {
    console.error('❌ Error creating test data:', error);
    process.exit(1);
  }
}

createTestData();

