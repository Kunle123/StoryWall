import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser } from '@/lib/db/users';
import { getTikTokAuthUrl } from '@/lib/tiktok/api';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

function getBaseUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl && appUrl.trim()) {
    try {
      new URL(appUrl);
      return appUrl;
    } catch {
      // Invalid URL, continue to next option
    }
  }
  
  if (process.env.NODE_ENV === 'production') {
    const redirectUri = process.env.TIKTOK_REDIRECT_URI;
    if (redirectUri && redirectUri.trim()) {
      try {
        const url = new URL(redirectUri);
        return `${url.protocol}//${url.host}`;
      } catch {
        // Invalid URL, use default
      }
    }
    return 'https://www.storywall.com';
  }
  
  throw new Error('NEXT_PUBLIC_APP_URL must be set in development environment');
}

export async function GET(request: NextRequest) {
  let baseUrl: string;
  try {
    baseUrl = getBaseUrl();
  } catch (error: any) {
    console.error('[TikTok OAuth] Failed to get base URL:', error);
    return NextResponse.json(
      { error: error.message || 'Configuration error: NEXT_PUBLIC_APP_URL must be set' },
      { status: 500 }
    );
  }

  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in?redirect=/api/tiktok/oauth', baseUrl));
    }

    const user = await getOrCreateUser(userId);
    
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    if (!clientKey) {
      return NextResponse.json(
        { error: 'TikTok not configured. TIKTOK_CLIENT_KEY is missing.' },
        { status: 500 }
      );
    }

    // Get return URL from query params
    const returnUrl = request.nextUrl.searchParams.get('returnUrl') || null;

    // Generate state parameter with userId and returnUrl
    const stateData = {
      userId: user.id,
      returnUrl,
      timestamp: Date.now(),
    };
    const state = Buffer.from(JSON.stringify(stateData)).toString('base64');

    // Generate random state for CSRF protection
    const randomState = crypto.randomBytes(32).toString('hex');
    
    // Store state in cookie for verification
    const cookieStore = await cookies();
    cookieStore.set('tiktok_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60, // 10 minutes
    });
    cookieStore.set('tiktok_oauth_random_state', randomState, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60, // 10 minutes
    });

    // Get redirect URI
    let redirectUri = process.env.TIKTOK_REDIRECT_URI;
    if (!redirectUri) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'TIKTOK_REDIRECT_URI must be set in production' },
          { status: 500 }
        );
      }
      redirectUri = `${baseUrl}/api/tiktok/callback`;
    }

    // Get TikTok authorization URL
    const authUrl = getTikTokAuthUrl(
      clientKey,
      redirectUri,
      randomState, // Use random state for TikTok
      ['video.upload', 'user.info.basic']
    );

    console.log('[TikTok OAuth] Redirecting to TikTok authorization:', authUrl);
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error('[TikTok OAuth] Error:', error);
    let errorBaseUrl: string;
    try {
      errorBaseUrl = getBaseUrl();
      new URL(errorBaseUrl);
    } catch {
      errorBaseUrl = 'https://www.storywall.com';
    }
    return NextResponse.redirect(
      new URL(`/?error=tiktok_auth_error&message=${encodeURIComponent(error.message)}`, errorBaseUrl)
    );
  }
}

