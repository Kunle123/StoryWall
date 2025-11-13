import { NextRequest, NextResponse } from 'next/server';
import { getEventById } from '@/lib/db/events';
import { getCommentsByEventId } from '@/lib/db/comments';
import { prisma } from '@/lib/db/prisma';

// GET /api/events/[id]/stats - Get stats for an event (likes, comments, shares)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const event = await getEventById(id);

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Get comments count (including replies) - handle errors gracefully
    let commentsCount = 0;
    try {
      const comments = await getCommentsByEventId(event.id);
      commentsCount = comments.reduce((total, comment) => {
        return total + 1 + (comment.replies?.length || 0);
      }, 0);
    } catch (commentsError: any) {
      console.warn('[Event Stats] Error fetching comments:', commentsError.message);
      // Continue with 0 comments if there's an error
    }

    // Get likes count for the event (direct likes on the event) - handle errors gracefully
    let likesCount = 0;
    try {
      likesCount = await prisma.like.count({
        where: {
          eventId: event.id,
        },
      });
    } catch (likesError: any) {
      console.warn('[Event Stats] Error fetching likes (table may not exist):', likesError.message);
      // Continue with 0 likes if table doesn't exist
    }

    // For now, shares count is 0 (we can add share tracking later)
    const sharesCount = 0;

    return NextResponse.json({
      comments: commentsCount,
      likes: likesCount,
      shares: sharesCount,
    });
  } catch (error: any) {
    console.error('[Event Stats] Error fetching event stats:', error);
    console.error('[Event Stats] Error details:', {
      message: error.message,
      stack: error.stack?.substring(0, 500),
    });
    return NextResponse.json(
      { error: 'Failed to fetch event stats', details: error.message },
      { status: 500 }
    );
  }
}

