import { NextRequest, NextResponse } from 'next/server';
import { createLike, deleteLike, getLikeByUserAndTimeline, getLikesCountByTimeline } from '@/lib/db/likes';
import { getTimelineById, getTimelineBySlug } from '@/lib/db/timelines';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser } from '@/lib/db/users';

// Helper to check if a string is a UUID
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// GET /api/timelines/[id]/likes - Get like status and count for a timeline
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Try to find timeline by ID or slug
    let timeline;
    if (isUUID(params.id)) {
      timeline = await getTimelineById(params.id);
    } else {
      timeline = await getTimelineBySlug(params.id);
    }

    if (!timeline) {
      return NextResponse.json({ error: 'Timeline not found' }, { status: 404 });
    }

    const likesCount = await getLikesCountByTimeline(timeline.id);

    // Check if current user has liked this timeline
    let userLiked = false;
    try {
      const { userId } = await auth();
      if (userId) {
        const user = await getOrCreateUser(userId);
        const like = await getLikeByUserAndTimeline(user.id, timeline.id);
        userLiked = !!like;
      }
    } catch (error) {
      // Auth might fail, that's okay - just return false for userLiked
      console.log('[Likes] Could not check user like status:', error);
    }

    return NextResponse.json({
      timeline_id: timeline.id,
      likes_count: likesCount,
      user_liked: userLiked,
    });
  } catch (error) {
    console.error('Error fetching likes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch likes' },
      { status: 500 }
    );
  }
}

// POST /api/timelines/[id]/likes - Like a timeline
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser(userId);

    // Try to find timeline by ID or slug
    let timeline;
    if (isUUID(params.id)) {
      timeline = await getTimelineById(params.id);
    } else {
      timeline = await getTimelineBySlug(params.id);
    }

    if (!timeline) {
      return NextResponse.json({ error: 'Timeline not found' }, { status: 404 });
    }

    // Check if already liked
    const existingLike = await getLikeByUserAndTimeline(user.id, timeline.id);
    if (existingLike) {
      return NextResponse.json({
        message: 'Timeline already liked',
        liked: true,
        likes_count: await getLikesCountByTimeline(timeline.id),
      });
    }

    // Create like
    await createLike({
      user_id: user.id,
      timeline_id: timeline.id,
    });

    const likesCount = await getLikesCountByTimeline(timeline.id);

    return NextResponse.json({
      message: 'Timeline liked successfully',
      liked: true,
      likes_count: likesCount,
    });
  } catch (error: any) {
    console.error('Error liking timeline:', error);
    return NextResponse.json(
      { error: 'Failed to like timeline' },
      { status: 500 }
    );
  }
}

// DELETE /api/timelines/[id]/likes - Unlike a timeline
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Declare timeline outside try block so it's accessible in catch
  let timeline;
  
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser(userId);

    // Try to find timeline by ID or slug
    if (isUUID(params.id)) {
      timeline = await getTimelineById(params.id);
    } else {
      timeline = await getTimelineBySlug(params.id);
    }

    if (!timeline) {
      return NextResponse.json({ error: 'Timeline not found' }, { status: 404 });
    }

    // Delete like
    await deleteLike({
      user_id: user.id,
      timeline_id: timeline.id,
    });

    const likesCount = await getLikesCountByTimeline(timeline.id);

    return NextResponse.json({
      message: 'Timeline unliked successfully',
      liked: false,
      likes_count: likesCount,
    });
  } catch (error: any) {
    console.error('Error unliking timeline:', error);

    if (error.message === 'Like not found') {
      return NextResponse.json({
        message: 'Timeline was not liked',
        liked: false,
        likes_count: await getLikesCountByTimeline(timeline?.id || params.id),
      });
    }

    return NextResponse.json(
      { error: 'Failed to unlike timeline' },
      { status: 500 }
    );
  }
}

