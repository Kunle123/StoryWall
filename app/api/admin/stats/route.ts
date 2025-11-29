import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { isAdminEmail } from '@/lib/utils/admin';

/**
 * GET /api/admin/stats - Get admin dashboard statistics
 * 
 * Requires admin access (checked by email)
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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

    // Fetch statistics
    const [
      totalUsers,
      totalTimelines,
      totalEvents,
      totalImages,
      usersWithCredits,
      recentUsers,
      recentTimelines,
    ] = await Promise.all([
      // Total counts
      prisma.user.count(),
      prisma.timeline.count(),
      prisma.event.count(),
      prisma.event.count({
        where: {
          imageUrl: {
            not: null,
          },
        },
      }),
      // Total credits
      prisma.user.aggregate({
        _sum: {
          credits: true,
        },
      }),
      // Recent users (last 10)
      prisma.user.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          username: true,
          email: true,
          credits: true,
          createdAt: true,
        },
      }),
      // Recent timelines (last 10)
      prisma.timeline.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          title: true,
          isPublic: true,
          createdAt: true,
          _count: {
            select: {
              events: true,
            },
          },
        },
      }),
    ]);

    // Format recent timelines
    const formattedTimelines = recentTimelines.map((timeline) => ({
      id: timeline.id,
      title: timeline.title,
      eventCount: timeline._count.events,
      isPublic: timeline.isPublic,
      createdAt: timeline.createdAt.toISOString(),
    }));

    // Format recent users
    const formattedUsers = recentUsers.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      credits: user.credits,
      createdAt: user.createdAt.toISOString(),
    }));

    return NextResponse.json({
      totalUsers,
      totalTimelines,
      totalEvents,
      totalImages,
      totalCredits: usersWithCredits._sum.credits || 0,
      recentUsers: formattedUsers,
      recentTimelines: formattedTimelines,
    });
  } catch (error: any) {
    console.error('[Admin Stats] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin statistics' },
      { status: 500 }
    );
  }
}

