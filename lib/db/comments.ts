import { prisma } from './prisma';

export interface Comment {
  id: string;
  timeline_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  likes_count?: number;
}

export interface CreateCommentInput {
  timeline_id: string;
  user_id: string;
  content: string;
}

export async function createComment(input: CreateCommentInput): Promise<Comment> {
  const comment = await prisma.comment.create({
    data: {
      timelineId: input.timeline_id,
      userId: input.user_id,
      content: input.content,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
      likes: true,
    },
  });

  return transformComment(comment);
}

export async function getCommentsByTimelineId(timelineId: string): Promise<Comment[]> {
  const comments = await prisma.comment.findMany({
    where: { timelineId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
      likes: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return comments.map(transformComment);
}

export async function getCommentById(id: string): Promise<Comment | null> {
  const comment = await prisma.comment.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
      likes: true,
    },
  });

  if (!comment) return null;
  return transformComment(comment);
}

export async function updateComment(
  id: string,
  userId: string,
  content: string
): Promise<Comment> {
  // Check ownership
  const comment = await prisma.comment.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!comment || comment.userId !== userId) {
    throw new Error('Unauthorized');
  }

  const updated = await prisma.comment.update({
    where: { id },
    data: { content },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
      likes: true,
    },
  });

  return transformComment(updated);
}

export async function deleteComment(id: string, userId: string): Promise<void> {
  // Check ownership
  const comment = await prisma.comment.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!comment || comment.userId !== userId) {
    throw new Error('Unauthorized');
  }

  await prisma.comment.delete({
    where: { id },
  });
}

// Helper function to transform Prisma models to our TypeScript types
function transformComment(comment: any): Comment {
  return {
    id: comment.id,
    timeline_id: comment.timelineId,
    user_id: comment.userId,
    content: comment.content,
    created_at: comment.createdAt.toISOString(),
    updated_at: comment.updatedAt.toISOString(),
    user: comment.user
      ? {
          id: comment.user.id,
          username: comment.user.username,
          avatar_url: comment.user.avatarUrl || undefined,
        }
      : undefined,
    likes_count: comment.likes ? comment.likes.length : 0,
  };
}

