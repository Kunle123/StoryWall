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
    let clerkUser;
    try {
      clerkUser = await currentUser();
    } catch (error) {
      // In webhook contexts, currentUser() might not be available
      // Create a minimal user record
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
    }
    
    // Ensure username is unique
    let username = baseUsername;
    let counter = 1;
    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // Create user
    user = await prisma.user.create({
      data: {
        clerkId: clerkUserId,
        username,
        email,
        avatarUrl: clerkUser?.imageUrl || undefined,
        credits: 100, // Default starting credits
      },
      select: { id: true, credits: true },
    });

    console.log(`Created new user in database: ${user.id} (Clerk: ${clerkUserId})`);
    return user;
  } catch (error: any) {
    console.error('Error creating user:', error);
    throw new Error('Failed to create user account');
  }
}

