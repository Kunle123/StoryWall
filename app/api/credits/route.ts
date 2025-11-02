import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find user by Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { credits: true },
    });

    if (!user) {
      // User doesn't exist yet - return default credits
      return NextResponse.json({ credits: 100 });
    }

    return NextResponse.json({ credits: user.credits });
  } catch (error: any) {
    console.error('Error fetching credits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credits' },
      { status: 500 }
    );
  }
}

