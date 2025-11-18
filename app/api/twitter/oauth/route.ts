import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser } from '@/lib/db/users';
import { getTwitterAuthUrl } from '@/lib/twitter/api';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser(userId);
    
    const clientId = process.env.TWITTER_CLIENT_ID;
    const redirectUri = process.env.TWITTER_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/twitter/callback`;
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Twitter API not configured. Please add TWITTER_CLIENT_ID to environment variables.' },
        { status: 500 }
      );
    }
    
    // Generate state for CSRF protection
    const state = Buffer.from(JSON.stringify({ userId: user.id })).toString('base64');
    
    // Store state in session/cookie for verification
    const authUrl = getTwitterAuthUrl(clientId, redirectUri, state);
    
    return NextResponse.json({ authUrl, state });
  } catch (error: any) {
    console.error('[Twitter OAuth] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate Twitter OAuth' },
      { status: 500 }
    );
  }
}

