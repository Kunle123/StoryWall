import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser } from '@/lib/db/users';
import { prisma } from '@/lib/db/prisma';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser(userId);
    
    // Update user with terms acceptance timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: {
        termsAcceptedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      success: true,
      message: 'Terms and conditions accepted',
    });
  } catch (error: any) {
    console.error('[Accept Terms] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to accept terms' },
      { status: 500 }
    );
  }
}




