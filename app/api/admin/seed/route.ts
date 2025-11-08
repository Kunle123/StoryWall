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
  themeColor?: string;
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
      createdTimelineIds: [] as string[],
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
          let timeline: any = null; // Track timeline for cleanup
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

            timeline = await createTimeline({
              title: timelineData.title,
              description: timelineData.description,
              slug,
              creator_id: user.id,
              visualization_type: 'horizontal',
              is_public: true, // Always public for seeded timelines
              is_collaborative: false,
            });

            results.timelinesCreated++;
            results.createdTimelineIds.push(timeline.id);

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

            // Generate enhanced descriptions and image prompts
            let eventsWithPrompts = events;
            try {
              console.log(`[Seed] Enhancing descriptions for timeline ${timeline.id} (${events.length} events)`);
              
              const generateDescriptionsResponse = await fetch(
                `${baseUrl}/api/ai/generate-descriptions`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    events: events.map((e: any) => ({
                      year: e.year,
                      title: e.title,
                    })),
                    timelineDescription: timelineData.description,
                    writingStyle: 'narrative',
                    imageStyle: timelineData.imageStyle || 'photorealistic',
                    themeColor: timelineData.themeColor || '#3B82F6',
                  }),
                }
              );

              if (generateDescriptionsResponse.ok) {
                const { descriptions, imagePrompts } = await generateDescriptionsResponse.json();
                
                eventsWithPrompts = events.map((e: any, index: number) => ({
                  ...e,
                  description: descriptions?.[index] || e.description || '',
                  imagePrompt: imagePrompts?.[index] || '',
                }));
                console.log(`[Seed] Enhanced ${eventsWithPrompts.length} events with descriptions and image prompts`);
              } else {
                console.warn(`[Seed] Description enhancement failed, using basic descriptions`);
                eventsWithPrompts = events;
              }
            } catch (descError: any) {
              console.warn(`[Seed] Description generation error:`, descError.message);
              // Continue with basic descriptions
              eventsWithPrompts = events;
            }

            // Save events to timeline
            console.log(`[Seed] Saving ${eventsWithPrompts.length} events to timeline ${timeline.id}...`);
            for (let i = 0; i < eventsWithPrompts.length; i++) {
              const event = eventsWithPrompts[i];
              try {
                // Handle numbered events vs dated events
                let eventDate: string;
                if (event.number !== undefined) {
                  // Numbered event - use a placeholder date (will be sorted by number)
                  eventDate = new Date().toISOString().split('T')[0];
                } else if (event.year) {
                  // Dated event
                  eventDate = new Date(
                    event.year,
                    (event.month || 1) - 1,
                    event.day || 1
                  ).toISOString().split('T')[0];
                } else {
                  // Fallback if no year or number
                  eventDate = new Date().toISOString().split('T')[0];
                }

                await createEvent({
                  timeline_id: timeline.id,
                  title: event.title,
                  description: event.description || '',
                  date: eventDate,
                  number: event.number,
                  number_label: event.numberLabel,
                  category: event.category,
                  links: event.links || [],
                  created_by: user.id,
                });

                results.eventsGenerated++;
                if ((i + 1) % 5 === 0) {
                  console.log(`[Seed] Saved ${i + 1}/${eventsWithPrompts.length} events...`);
                }
              } catch (eventError: any) {
                console.error(`[Seed] Failed to save event ${i + 1} "${event.title}":`, eventError.message);
                // Continue with next event - don't fail entire timeline
              }
            }
            console.log(`[Seed] Successfully saved ${results.eventsGenerated}/${eventsWithPrompts.length} events`);

            // Generate images if requested (using same structure as manual flow)
            if (timelineData.generateImages && eventsWithPrompts.length > 0) {
              try {
                const generateImagesResponse = await fetch(
                  `${baseUrl}/api/ai/generate-images`,
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      events: eventsWithPrompts.map((e: any) => ({
                        title: e.title,
                        description: e.description || '',
                        year: e.year,
                        imagePrompt: e.imagePrompt || '', // Use AI-generated image prompt
                      })),
                      imageStyle: timelineData.imageStyle || 'photorealistic',
                      themeColor: timelineData.themeColor || '#3B82F6', // Use timeline theme color
                      imageReferences: imageReferences || []
                    }),
                  }
                );

                if (generateImagesResponse.ok) {
                  const { images } = await generateImagesResponse.json();
                  console.log(`[Seed] Received ${images?.length || 0} image URLs from generation`);
                  
                  if (images && Array.isArray(images)) {
                    // Update events with image URLs
                    const timelineEvents = await prisma.event.findMany({
                      where: { timelineId: timeline.id },
                      orderBy: { date: 'asc' },
                    });
                    
                    console.log(`[Seed] Found ${timelineEvents.length} events to update with images`);

                    for (let i = 0; i < Math.min(images.length, timelineEvents.length); i++) {
                      if (images[i] && typeof images[i] === 'string') {
                        try {
                          await prisma.event.update({
                            where: { id: timelineEvents[i].id },
                            data: { imageUrl: images[i] },
                          });
                          results.imagesGenerated++;
                          if ((i + 1) % 5 === 0) {
                            console.log(`[Seed] Saved ${i + 1}/${images.length} image URLs to database`);
                          }
                        } catch (imageUpdateError: any) {
                          console.error(`[Seed] Failed to save image URL for event ${timelineEvents[i].id}:`, imageUpdateError.message);
                        }
                      }
                    }
                    console.log(`[Seed] Successfully saved ${results.imagesGenerated} image URLs to database`);
                  }
                }
              } catch (imageError: any) {
                console.error(`[Seed] Image generation failed for timeline ${timeline.id}:`, imageError);
                // Don't fail the whole timeline if images fail
              }
            }
          } catch (timelineError: any) {
            console.error(`[Seed] Failed to create timeline "${timelineData.title}":`, timelineError);
            
            // Clean up: Delete partial timeline if it was created
            if (timeline && timeline.id) {
              try {
                console.log(`[Seed] Cleaning up partial timeline: ${timeline.id}`);
                await prisma.timeline.delete({
                  where: { id: timeline.id },
                });
                console.log(`[Seed] Deleted partial timeline: ${timeline.id}`);
              } catch (cleanupError: any) {
                console.error(`[Seed] Failed to cleanup timeline ${timeline.id}:`, cleanupError);
                // Continue - cleanup failure shouldn't block error reporting
              }
            }
            
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
      createdTimelineIds: results.createdTimelineIds,
    });
  } catch (error: any) {
    console.error('[Seed] Error processing seed file:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process seed file' },
      { status: 500 }
    );
  }
}

