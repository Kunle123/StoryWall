import { prisma } from './prisma';

export interface CreateFollowInput {
  follower_id: string;
  following_id: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: Date;
}

/**
 * Create a follow relationship
 */
export async function createFollow(input: CreateFollowInput): Promise<Follow> {
  // Prevent self-follow
  if (input.follower_id === input.following_id) {
    throw new Error("Cannot follow yourself");
  }

  // Check if already following
  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: input.follower_id,
        followingId: input.following_id,
      },
    },
  });

  if (existing) {
    throw new Error("Already following this user");
  }

  const follow = await prisma.follow.create({
    data: {
      followerId: input.follower_id,
      followingId: input.following_id,
    },
  });

  return {
    id: follow.id,
    follower_id: follow.followerId,
    following_id: follow.followingId,
    created_at: follow.createdAt,
  };
}

/**
 * Delete a follow relationship (unfollow)
 */
export async function deleteFollow(input: CreateFollowInput): Promise<void> {
  await prisma.follow.deleteMany({
    where: {
      followerId: input.follower_id,
      followingId: input.following_id,
    },
  });
}

/**
 * Check if a user is following another user
 */
export async function isFollowing(
  followerId: string,
  followingId: string
): Promise<boolean> {
  const follow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
  });

  return !!follow;
}

/**
 * Get all users that a user is following
 */
export async function getFollowing(userId: string): Promise<string[]> {
  const follows = await prisma.follow.findMany({
    where: {
      followerId: userId,
    },
    select: {
      followingId: true,
    },
  });

  return follows.map((f) => f.followingId);
}

/**
 * Get all users that follow a user
 */
export async function getFollowers(userId: string): Promise<string[]> {
  const follows = await prisma.follow.findMany({
    where: {
      followingId: userId,
    },
    select: {
      followerId: true,
    },
  });

  return follows.map((f) => f.followerId);
}

/**
 * Get follower count for a user
 */
export async function getFollowerCount(userId: string): Promise<number> {
  return await prisma.follow.count({
    where: {
      followingId: userId,
    },
  });
}

/**
 * Get following count for a user
 */
export async function getFollowingCount(userId: string): Promise<number> {
  return await prisma.follow.count({
    where: {
      followerId: userId,
    },
  });
}

