import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserByClerkId, updateUserProfile } from '@/lib/db/users';

// GET /api/user/profile - Get current user's profile
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await getUserByClerkId(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: user.id,
      clerk_id: user.clerkId,
      username: user.username,
      email: user.email,
      avatar_url: user.avatarUrl,
      credits: user.credits,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PATCH /api/user/profile - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { username, avatar_url, bio } = body;

    // Validate input
    if (username !== undefined) {
      if (typeof username !== 'string' || username.trim().length === 0) {
        return NextResponse.json(
          { error: 'Username cannot be empty' },
          { status: 400 }
        );
      }
      if (username.length > 50) {
        return NextResponse.json(
          { error: 'Username must be 50 characters or less' },
          { status: 400 }
        );
      }
      // Basic validation: alphanumeric, underscore, hyphen
      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        return NextResponse.json(
          { error: 'Username can only contain letters, numbers, underscores, and hyphens' },
          { status: 400 }
        );
      }
    }

    if (avatar_url !== undefined && typeof avatar_url !== 'string') {
      return NextResponse.json(
        { error: 'Invalid avatar URL' },
        { status: 400 }
      );
    }

    if (bio !== undefined) {
      if (typeof bio !== 'string') {
        return NextResponse.json(
          { error: 'Bio must be a string' },
          { status: 400 }
        );
      }
      if (bio.length > 500) {
        return NextResponse.json(
          { error: 'Bio must be 500 characters or less' },
          { status: 400 }
        );
      }
    }

    const updatedUser = await updateUserProfile(userId, {
      username: username?.trim(),
      avatarUrl: avatar_url || undefined,
      bio: bio !== undefined ? (bio.trim() || null) : undefined,
    });

    return NextResponse.json({
      id: updatedUser.id,
      clerk_id: updatedUser.clerkId,
      username: updatedUser.username,
      email: updatedUser.email,
      avatar_url: updatedUser.avatarUrl,
      bio: updatedUser.bio,
      credits: updatedUser.credits,
      created_at: updatedUser.createdAt.toISOString(),
      updated_at: updatedUser.updatedAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    
    if (error.message === 'Username is already taken') {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}

