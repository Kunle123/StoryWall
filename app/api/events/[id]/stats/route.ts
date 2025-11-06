import { NextRequest, NextResponse } from 'next/server';
import { getEventById } from '@/lib/db/events';
import { getCommentsByEventId } from '@/lib/db/comments';
import { prisma } from '@/lib/db/prisma';

// GET /api/events/[id]/stats - Get stats for an event (likes, comments, shares)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const event = await getEventById(params.id);

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Get comments count (including replies)
    const comments = await getCommentsByEventId(event.id);
    const commentsCount = comments.reduce((total, comment) => {
      return total + 1 + (comment.replies?.length || 0);
    }, 0);

    // Get likes count for the event (direct likes on the event)
    const likesCount = await prisma.like.count({
      where: {
        eventId: event.id,
      },
    });

    // For now, shares count is 0 (we can add share tracking later)
    const sharesCount = 0;

    return NextResponse.json({
      comments: commentsCount,
      likes: likesCount,
      shares: sharesCount,
    });
  } catch (error: any) {
    console.error('Error fetching event stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event stats' },
      { status: 500 }
    );
  }
}

