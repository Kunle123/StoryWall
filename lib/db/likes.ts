import { prisma } from './prisma';

export interface Like {
  id: string;
  user_id: string;
  timeline_id?: string;
  comment_id?: string;
  created_at: string;
}

export interface CreateLikeInput {
  user_id: string;
  timeline_id?: string;
  comment_id?: string;
}

export async function createLike(input: CreateLikeInput): Promise<Like> {
  // Validate that exactly one of timeline_id or comment_id is provided
  if (!input.timeline_id && !input.comment_id) {
    throw new Error('Either timeline_id or comment_id must be provided');
  }
  if (input.timeline_id && input.comment_id) {
    throw new Error('Cannot like both timeline and comment at the same time');
  }

  // Check if like already exists
  const existingLike = await prisma.like.findFirst({
    where: {
      userId: input.user_id,
      ...(input.timeline_id ? { timelineId: input.timeline_id } : {}),
      ...(input.comment_id ? { commentId: input.comment_id } : {}),
    },
  });

  if (existingLike) {
    // Return existing like (idempotent)
    return transformLike(existingLike);
  }

  const like = await prisma.like.create({
    data: {
      userId: input.user_id,
      timelineId: input.timeline_id || null,
      commentId: input.comment_id || null,
    },
  });

  return transformLike(like);
}

export async function deleteLike(input: CreateLikeInput): Promise<void> {
  // Validate that exactly one of timeline_id or comment_id is provided
  if (!input.timeline_id && !input.comment_id) {
    throw new Error('Either timeline_id or comment_id must be provided');
  }
  if (input.timeline_id && input.comment_id) {
    throw new Error('Cannot unlike both timeline and comment at the same time');
  }

  const like = await prisma.like.findFirst({
    where: {
      userId: input.user_id,
      ...(input.timeline_id ? { timelineId: input.timeline_id } : {}),
      ...(input.comment_id ? { commentId: input.comment_id } : {}),
    },
  });

  if (!like) {
    throw new Error('Like not found');
  }

  await prisma.like.delete({
    where: { id: like.id },
  });
}

export async function getLikeByUserAndTimeline(
  userId: string,
  timelineId: string
): Promise<Like | null> {
  const like = await prisma.like.findUnique({
    where: {
      userId_timelineId: {
        userId,
        timelineId,
      },
    },
  });

  if (!like) return null;
  return transformLike(like);
}

export async function getLikeByUserAndComment(
  userId: string,
  commentId: string
): Promise<Like | null> {
  const like = await prisma.like.findUnique({
    where: {
      userId_commentId: {
        userId,
        commentId,
      },
    },
  });

  if (!like) return null;
  return transformLike(like);
}

export async function getLikesCountByTimeline(timelineId: string): Promise<number> {
  return await prisma.like.count({
    where: { timelineId },
  });
}

export async function getLikesCountByComment(commentId: string): Promise<number> {
  return await prisma.like.count({
    where: { commentId },
  });
}

export async function getUserLikedTimelines(userId: string): Promise<string[]> {
  const likes = await prisma.like.findMany({
    where: {
      userId,
      timelineId: { not: null },
    },
    select: { timelineId: true },
  });

  return likes.map((like) => like.timelineId!).filter(Boolean);
}

export async function getUserLikedComments(userId: string): Promise<string[]> {
  const likes = await prisma.like.findMany({
    where: {
      userId,
      commentId: { not: null },
    },
    select: { commentId: true },
  });

  return likes.map((like) => like.commentId!).filter(Boolean);
}

// Helper function to transform Prisma models to our TypeScript types
function transformLike(like: any): Like {
  return {
    id: like.id,
    user_id: like.userId,
    timeline_id: like.timelineId || undefined,
    comment_id: like.commentId || undefined,
    created_at: like.createdAt.toISOString(),
  };
}
