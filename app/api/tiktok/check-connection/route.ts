import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser } from '@/lib/db/users';
import { prisma } from '@/lib/db/prisma';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ connected: false }, { status: 200 });
    }

    const user = await getOrCreateUser(userId);
    
    const userWithToken = await prisma.user.findUnique({
      where: { id: user.id },
      select: { 
        tiktokAccessToken: true,
        tiktokOpenId: true,
      },
    });
    
    return NextResponse.json({
      connected: !!(userWithToken?.tiktokAccessToken && userWithToken?.tiktokOpenId),
    });
  } catch (error: any) {
    console.error('[TikTok Check Connection] Error:', error);
    return NextResponse.json({ connected: false }, { status: 200 });
  }
}

