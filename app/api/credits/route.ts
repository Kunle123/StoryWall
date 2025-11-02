import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      // If no user, return default credits (for unauthenticated users)
      return NextResponse.json({ credits: 100 });
    }

    try {
      // Find user by Clerk ID
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { credits: true },
      });

      if (!user) {
        // User doesn't exist yet - return default credits
        return NextResponse.json({ credits: 100 });
      }

      return NextResponse.json({ credits: user.credits ?? 100 });
    } catch (dbError: any) {
      // If database query fails, return default credits
      console.error('Database error fetching credits:', dbError);
      return NextResponse.json({ credits: 100 });
    }
  } catch (error: any) {
    console.error('Error fetching credits:', error);
    // Always return a valid response even on error
    return NextResponse.json({ credits: 100 });
  }
}

