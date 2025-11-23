import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser } from '@/lib/db/users';
import { prisma } from '@/lib/db/prisma';

/**
 * POST /api/twitter/oauth1-tokens
 * Store OAuth 1.0a access token and secret for a user
 * These are required for media uploads
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser(userId);
    
    const body = await request.json();
    const { oauth1Token, oauth1TokenSecret } = body;
    
    if (!oauth1Token || !oauth1TokenSecret) {
      return NextResponse.json(
        { error: 'OAuth 1.0a token and token secret are required' },
        { status: 400 }
      );
    }
    
    // Store OAuth 1.0a tokens in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twitterOAuth1Token: oauth1Token,
        twitterOAuth1TokenSecret: oauth1TokenSecret,
      },
    });
    
    console.log(`[Twitter OAuth1 Tokens] Stored OAuth 1.0a tokens for user ${user.id}`);
    
    return NextResponse.json({
      success: true,
      message: 'OAuth 1.0a tokens stored successfully',
    });
  } catch (error: any) {
    console.error('[Twitter OAuth1 Tokens] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to store OAuth 1.0a tokens' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/twitter/oauth1-tokens
 * Remove OAuth 1.0a tokens for a user
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser(userId);
    
    // Remove OAuth 1.0a tokens
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twitterOAuth1Token: null,
        twitterOAuth1TokenSecret: null,
      },
    });
    
    console.log(`[Twitter OAuth1 Tokens] Removed OAuth 1.0a tokens for user ${user.id}`);
    
    return NextResponse.json({
      success: true,
      message: 'OAuth 1.0a tokens removed successfully',
    });
  } catch (error: any) {
    console.error('[Twitter OAuth1 Tokens] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove OAuth 1.0a tokens' },
      { status: 500 }
    );
  }
}

