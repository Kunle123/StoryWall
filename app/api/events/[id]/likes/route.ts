import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser } from '@/lib/db/users';
import { createLike, deleteLike, getLikeByUserAndEvent, getLikesCountByEvent } from '@/lib/db/likes';
import { getEventById } from '@/lib/db/events';

// GET /api/events/[id]/likes - Get like status and count for an event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const event = await getEventById(params.id);

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const likesCount = await getLikesCountByEvent(event.id);

    // Check if current user has liked this event
    let userLiked = false;
    try {
      const { userId } = await auth();
      if (userId) {
        const user = await getOrCreateUser(userId);
        const like = await getLikeByUserAndEvent(user.id, event.id);
        userLiked = !!like;
      }
    } catch (error) {
      // Auth might fail, that's okay - just return false for userLiked
      console.log('[Likes] Could not check user like status:', error);
    }

    return NextResponse.json({
      event_id: event.id,
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

// POST /api/events/[id]/likes - Like an event
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

    const event = await getEventById(params.id);

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if already liked
    const existingLike = await getLikeByUserAndEvent(user.id, event.id);
    if (existingLike) {
      return NextResponse.json({
        message: 'Event already liked',
        liked: true,
        likes_count: await getLikesCountByEvent(event.id),
      });
    }

    // Create like
    await createLike({
      user_id: user.id,
      event_id: event.id,
    });

    const likesCount = await getLikesCountByEvent(event.id);

    return NextResponse.json({
      message: 'Event liked successfully',
      liked: true,
      likes_count: likesCount,
    });
  } catch (error: any) {
    console.error('Error liking event:', error);
    return NextResponse.json(
      { error: 'Failed to like event' },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id]/likes - Unlike an event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser(userId);

    const event = await getEventById(params.id);

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Delete like
    await deleteLike({
      user_id: user.id,
      event_id: event.id,
    });

    const likesCount = await getLikesCountByEvent(event.id);

    return NextResponse.json({
      message: 'Event unliked successfully',
      liked: false,
      likes_count: likesCount,
    });
  } catch (error: any) {
    console.error('Error unliking event:', error);
    if (error.message === 'Like not found') {
      return NextResponse.json({
        message: 'Event was not liked',
        liked: false,
        likes_count: await getLikesCountByEvent(params.id),
      });
    }
    return NextResponse.json(
      { error: 'Failed to unlike event' },
      { status: 500 }
    );
  }
}

