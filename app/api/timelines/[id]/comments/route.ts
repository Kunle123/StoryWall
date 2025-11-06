import { NextRequest, NextResponse } from 'next/server';
import { createComment, getCommentsByTimelineId, updateComment, deleteComment } from '@/lib/db/comments';
import { getTimelineById, getTimelineBySlug } from '@/lib/db/timelines';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser } from '@/lib/db/users';

// Helper to check if a string is a UUID
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// GET /api/timelines/[id]/comments - Get all comments for a timeline
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

    const comments = await getCommentsByTimelineId(timeline.id);
    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST /api/timelines/[id]/comments - Create a new comment
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

    const body = await request.json();
    const { content, parent_id } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    const comment = await createComment({
      timeline_id: timeline.id,
      parent_id: parent_id || undefined,
      user_id: user.id,
      content: content.trim(),
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error: any) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

// PATCH /api/timelines/[id]/comments/[commentId] - Update a comment
// Note: This would typically be at /api/comments/[commentId], but we'll handle it here for now
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser(userId);

    const body = await request.json();
    const { comment_id, content } = body;

    if (!comment_id) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    const comment = await updateComment(comment_id, user.id, content.trim());

    return NextResponse.json(comment);
  } catch (error: any) {
    console.error('Error updating comment:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

// DELETE /api/timelines/[id]/comments/[commentId] - Delete a comment
// Note: This would typically be at /api/comments/[commentId], but we'll handle it here for now
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

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('comment_id');

    if (!commentId) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 }
      );
    }

    await deleteComment(commentId, user.id);

    return NextResponse.json({ message: 'Comment deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting comment:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}

