import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { getOrCreateUser } from '@/lib/db/users';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { amount, action } = body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Get or create user (auto-creates if doesn't exist)
    const user = await getOrCreateUser(userId);

    // Get full user to check credits
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { credits: true },
    });

    if (!fullUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (fullUser.credits < amount) {
      return NextResponse.json(
        { 
          error: 'Insufficient credits',
          credits: fullUser.credits,
          required: amount
        },
        { status: 400 }
      );
    }

    // Deduct credits
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        credits: {
          decrement: amount,
        },
      },
      select: {
        credits: true,
      },
    });

    // Log the deduction (optional - you might want to create a CreditTransaction model)
    console.log(`User ${user.id} deducted ${amount} credits for: ${action}`);

    return NextResponse.json({
      credits: updatedUser.credits,
      deducted: amount,
      action,
    });
  } catch (error: any) {
    console.error('Error deducting credits:', error);
    return NextResponse.json(
      { error: 'Failed to deduct credits' },
      { status: 500 }
    );
  }
}

