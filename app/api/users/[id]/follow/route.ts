import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser, getUserById, getUserByClerkId } from "@/lib/db/users";
import { createFollow, deleteFollow, isFollowing, getFollowerCount, getFollowingCount } from "@/lib/db/follows";

// Helper to check if a string is a UUID (database ID)
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// GET /api/users/[id]/follow - Check follow status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await getOrCreateUser(clerkUserId);
    
    // Try to get target user by database ID first, then by Clerk ID
    let targetUser = null;
    if (isUUID(params.id)) {
      targetUser = await getUserById(params.id);
    } else {
      targetUser = await getUserByClerkId(params.id);
    }

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if current user is following target user
    const following = await isFollowing(currentUser.id, targetUser.id);
    const followerCount = await getFollowerCount(targetUser.id);
    const followingCount = await getFollowingCount(targetUser.id);

    return NextResponse.json({
      following,
      follower_count: followerCount,
      following_count: followingCount,
    });
  } catch (error: any) {
    console.error('Error checking follow status:', error);
    return NextResponse.json(
      { error: 'Failed to check follow status' },
      { status: 500 }
    );
  }
}

// POST /api/users/[id]/follow - Follow a user
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await getOrCreateUser(clerkUserId);
    
    // Try to get target user by database ID first, then by Clerk ID
    let targetUser = null;
    if (isUUID(params.id)) {
      targetUser = await getUserById(params.id);
    } else {
      targetUser = await getUserByClerkId(params.id);
    }

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (currentUser.id === targetUser.id) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    try {
      await createFollow({
        follower_id: currentUser.id,
        following_id: targetUser.id,
      });

      const followerCount = await getFollowerCount(targetUser.id);
      const followingCount = await getFollowingCount(targetUser.id);

      return NextResponse.json({
        message: 'User followed successfully',
        following: true,
        follower_count: followerCount,
        following_count: followingCount,
      });
    } catch (error: any) {
      if (error.message === 'Already following this user') {
        return NextResponse.json({
          message: 'Already following this user',
          following: true,
          follower_count: await getFollowerCount(targetUser.id),
          following_count: await getFollowingCount(targetUser.id),
        });
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Error following user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to follow user' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id]/follow - Unfollow a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await getOrCreateUser(clerkUserId);
    
    // Try to get target user by database ID first, then by Clerk ID
    let targetUser = null;
    if (isUUID(params.id)) {
      targetUser = await getUserById(params.id);
    } else {
      targetUser = await getUserByClerkId(params.id);
    }

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await deleteFollow({
      follower_id: currentUser.id,
      following_id: targetUser.id,
    });

    const followerCount = await getFollowerCount(targetUser.id);
    const followingCount = await getFollowingCount(targetUser.id);

    return NextResponse.json({
      message: 'User unfollowed successfully',
      following: false,
      follower_count: followerCount,
      following_count: followingCount,
    });
  } catch (error: any) {
    console.error('Error unfollowing user:', error);
    return NextResponse.json(
      { error: 'Failed to unfollow user' },
      { status: 500 }
    );
  }
}

