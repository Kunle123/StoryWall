import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser } from '@/lib/db/users';
import { prisma } from '@/lib/db/prisma';
import { exchangeCodeForToken } from '@/lib/twitter/api';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in?redirect=/api/twitter/callback', request.url));
    }

    const user = await getOrCreateUser(userId);
    
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    if (error) {
      return NextResponse.redirect(
        new URL(`/?error=twitter_auth_failed&message=${encodeURIComponent(error)}`, request.url)
      );
    }
    
    if (!code) {
      return NextResponse.redirect(
        new URL('/?error=twitter_auth_missing_code', request.url)
      );
    }
    
    // Verify state parameter to prevent CSRF attacks
    const cookieStore = await cookies();
    const storedState = cookieStore.get('twitter_oauth_state')?.value;
    const codeVerifier = cookieStore.get('twitter_oauth_code_verifier')?.value;
    
    if (!storedState || !state || storedState !== state) {
      console.error('[Twitter Callback] State mismatch - possible CSRF attack');
      return NextResponse.redirect(
        new URL('/?error=twitter_auth_state_mismatch', request.url)
      );
    }
    
    if (!codeVerifier) {
      console.error('[Twitter Callback] Missing code_verifier');
      return NextResponse.redirect(
        new URL('/?error=twitter_auth_missing_verifier', request.url)
      );
    }
    
    // Verify state contains correct userId
    try {
      const stateData = JSON.parse(Buffer.from(storedState, 'base64').toString());
      if (stateData.userId !== user.id) {
        console.error('[Twitter Callback] State userId mismatch');
        return NextResponse.redirect(
          new URL('/?error=twitter_auth_user_mismatch', request.url)
        );
      }
      
      // Check if state is not too old (10 minutes max)
      const stateAge = Date.now() - (stateData.timestamp || 0);
      if (stateAge > 10 * 60 * 1000) {
        console.error('[Twitter Callback] State expired');
        return NextResponse.redirect(
          new URL('/?error=twitter_auth_expired', request.url)
        );
      }
    } catch (e) {
      console.error('[Twitter Callback] Invalid state format');
      return NextResponse.redirect(
        new URL('/?error=twitter_auth_invalid_state', request.url)
      );
    }
    
    const clientId = process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;
    const redirectUri = process.env.TWITTER_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/twitter/callback`;
    
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL('/?error=twitter_not_configured', request.url)
      );
    }
    
    // Exchange code for token using proper PKCE code_verifier
    const tokenData = await exchangeCodeForToken(
      clientId,
      clientSecret,
      code,
      redirectUri,
      codeVerifier
    );
    
    // Store access token and refresh token in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twitterAccessToken: tokenData.access_token,
        // TODO: Add twitterRefreshToken field to schema and store refresh token
        // twitterRefreshToken: tokenData.refresh_token,
      },
    });
    
    // Clear OAuth cookies
    cookieStore.delete('twitter_oauth_state');
    cookieStore.delete('twitter_oauth_code_verifier');
    
    return NextResponse.redirect(new URL('/?twitter_connected=true', request.url));
  } catch (error: any) {
    console.error('[Twitter Callback] Error:', error);
    return NextResponse.redirect(
      new URL(`/?error=twitter_auth_error&message=${encodeURIComponent(error.message)}`, request.url)
    );
  }
}

