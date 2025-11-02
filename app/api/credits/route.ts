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
      console.log('[Credits API] No userId, returning default 100');
      return NextResponse.json({ credits: 100 });
    }

    try {
      // Get or create user (auto-creates if doesn't exist)
      const user = await getOrCreateUser(userId);
      console.log(`[Credits API] User ${userId} has ${user.credits} credits`);
      return NextResponse.json({ credits: user.credits ?? 100 });
    } catch (dbError: any) {
      // If database query fails, log the actual error
      console.error('[Credits API] Database error:', dbError.message || dbError);
      
      // Check if it's a permission/connection error
      if (dbError.message?.includes('denied access') || dbError.message?.includes('permission denied')) {
        console.error('[Credits API] Database permission error - database may not exist or user lacks permissions');
        console.error('[Credits API] Try: npx prisma db push to create database schema');
      }
      
      // Still return default credits to prevent UI errors, but log the issue
      return NextResponse.json({ 
        credits: 100,
        error: 'Database error',
        message: dbError.message || 'Failed to fetch credits'
      });
    }
  } catch (error: any) {
    console.error('[Credits API] Unexpected error:', error);
    // Always return a valid response even on error
    return NextResponse.json({ credits: 100, error: 'Unexpected error' });
  }
}

