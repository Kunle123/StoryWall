import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@clerk/nextjs/server';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

// Admin email check
function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const adminEmails = [
    'kunle2000@gmail.com',
    // Add other admin emails here
  ];
  return adminEmails.includes(email.toLowerCase());
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication - use try-catch to handle Clerk middleware detection issues
    let userId: string | null = null;
    try {
      const authResult = await auth();
      userId = authResult?.userId || null;
    } catch (authError: any) {
      console.warn('[Admin Check User] Clerk auth error:', authError?.message);
      return NextResponse.json(
        { error: 'Authentication error. Please ensure you are signed in.' },
        { status: 401 }
      );
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's email from Clerk
    let clerkUser;
    try {
      const { currentUser } = await import('@clerk/nextjs/server');
      clerkUser = await currentUser();
    } catch (error: any) {
      console.error('[Admin Check User] Error getting current user:', error);
      return NextResponse.json(
        { error: 'Failed to get user information' },
        { status: 500 }
      );
    }
    
    if (!clerkUser || !isAdminEmail(clerkUser.emailAddresses[0]?.emailAddress)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get email from query params
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    console.log(`[Admin Check User] Checking account data for: ${email}`);

    // Check which columns exist
    const bioExists = await checkColumnExists('users', 'bio');
    const termsExists = await checkColumnExists('users', 'terms_accepted_at');

    // Build SELECT query dynamically based on existing columns
    const selectFields = [
      'id', 'clerk_id', 'username', 'email', 'avatar_url', 'credits',
      'created_at', 'updated_at', 'twitter_access_token', 'tiktok_access_token'
    ];
    if (bioExists) selectFields.push('bio');
    if (termsExists) selectFields.push('terms_accepted_at');

    // Use raw SQL to avoid Prisma schema mismatches with missing columns
    const userRow = await prisma.$queryRawUnsafe<Array<{
      id: string;
      clerk_id: string;
      username: string;
      email: string;
      avatar_url: string | null;
      credits: number;
      created_at: Date;
      updated_at: Date;
      twitter_access_token: string | null;
      tiktok_access_token: string | null;
      bio?: string | null;
      terms_accepted_at?: Date | null;
    }>>(`
      SELECT ${selectFields.join(', ')}
      FROM users 
      WHERE email = $1 
      LIMIT 1
    `, email);

    if (!userRow || userRow.length === 0) {
      // Check for similar emails
      const similarUsers = await prisma.$queryRawUnsafe<Array<{
        id: string;
        email: string;
        username: string;
        clerk_id: string;
        created_at: Date;
      }>>(`
        SELECT id, email, username, clerk_id, created_at
        FROM users
        WHERE email LIKE $1
        LIMIT 10
      `, `%${email.split('@')[0]}%`);

      return NextResponse.json({
        found: false,
        message: `User with email "${email}" not found`,
        similarUsers: similarUsers.length > 0 ? similarUsers : undefined,
      });
    }

    const userData = userRow[0];
    const bio = userData.bio || null;
    const termsAcceptedAt = userData.terms_accepted_at || null;

    // Get timelines using raw SQL to avoid column issues
    const timelines = await prisma.$queryRawUnsafe<Array<{
      id: string;
      title: string;
      slug: string;
      is_public: boolean;
      is_featured: boolean;
      created_at: Date;
    }>>(`
      SELECT id, title, slug, is_public, is_featured, created_at
      FROM timelines
      WHERE creator_id = $1
      ORDER BY created_at DESC
    `, userData.id);

    // Get events for each timeline
    const timelineIds = timelines.map(t => t.id);
    const events = timelineIds.length > 0 ? await prisma.$queryRawUnsafe<Array<{
      id: string;
      timeline_id: string;
      title: string;
      date: Date;
    }>>(`
      SELECT id, timeline_id, title, date
      FROM events
      WHERE timeline_id = ANY($1::uuid[])
      ORDER BY date ASC
      LIMIT 100
    `, timelineIds) : [];

    // Group events by timeline
    const eventsByTimeline = new Map<string, typeof events>();
    events.forEach(event => {
      if (!eventsByTimeline.has(event.timeline_id)) {
        eventsByTimeline.set(event.timeline_id, []);
      }
      eventsByTimeline.get(event.timeline_id)!.push(event);
    });

    const timelinesWithEvents = timelines.map(timeline => ({
      id: timeline.id,
      title: timeline.title,
      slug: timeline.slug,
      isPublic: timeline.is_public,
      isFeatured: timeline.is_featured || false,
      eventCount: eventsByTimeline.get(timeline.id)?.length || 0,
      events: (eventsByTimeline.get(timeline.id) || []).slice(0, 10).map(e => ({
        id: e.id,
        title: e.title,
        date: e.date,
      })),
      createdAt: timeline.created_at,
    }));

    // Get statistics
    const eventCountResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(`
      SELECT COUNT(*) as count FROM events WHERE created_by = $1
    `, userData.id);
    const eventCount = Number(eventCountResult[0]?.count || 0);

    const categoryCountResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(`
      SELECT COUNT(*) as count 
      FROM categories 
      WHERE timeline_id IN (SELECT id FROM timelines WHERE creator_id = $1)
    `, userData.id);
    const categoryCount = Number(categoryCountResult[0]?.count || 0);

    const response = {
      found: true,
      user: {
        id: userData.id,
        clerkId: userData.clerk_id,
        username: userData.username,
        email: userData.email,
        avatarUrl: userData.avatar_url,
        bio: bio,
        credits: userData.credits,
        termsAcceptedAt: termsAcceptedAt,
        createdAt: userData.created_at,
        updatedAt: userData.updated_at,
        twitterConnected: !!userData.twitter_access_token,
        tiktokConnected: !!userData.tiktok_access_token,
      },
      timelines: timelinesWithEvents,
      statistics: {
        timelineCount: timelines.length,
        totalEventCount: eventCount,
        categoryCount: categoryCount,
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[Admin Check User] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check user data' },
      { status: 500 }
    );
  }
}

// Helper function to check if a column exists
async function checkColumnExists(tableName: string, columnName: string): Promise<boolean> {
  try {
    const result = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = $1 
        AND column_name = $2
      ) as exists
    `, tableName, columnName);
    return result[0]?.exists || false;
  } catch {
    return false;
  }
}

    if (!user) {
      // Check for similar emails
      const similarUsers = await prisma.user.findMany({
        where: {
          email: {
            contains: email.split('@')[0], // Search by username part
          },
        },
        select: {
          id: true,
          email: true,
          username: true,
          clerkId: true,
          createdAt: true,
        },
        take: 10,
      });

      return NextResponse.json({
        found: false,
        message: `User with email "${email}" not found`,
        similarUsers: similarUsers.length > 0 ? similarUsers : undefined,
      });
    }

    // Get additional statistics
    const eventCount = await prisma.event.count({
      where: { createdBy: user.id },
    });

    const categoryCount = await prisma.category.count({
      where: { timeline: { creatorId: user.id } },
    });

    // Format response
    const response = {
      found: true,
      user: {
        id: user.id,
        clerkId: user.clerkId,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        bio: bio,
        credits: user.credits,
        termsAcceptedAt: user.termsAcceptedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        twitterConnected: !!user.twitterAccessToken,
        tiktokConnected: !!user.tiktokAccessToken,
      },
      timelines: user.timelines.map(timeline => ({
        id: timeline.id,
        title: timeline.title,
        slug: timeline.slug,
        isPublic: timeline.isPublic,
        isFeatured: timeline.isFeatured,
        eventCount: timeline.events.length,
        events: timeline.events.map(e => ({
          id: e.id,
          title: e.title,
          date: e.date,
        })),
        createdAt: timeline.createdAt,
      })),
      statistics: {
        timelineCount: user.timelines.length,
        totalEventCount: eventCount,
        categoryCount: categoryCount,
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[Admin Check User] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check user data' },
      { status: 500 }
    );
  }
}

