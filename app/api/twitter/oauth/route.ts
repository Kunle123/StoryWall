import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser } from '@/lib/db/users';
import { getTwitterAuthUrl, generateCodeVerifier } from '@/lib/twitter/api';
import { cookies } from 'next/headers';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser(userId);
    
    const clientId = process.env.TWITTER_CLIENT_ID;
    
    // Require TWITTER_REDIRECT_URI to be set explicitly
    let redirectUri = process.env.TWITTER_REDIRECT_URI;
    if (!redirectUri) {
      // In production, require TWITTER_REDIRECT_URI
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Twitter API not configured. Please add TWITTER_REDIRECT_URI to environment variables.' },
          { status: 500 }
        );
      }
      // In development, construct from NEXT_PUBLIC_APP_URL (required)
      const appUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (!appUrl) {
        return NextResponse.json(
          { error: 'NEXT_PUBLIC_APP_URL must be set in development. Please add it to your environment variables.' },
          { status: 500 }
        );
      }
      redirectUri = `${appUrl}/api/twitter/callback`;
    }
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Twitter API not configured. Please add TWITTER_CLIENT_ID to environment variables.' },
        { status: 500 }
      );
    }
    
    // Get return URL from header or query param
    const returnUrl = request.headers.get('X-Return-Url') || request.nextUrl.searchParams.get('returnUrl') || null;
    
    // Generate state for CSRF protection (include returnUrl in state)
    const state = Buffer.from(JSON.stringify({ 
      userId: user.id, 
      timestamp: Date.now(),
      returnUrl: returnUrl 
    })).toString('base64');
    
    // Generate PKCE code_verifier
    const codeVerifier = generateCodeVerifier();
    
    // Store state and code_verifier in secure httpOnly cookies
    const cookieStore = await cookies();
    cookieStore.set('twitter_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });
    
    cookieStore.set('twitter_oauth_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });
    
    // Generate auth URL with proper PKCE
    const authUrl = getTwitterAuthUrl(clientId, redirectUri, state, codeVerifier);
    
    return NextResponse.json({ authUrl });
  } catch (error: any) {
    console.error('[Twitter OAuth] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate Twitter OAuth' },
      { status: 500 }
    );
  }
}

