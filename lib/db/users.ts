import { prisma } from './prisma';
import { currentUser } from '@clerk/nextjs/server';

/**
 * Get or create a user in the database from Clerk authentication
 * This ensures users are automatically created when they first use features
 */
export async function getOrCreateUser(clerkUserId: string): Promise<{ id: string; credits: number }> {
  // Check if user exists
  let user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    select: { id: true, credits: true },
  });

  if (user) {
    return user;
  }

  // User doesn't exist - get info from Clerk and create
  try {
    let clerkUser = null;
    
    // Try to get Clerk user info (this might fail in API routes, so wrap in try-catch)
    try {
      clerkUser = await currentUser();
    } catch (error: any) {
      // In API routes, currentUser() might not work properly
      // This is okay - we'll create a minimal user record
      console.log(`[getOrCreateUser] Could not fetch Clerk user info: ${error.message || 'Not available in this context'}`);
      clerkUser = null;
    }

    // Generate username from email or use first available
    let baseUsername = 'user';
    let email = `${clerkUserId}@placeholder.com`;
    
    if (clerkUser) {
      baseUsername = clerkUser.emailAddresses[0]?.emailAddress?.split('@')[0] || 
                    clerkUser.firstName?.toLowerCase() || 
                    'user';
      email = clerkUser.emailAddresses[0]?.emailAddress || email;
    } else {
      // Use a portion of the Clerk ID for username
      baseUsername = `user${clerkUserId.slice(-6)}`;
    }
    
    // Ensure username is unique (check existing users)
    let username = baseUsername;
    let counter = 1;
    let existingUser = await prisma.user.findUnique({ where: { username } });
    while (existingUser) {
      username = `${baseUsername}${counter}`;
      existingUser = await prisma.user.findUnique({ where: { username } });
      counter++;
      if (counter > 1000) {
        // Safety check to avoid infinite loop
        username = `user${Date.now()}`;
        break;
      }
    }

    // Ensure email is unique too
    let finalEmail = email;
    counter = 1;
    existingUser = await prisma.user.findUnique({ where: { email: finalEmail } });
    while (existingUser) {
      finalEmail = `${baseUsername}${counter}@placeholder.com`;
      existingUser = await prisma.user.findUnique({ where: { email: finalEmail } });
      counter++;
      if (counter > 1000) {
        finalEmail = `user${Date.now()}@placeholder.com`;
        break;
      }
    }

    // Create user
    user = await prisma.user.create({
      data: {
        clerkId: clerkUserId,
        username,
        email: finalEmail,
        avatarUrl: clerkUser?.imageUrl || undefined,
        credits: 30, // Default starting credits
      },
      select: { id: true, credits: true },
    });

    console.log(`[getOrCreateUser] Created new user in database: ${user.id} (Clerk: ${clerkUserId}, username: ${username})`);
    return user;
  } catch (error: any) {
    console.error('[getOrCreateUser] Error creating user:', error);
    console.error('[getOrCreateUser] Error code:', error.code);
    console.error('[getOrCreateUser] Error message:', error.message);
    console.error('[getOrCreateUser] Error meta:', error.meta);
    
    // Provide helpful error message for permission issues
    if (error.code === 'P1000' || error.message?.includes('denied access') || error.message?.includes('permission denied')) {
      const errorMsg = 'Database permission error. Please check your DATABASE_URL:\n' +
        '1. For local: Use postgresql://admin@localhost:5432/storywall\n' +
        '2. For Railway: Get connection string from Railway dashboard\n' +
        '3. Make sure the user has proper permissions on the database';
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    // Handle unique constraint violations
    if (error.code === 'P2002') {
      console.error('[getOrCreateUser] Unique constraint violation:', error.meta);
      // Try to find existing user (race condition)
      const existingUser = await prisma.user.findUnique({
        where: { clerkId: clerkUserId },
        select: { id: true, credits: true },
      });
      if (existingUser) {
        console.log('[getOrCreateUser] User was created by another request, returning existing user');
        return existingUser;
      }
      throw new Error(`Failed to create user: ${error.meta?.target || 'duplicate entry'}`);
    }
    
    throw new Error(`Failed to create user account: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Get user by Clerk ID with full profile information
 */
export async function getUserByClerkId(clerkUserId: string) {
  return await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    select: {
      id: true,
      clerkId: true,
      username: true,
      email: true,
      avatarUrl: true,
      credits: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * Get user by database ID with full profile information
 */
export async function getUserById(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      clerkId: true,
      username: true,
      email: true,
      avatarUrl: true,
      bio: true,
      credits: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * Update user profile (username and/or avatarUrl)
 */
export async function updateUserProfile(
  clerkUserId: string,
  updates: {
    username?: string;
    avatarUrl?: string;
    bio?: string;
  }
) {
  // Check if username is being updated and if it's already taken
  if (updates.username) {
    const existingUser = await prisma.user.findFirst({
      where: {
        username: updates.username,
        clerkId: { not: clerkUserId }, // Exclude current user
      },
    });
    
    if (existingUser) {
      throw new Error('Username is already taken');
    }
  }

  return await prisma.user.update({
    where: { clerkId: clerkUserId },
    data: {
      ...(updates.username && { username: updates.username }),
      ...(updates.avatarUrl !== undefined && { avatarUrl: updates.avatarUrl }),
      ...(updates.bio !== undefined && { bio: updates.bio || null }),
    },
    select: {
      id: true,
      clerkId: true,
      username: true,
      email: true,
      avatarUrl: true,
      bio: true,
      credits: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

