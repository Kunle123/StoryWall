import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    
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

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      // User doesn't exist - return error but allow frontend to handle gracefully
      return NextResponse.json(
        { 
          error: 'User not found',
          credits: 0,
          message: 'Please complete your profile first'
        },
        { status: 404 }
      );
    }

    // Check if user has enough credits
    if (user.credits < amount) {
      return NextResponse.json(
        { 
          error: 'Insufficient credits',
          credits: user.credits,
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

