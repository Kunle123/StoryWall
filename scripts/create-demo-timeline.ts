import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createDemoTimeline() {
  try {
    console.log('Creating demo timeline with bio...');

    // Find the first user (or you can specify a Clerk ID)
    // For demo purposes, we'll update the first user we find
    const users = await prisma.user.findMany({
      take: 1,
      orderBy: { createdAt: 'desc' },
    });

    if (users.length === 0) {
      console.error('No users found. Please sign up first.');
      return;
    }

    const user = users[0];
    console.log(`Found user: ${user.username || user.email} (ID: ${user.id})`);

    // Update user bio
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        bio: 'History enthusiast and timeline creator. Passionate about documenting important events and sharing stories through visual timelines.',
      },
    });
    console.log('✅ Updated user bio');

    // Create a demo timeline
    const timeline = await prisma.timeline.create({
      data: {
        title: 'The History of Space Exploration',
        description: 'A journey through humanity\'s greatest achievements in space, from the first satellite to Mars rovers.',
        slug: `space-exploration-${Date.now()}`,
        creatorId: user.id,
        visualizationType: 'horizontal',
        isPublic: true,
        viewCount: 0,
      },
    });
    console.log(`✅ Created timeline: ${timeline.title} (ID: ${timeline.id})`);

    // Create some events for the timeline
    const events = [
      {
        timelineId: timeline.id,
        title: 'Sputnik 1 Launched',
        description: 'The Soviet Union launches the world\'s first artificial satellite, marking the beginning of the space age.',
        date: new Date('1957-10-04'),
        year: 1957,
        month: 10,
        day: 4,
      },
      {
        timelineId: timeline.id,
        title: 'First Human in Space',
        description: 'Yuri Gagarin becomes the first human to journey into outer space aboard Vostok 1.',
        date: new Date('1961-04-12'),
        year: 1961,
        month: 4,
        day: 12,
      },
      {
        timelineId: timeline.id,
        title: 'Apollo 11 Moon Landing',
        description: 'Neil Armstrong and Buzz Aldrin become the first humans to land on the Moon.',
        date: new Date('1969-07-20'),
        year: 1969,
        month: 7,
        day: 20,
      },
      {
        timelineId: timeline.id,
        title: 'First Space Shuttle Launch',
        description: 'Columbia becomes the first reusable spacecraft to reach orbit.',
        date: new Date('1981-04-12'),
        year: 1981,
        month: 4,
        day: 12,
      },
      {
        timelineId: timeline.id,
        title: 'International Space Station Assembly Begins',
        description: 'The first module of the ISS, Zarya, is launched, beginning the largest international space project.',
        date: new Date('1998-11-20'),
        year: 1998,
        month: 11,
        day: 20,
      },
    ];

    for (const eventData of events) {
      const event = await prisma.event.create({
        data: eventData,
      });
      console.log(`  ✅ Created event: ${event.title}`);
    }

    console.log('\n🎉 Demo timeline created successfully!');
    console.log(`\nView it at: http://localhost:3000/timeline/${timeline.id}`);
    console.log(`View your profile at: http://localhost:3000/profile`);
    console.log(`\nUser bio: "${updatedUser.bio}"`);

  } catch (error) {
    console.error('Error creating demo timeline:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoTimeline();

