import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser } from '@/lib/db/users';
import { createLike, deleteLike, getLikeByUserAndComment, getLikesCountByComment } from '@/lib/db/likes';
import { prisma } from '@/lib/db/prisma';

// GET /api/comments/[id]/likes - Get like status and count for a comment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const comment = await prisma.comment.findUnique({
      where: { id: params.id },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const likesCount = await getLikesCountByComment(comment.id);

    // Check if current user has liked this comment
    let userLiked = false;
    try {
      const { userId } = await auth();
      if (userId) {
        const user = await getOrCreateUser(userId);
        const like = await getLikeByUserAndComment(user.id, comment.id);
        userLiked = !!like;
      }
    } catch (error) {
      // Auth might fail, that's okay - just return false for userLiked
      console.log('[Likes] Could not check user like status:', error);
    }

    return NextResponse.json({
      comment_id: comment.id,
      likes_count: likesCount,
      user_liked: userLiked,
    });
  } catch (error) {
    console.error('Error fetching comment likes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch likes' },
      { status: 500 }
    );
  }
}

// POST /api/comments/[id]/likes - Like a comment
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

    const comment = await prisma.comment.findUnique({
      where: { id: params.id },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check if already liked
    const existingLike = await getLikeByUserAndComment(user.id, comment.id);
    if (existingLike) {
      return NextResponse.json({
        message: 'Comment already liked',
        liked: true,
        likes_count: await getLikesCountByComment(comment.id),
      });
    }

    // Create like
    await createLike({
      user_id: user.id,
      comment_id: comment.id,
    });

    const likesCount = await getLikesCountByComment(comment.id);

    return NextResponse.json({
      message: 'Comment liked successfully',
      liked: true,
      likes_count: likesCount,
    });
  } catch (error: any) {
    console.error('Error liking comment:', error);
    return NextResponse.json(
      { error: 'Failed to like comment' },
      { status: 500 }
    );
  }
}

// DELETE /api/comments/[id]/likes - Unlike a comment
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

    const comment = await prisma.comment.findUnique({
      where: { id: params.id },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Delete like
    await deleteLike({
      user_id: user.id,
      comment_id: comment.id,
    });

    const likesCount = await getLikesCountByComment(comment.id);

    return NextResponse.json({
      message: 'Comment unliked successfully',
      liked: false,
      likes_count: likesCount,
    });
  } catch (error: any) {
    console.error('Error unliking comment:', error);
    if (error.message === 'Like not found') {
      return NextResponse.json({
        message: 'Comment was not liked',
        liked: false,
        likes_count: await getLikesCountByComment(params.id),
      });
    }
    return NextResponse.json(
      { error: 'Failed to unlike comment' },
      { status: 500 }
    );
  }
}

