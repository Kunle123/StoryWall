import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { getOrCreateUser } from '@/lib/db/users';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    let userId: string | null = null;
    
    // Safely try to get user ID from Clerk
    try {
      const authResult = await auth();
      userId = authResult?.userId || null;
    } catch (authError: any) {
      // Clerk might not be configured or might throw an error
      // Log but continue with userId as null
      console.warn('Clerk auth error (non-fatal):', authError?.message || 'Clerk not configured');
      userId = null;
    }
    
    if (!userId) {
      // If no user, return default credits (for unauthenticated users)
      return NextResponse.json({ credits: 100 });
    }

    try {
      // Get or create user (auto-creates if doesn't exist)
      const user = await getOrCreateUser(userId);
      return NextResponse.json({ credits: user.credits ?? 100 });
    } catch (dbError: any) {
      // If database query fails, return default credits
      console.error('Database error fetching credits:', dbError);
      return NextResponse.json({ credits: 100 });
    }
  } catch (error: any) {
    console.error('Unexpected error fetching credits:', error);
    // Always return a valid response even on error
    return NextResponse.json({ credits: 100 });
  }
}

