import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createTimeline } from '@/lib/db/timelines';
import { createEvent } from '@/lib/db/events';
import { slugify } from '@/lib/utils/slugify';

interface SeedUser {
  email: string;
  username: string;
  clerkId?: string;
}

interface SeedTimeline {
  title: string;
  description: string;
  isFactual?: boolean;
  isPublic?: boolean;
  maxEvents?: number;
  generateImages?: boolean;
  imageStyle?: string;
}

interface SeedEntry {
  user: SeedUser;
  timelines: SeedTimeline[];
}

/**
 * POST /api/admin/seed - Seed timelines from JSON file
 * 
 * Request Body: JSON array of seed entries
 * [
 *   {
 *     user: { email, username, clerkId? },
 *     timelines: [{ title, description, isFactual?, isPublic?, maxEvents?, generateImages?, imageStyle? }]
 *   }
 * ]
 * 
 * This endpoint:
 * 1. Creates users (or uses existing if clerkId provided)
 * 2. Creates timelines
 * 3. Generates events using AI
 * 4. Optionally generates images
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // const { userId } = await auth();
    // if (!userId || !isAdmin(userId)) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const seedData: SeedEntry[] = await request.json();

    if (!Array.isArray(seedData)) {
      return NextResponse.json(
        { error: 'Seed data must be an array' },
        { status: 400 }
      );
    }

    const results = {
      usersCreated: 0,
      usersSkipped: 0,
      timelinesCreated: 0,
      timelinesFailed: 0,
      eventsGenerated: 0,
      imagesGenerated: 0,
      errors: [] as string[],
    };

    // Process each user
    for (const entry of seedData) {
      try {
        // Get or create user
        let user;
        if (entry.user.clerkId) {
          // Use existing Clerk user
          user = await prisma.user.findUnique({
            where: { clerkId: entry.user.clerkId },
          });
          
          if (!user) {
            // Create user with Clerk ID
            user = await prisma.user.create({
              data: {
                clerkId: entry.user.clerkId,
                username: entry.user.username,
                email: entry.user.email,
                credits: 1000, // Give seeded users extra credits
              },
            });
            results.usersCreated++;
          } else {
            results.usersSkipped++;
          }
        } else {
          // Create new user without Clerk ID (for seeding purposes)
          // Check if user already exists
          const existingUser = await prisma.user.findFirst({
            where: {
              OR: [
                { email: entry.user.email },
                { username: entry.user.username },
              ],
            },
          });

          if (existingUser) {
            user = existingUser;
            results.usersSkipped++;
          } else {
            // Generate a placeholder Clerk ID for seeding
            const placeholderClerkId = `seed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            user = await prisma.user.create({
              data: {
                clerkId: placeholderClerkId,
                username: entry.user.username,
                email: entry.user.email,
                credits: 1000,
              },
            });
            results.usersCreated++;
          }
        }

        if (!user) {
          results.errors.push(`Failed to create/get user: ${entry.user.email}`);
          continue;
        }

        // Process each timeline for this user
        for (const timelineData of entry.timelines) {
          try {
            // Create timeline
            const baseSlug = slugify(timelineData.title);
            let slug = baseSlug;
            let counter = 1;

            // Ensure unique slug - use findFirst to avoid Prisma client issues
            let existingTimeline = await prisma.timeline.findFirst({ 
              where: { slug },
              select: { id: true }
            });
            while (existingTimeline) {
              slug = `${baseSlug}-${counter}`;
              counter++;
              existingTimeline = await prisma.timeline.findFirst({ 
                where: { slug },
                select: { id: true }
              });
            }

            const timeline = await createTimeline({
              title: timelineData.title,
              description: timelineData.description,
              slug,
              creator_id: user.id,
              visualization_type: 'horizontal',
              is_public: timelineData.isPublic !== false,
              is_collaborative: false,
            });

            results.timelinesCreated++;

            // Generate events using AI - call the API endpoint
            // Use internal URL for server-side calls
            let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                         process.env.NEXT_PUBLIC_APP_URL || 
                         (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
            
            // Ensure URL has protocol
            if (baseUrl && !baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
              baseUrl = `https://${baseUrl}`;
            }
            
            const generateEventsResponse = await fetch(
              `${baseUrl}/api/ai/generate-events`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  timelineName: timelineData.title,
                  timelineDescription: timelineData.description,
                  maxEvents: timelineData.maxEvents || 20,
                  isFactual: timelineData.isFactual !== false,
                }),
              }
            );

            if (!generateEventsResponse.ok) {
              const errorText = await generateEventsResponse.text();
              let error;
              try {
                error = JSON.parse(errorText);
              } catch {
                error = { error: errorText };
              }
              throw new Error(`Event generation failed: ${error.error || 'Unknown error'}`);
            }

            const { events, imageReferences } = await generateEventsResponse.json();

            if (!events || events.length === 0) {
              throw new Error('No events were generated');
            }

            // Save events to timeline
            for (const event of events) {
              const eventDate = new Date(
                event.year,
                (event.month || 1) - 1,
                event.day || 1
              );

              // Generate description if not provided (using AI)
              let description = event.description || '';
              if (!description && event.title) {
                // For seeding, we can use a simple description or skip
                // In production, you might want to generate descriptions here
                description = `Event: ${event.title}`;
              }

              await createEvent({
                timeline_id: timeline.id,
                title: event.title,
                description: description,
                date: eventDate.toISOString().split('T')[0],
                category: event.category,
                links: event.links || [],
                created_by: user.id,
              });

              results.eventsGenerated++;
            }

            // Generate images if requested
            if (timelineData.generateImages && events.length > 0) {
              try {
                const generateImagesResponse = await fetch(
                  `${baseUrl}/api/ai/generate-images`,
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      events: events.map((e: any) => ({
                        id: e.id || `temp_${Date.now()}_${Math.random()}`,
                        title: e.title,
                        description: e.description || '',
                        year: e.year,
                        month: e.month,
                        day: e.day,
                        imagePrompt: e.imagePrompt || '',
                      })),
                      timelineId: timeline.id,
                      imageStyle: timelineData.imageStyle || 'realistic',
                      imageReferences: imageReferences || [],
                    }),
                  }
                );

                if (generateImagesResponse.ok) {
                  const { images } = await generateImagesResponse.json();
                  if (images && Array.isArray(images)) {
                    // Update events with image URLs
                    const timelineEvents = await prisma.event.findMany({
                      where: { timelineId: timeline.id },
                      orderBy: { date: 'asc' },
                    });

                    for (let i = 0; i < Math.min(images.length, timelineEvents.length); i++) {
                      if (images[i] && typeof images[i] === 'string') {
                        await prisma.event.update({
                          where: { id: timelineEvents[i].id },
                          data: { imageUrl: images[i] },
                        });
                        results.imagesGenerated++;
                      }
                    }
                  }
                }
              } catch (imageError: any) {
                console.error(`[Seed] Image generation failed for timeline ${timeline.id}:`, imageError);
                // Don't fail the whole timeline if images fail
              }
            }
          } catch (timelineError: any) {
            console.error(`[Seed] Failed to create timeline "${timelineData.title}":`, timelineError);
            results.timelinesFailed++;
            results.errors.push(
              `Timeline "${timelineData.title}" (${entry.user.email}): ${timelineError.message}`
            );
          }
        }
      } catch (userError: any) {
        console.error(`[Seed] Failed to process user ${entry.user.email}:`, userError);
        results.errors.push(`User ${entry.user.email}: ${userError.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalUsers: seedData.length,
        usersCreated: results.usersCreated,
        usersSkipped: results.usersSkipped,
        totalTimelines: seedData.reduce((sum, entry) => sum + entry.timelines.length, 0),
        timelinesCreated: results.timelinesCreated,
        timelinesFailed: results.timelinesFailed,
        eventsGenerated: results.eventsGenerated,
        imagesGenerated: results.imagesGenerated,
        errors: results.errors,
      },
    });
  } catch (error: any) {
    console.error('[Seed] Error processing seed file:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process seed file' },
      { status: 500 }
    );
  }
}

