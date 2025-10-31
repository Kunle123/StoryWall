import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

// This script connects to Railway's database and creates test data
// Set DATABASE_URL environment variable to your Railway PostgreSQL connection string

const prisma = new PrismaClient();

async function createTestData() {
  try {
    console.log('🔧 Creating test data on Railway database...\n');

    if (!process.env.DATABASE_URL) {
      console.log('❌ DATABASE_URL not found!');
      console.log('   Set it to your Railway PostgreSQL connection string:');
      console.log('   DATABASE_URL="postgresql://..." tsx scripts/create-test-data-railway.ts');
      process.exit(1);
    }

    console.log('✅ Connected to database:', process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'Railway PostgreSQL');

    // Find or create test user
    let user = await prisma.user.findUnique({
      where: { clerkId: 'test-user-clerk-id' },
    });

    if (!user) {
      console.log('👤 Creating test user...');
      user = await prisma.user.create({
        data: {
          clerkId: 'test-user-clerk-id',
          username: 'testuser',
          email: 'test@example.com',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=testuser',
        },
      });
      console.log(`✅ Test user created: ${user.id}`);
    } else {
      console.log(`✅ Test user exists: ${user.id}`);
    }

    // Check if timeline already exists
    const existingTimeline = await prisma.timeline.findFirst({
      where: { creatorId: user.id },
      include: { events: true },
    });

    if (existingTimeline) {
      console.log('\n✅ Test timeline already exists:');
      console.log(`   ID: ${existingTimeline.id}`);
      console.log(`   Title: ${existingTimeline.title}`);
      console.log(`   Slug: ${existingTimeline.slug}`);
      console.log(`   Events: ${existingTimeline.events.length}`);
      console.log(`\n📖 View at: [Your Railway App URL]/timeline/${existingTimeline.id}`);
      
      await prisma.$disconnect();
      return;
    }

    // Create a test timeline
    console.log('\n📝 Creating test timeline...');
    const timeline = await prisma.timeline.create({
      data: {
        title: 'Test Timeline - Railway Production',
        description: 'This is a test timeline created on Railway production database. It demonstrates the database integration in the deployed environment.',
        slug: 'test-timeline-railway-production',
        creatorId: user.id,
        visualizationType: 'vertical',
        isPublic: true,
        isCollaborative: false,
      },
    });

    console.log(`✅ Timeline created: ${timeline.id}`);

    // Create test events
    console.log('\n📅 Creating test events...');
    
    const events = [
      {
        title: 'Railway Deployment',
        description: 'StoryWall successfully deployed to Railway platform, making it accessible worldwide.',
        date: new Date('2024-01-15'),
        category: 'milestone',
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
      },
      {
        title: 'Database Connected',
        description: 'PostgreSQL database successfully connected on Railway, enabling persistent data storage.',
        date: new Date('2024-02-01'),
        category: 'milestone',
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
      },
      {
        title: 'API Live',
        description: 'All REST API endpoints are now live on Railway, handling timeline and event operations.',
        date: new Date('2024-02-15'),
        category: 'innovation',
        imageUrl: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800',
      },
      {
        title: 'Production Ready',
        description: 'Application is production-ready with database-backed data persistence on Railway.',
        date: new Date('2024-03-01'),
        category: 'milestone',
        imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800',
      },
      {
        title: 'Public Launch',
        description: 'StoryWall is now publicly available on Railway, ready for users to create and share timelines.',
        date: new Date('2024-03-10'),
        category: 'milestone',
        links: [],
      },
    ];

    for (const eventData of events) {
      await prisma.event.create({
        data: {
          timelineId: timeline.id,
          title: eventData.title,
          description: eventData.description,
          date: eventData.date,
          category: eventData.category,
          imageUrl: eventData.imageUrl,
          links: eventData.links,
          createdBy: user.id,
        },
      });
      console.log(`   ✅ Created: ${eventData.title}`);
    }

    console.log('\n✅ Test data created successfully on Railway!');
    console.log(`\n📖 View timeline at: [Your Railway App URL]/timeline/${timeline.id}`);
    console.log(`📊 View in Railway dashboard → PostgreSQL → Data tab`);
    console.log(`\n🎯 Next steps:`);
    console.log(`   1. Get your Railway app URL from Railway dashboard`);
    console.log(`   2. Visit: [URL]/timeline/${timeline.id}`);
    console.log(`   3. Or browse: [URL]/discover`);

    await prisma.$disconnect();
  } catch (error: any) {
    console.error('❌ Error creating test data:', error);
    if (error.code === 'P2002') {
      console.log('   Timeline with this slug already exists.');
    }
    process.exit(1);
  }
}

createTestData();

