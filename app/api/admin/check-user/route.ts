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

    // Find user by email - use select to avoid bio column if it doesn't exist yet
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        clerkId: true,
        username: true,
        email: true,
        avatarUrl: true,
        credits: true,
        termsAcceptedAt: true,
        createdAt: true,
        updatedAt: true,
        twitterAccessToken: true,
        tiktokAccessToken: true,
        timelines: {
          include: {
            events: {
              orderBy: { date: 'asc' },
              take: 10,
            },
            categories: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Try to get bio separately in case column doesn't exist yet
    let bio: string | null = null;
    try {
      const userWithBio = await prisma.$queryRawUnsafe<Array<{ bio: string | null }>>(
        `SELECT bio FROM users WHERE email = $1 LIMIT 1`,
        email
      );
      bio = userWithBio[0]?.bio || null;
    } catch (error: any) {
      // Bio column doesn't exist yet - this is okay, migration will add it
      console.log('[Admin Check User] Bio column not found, migration may be pending');
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

