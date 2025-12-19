import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { createTimeline } from '@/lib/db/timelines';
import { createEvent } from '@/lib/db/events';
import { slugify } from '@/lib/utils/slugify';
import { isAdminEmail } from '@/lib/utils/admin';

/**
 * POST /api/admin/seed-quick - Quick seed endpoint for demo data
 * 
 * Creates a simple demo timeline with a user and bio for testing purposes.
 * 
 * Request Body (optional):
 * {
 *   count?: number,  // Number of timelines to create (default: 1)
 *   withBio?: boolean // Whether to add bio to user (default: true)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Admin authentication check
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user email from Clerk
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses[0]?.emailAddress;

    if (!email || !isAdminEmail(email)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const count = body.count || 1;
    const withBio = body.withBio !== false;

    const results = {
      usersCreated: 0,
      timelinesCreated: 0,
      eventsCreated: 0,
      timelineIds: [] as string[],
    };

    // Demo data templates
    const demoUsers = [
      {
        username: 'history_enthusiast',
        email: 'history@storywall.demo',
        bio: 'History enthusiast and timeline creator. Passionate about documenting important events and sharing stories through visual timelines.',
      },
      {
        username: 'science_writer',
        email: 'science@storywall.demo',
        bio: 'Science writer and educator. I create timelines to make complex scientific discoveries accessible and engaging.',
      },
      {
        username: 'art_curator',
        email: 'art@storywall.demo',
        bio: 'Art curator and cultural historian. Exploring the evolution of artistic movements through visual storytelling.',
      },
    ];

    const demoTimelines = [
      {
        title: 'The History of Space Exploration',
        description: 'A journey through humanity\'s greatest achievements in space, from the first satellite to Mars rovers.',
        events: [
          { title: 'Sputnik 1 Launched', description: 'The Soviet Union launches the world\'s first artificial satellite.', year: 1957, month: 10, day: 4 },
          { title: 'First Human in Space', description: 'Yuri Gagarin becomes the first human to journey into outer space.', year: 1961, month: 4, day: 12 },
          { title: 'Apollo 11 Moon Landing', description: 'Neil Armstrong and Buzz Aldrin become the first humans to land on the Moon.', year: 1969, month: 7, day: 20 },
          { title: 'First Space Shuttle Launch', description: 'Columbia becomes the first reusable spacecraft to reach orbit.', year: 1981, month: 4, day: 12 },
          { title: 'International Space Station Assembly Begins', description: 'The first module of the ISS, Zarya, is launched.', year: 1998, month: 11, day: 20 },
        ],
      },
      {
        title: 'The Evolution of Computing',
        description: 'From the abacus to quantum computing - tracing the remarkable journey of computational technology.',
        events: [
          { title: 'First Electronic Computer', description: 'ENIAC, the first general-purpose electronic computer, is completed.', year: 1946, month: 2, day: 14 },
          { title: 'First Personal Computer', description: 'The Altair 8800 is released, sparking the personal computer revolution.', year: 1975, month: 1, day: 1 },
          { title: 'Apple II Released', description: 'The Apple II becomes one of the first highly successful mass-produced microcomputers.', year: 1977, month: 6, day: 5 },
          { title: 'World Wide Web Created', description: 'Tim Berners-Lee invents the World Wide Web at CERN.', year: 1991, month: 8, day: 6 },
          { title: 'First iPhone Released', description: 'Apple revolutionizes mobile computing with the introduction of the iPhone.', year: 2007, month: 6, day: 29 },
        ],
      },
      {
        title: 'Renaissance Art Movement',
        description: 'Exploring the rebirth of art and culture in Europe from the 14th to 17th centuries.',
        events: [
          { title: 'Giotto\'s Scrovegni Chapel', description: 'Giotto completes his revolutionary fresco cycle, marking the beginning of Renaissance art.', year: 1305, month: 3, day: 25 },
          { title: 'Donatello\'s David', description: 'Donatello creates the first free-standing nude statue since antiquity.', year: 1440, month: 1, day: 1 },
          { title: 'Leonardo\'s Last Supper', description: 'Leonardo da Vinci completes his masterpiece in Milan.', year: 1498, month: 2, day: 9 },
          { title: 'Michelangelo\'s Sistine Chapel', description: 'Michelangelo completes the ceiling frescoes of the Sistine Chapel.', year: 1512, month: 10, day: 31 },
          { title: 'Raphael\'s School of Athens', description: 'Raphael completes his famous fresco in the Vatican.', year: 1511, month: 1, day: 1 },
        ],
      },
    ];

    for (let i = 0; i < count; i++) {
      const userIndex = i % demoUsers.length;
      const timelineIndex = i % demoTimelines.length;
      const demoUser = demoUsers[userIndex];
      const demoTimeline = demoTimelines[timelineIndex];

      // Get or create user
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: demoUser.email },
            { username: demoUser.username },
          ],
        },
        select: {
          id: true,
          clerkId: true,
          username: true,
          email: true,
          bio: true,
          credits: true,
        },
      });

      if (!user) {
        const placeholderClerkId = `seed_quick_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`;
        user = await prisma.user.create({
          data: {
            clerkId: placeholderClerkId,
            username: demoUser.username,
            email: demoUser.email,
            bio: withBio ? demoUser.bio : null,
            credits: 1000,
          },
        });
        results.usersCreated++;
      } else if (withBio && !user.bio) {
        // Update existing user with bio if they don't have one
        user = await prisma.user.update({
          where: { id: user.id },
          data: { bio: demoUser.bio },
        });
      }

      // Create timeline
      const baseSlug = slugify(demoTimeline.title);
      let slug = `${baseSlug}-${Date.now()}-${i}`;
      
      // Ensure unique slug
      let existingTimeline = await prisma.timeline.findFirst({ 
        where: { slug },
        select: { id: true }
      });
      let counter = 1;
      while (existingTimeline) {
        slug = `${baseSlug}-${Date.now()}-${i}-${counter}`;
        counter++;
        existingTimeline = await prisma.timeline.findFirst({ 
          where: { slug },
          select: { id: true }
        });
      }

      const timeline = await createTimeline({
        title: demoTimeline.title,
        description: demoTimeline.description,
        slug,
        creator_id: user.id,
        visualization_type: 'horizontal',
        is_public: true,
        is_collaborative: false,
      });

      results.timelinesCreated++;
      results.timelineIds.push(timeline.id);

      // Create events
      for (const eventData of demoTimeline.events) {
        const eventDate = new Date(
          eventData.year,
          (eventData.month || 1) - 1,
          eventData.day || 1
        ).toISOString().split('T')[0];

        await createEvent({
          timeline_id: timeline.id,
          title: eventData.title,
          description: eventData.description,
          date: eventDate,
          year: eventData.year,
          month: eventData.month,
          day: eventData.day,
          created_by: user.id,
        });
        results.eventsCreated++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${results.timelinesCreated} timeline(s) with ${results.eventsCreated} events`,
      results: {
        usersCreated: results.usersCreated,
        timelinesCreated: results.timelinesCreated,
        eventsCreated: results.eventsCreated,
        timelineIds: results.timelineIds,
      },
      viewUrls: results.timelineIds.map(id => `http://localhost:3000/timeline/${id}`),
    });
  } catch (error: any) {
    console.error('[Seed Quick] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to seed data' },
      { status: 500 }
    );
  }
}

