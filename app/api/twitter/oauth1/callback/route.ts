import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser } from '@/lib/db/users';
import { prisma } from '@/lib/db/prisma';
import { exchangeOAuth1RequestTokenForAccessToken } from '@/lib/twitter/api';
import { cookies } from 'next/headers';

/**
 * GET /api/twitter/oauth1/callback
 * Handle OAuth 1.0a callback and exchange request token for access token
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in?redirect=/api/twitter/oauth1/callback', request.url));
    }

    const user = await getOrCreateUser(userId);
    
    const searchParams = request.nextUrl.searchParams;
    const oauthToken = searchParams.get('oauth_token');
    const oauthVerifier = searchParams.get('oauth_verifier');
    const state = searchParams.get('state');
    const denied = searchParams.get('denied');
    
    if (denied) {
      return NextResponse.redirect(
        new URL('/?error=twitter_oauth1_denied', request.url)
      );
    }
    
    if (!oauthToken || !oauthVerifier) {
      return NextResponse.redirect(
        new URL('/?error=twitter_oauth1_missing_params', request.url)
      );
    }
    
    // Verify state parameter
    const cookieStore = await cookies();
    const storedState = cookieStore.get('twitter_oauth1_state')?.value;
    const requestTokenSecret = cookieStore.get('twitter_oauth1_request_token_secret')?.value;
    
    if (!storedState || !state || storedState !== state) {
      console.error('[Twitter OAuth1 Callback] State mismatch - possible CSRF attack');
      return NextResponse.redirect(
        new URL('/?error=twitter_oauth1_state_mismatch', request.url)
      );
    }
    
    if (!requestTokenSecret) {
      console.error('[Twitter OAuth1 Callback] Missing request token secret');
      return NextResponse.redirect(
        new URL('/?error=twitter_oauth1_missing_token_secret', request.url)
      );
    }
    
    // Verify state contains correct userId and extract returnUrl
    let returnUrl: string | null = null;
    let stateData: any;
    try {
      stateData = JSON.parse(Buffer.from(storedState, 'base64').toString());
      if (stateData.userId !== user.id) {
        console.error('[Twitter OAuth1 Callback] State userId mismatch');
        return NextResponse.redirect(
          new URL('/?error=twitter_oauth1_user_mismatch', request.url)
        );
      }
      
      // Check if state is not too old (10 minutes max)
      const stateAge = Date.now() - (stateData.timestamp || 0);
      if (stateAge > 10 * 60 * 1000) {
        console.error('[Twitter OAuth1 Callback] State expired');
        return NextResponse.redirect(
          new URL('/?error=twitter_oauth1_expired', request.url)
        );
      }
      
      // Extract returnUrl from state
      returnUrl = stateData.returnUrl || null;
    } catch (e) {
      console.error('[Twitter OAuth1 Callback] Invalid state format');
      return NextResponse.redirect(
        new URL('/?error=twitter_oauth1_invalid_state', request.url)
      );
    }
    
    const consumerKey = process.env.TWITTER_API_KEY;
    const consumerSecret = process.env.TWITTER_API_SECRET;
    
    if (!consumerKey || !consumerSecret) {
      return NextResponse.redirect(
        new URL('/?error=twitter_oauth1_not_configured', request.url)
      );
    }
    
    // Step 3: Exchange request token for access token
    const accessTokenData = await exchangeOAuth1RequestTokenForAccessToken(
      consumerKey,
      consumerSecret,
      oauthToken,
      requestTokenSecret,
      oauthVerifier
    );
    
    // Store OAuth 1.0a access tokens in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twitterOAuth1Token: accessTokenData.oauth_token,
        twitterOAuth1TokenSecret: accessTokenData.oauth_token_secret,
      },
    });
    
    console.log(`[Twitter OAuth1 Callback] Stored OAuth 1.0a tokens for user ${user.id}`);
    
    // Clear OAuth 1.0a cookies
    cookieStore.delete('twitter_oauth1_request_token_secret');
    cookieStore.delete('twitter_oauth1_state');
    
    // Get the correct base URL from environment or construct from request
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    (process.env.NODE_ENV === 'production' 
                      ? (process.env.TWITTER_REDIRECT_URI?.replace('/api/twitter/oauth1/callback', '').replace('/api/twitter/callback', '') || 'https://www.storywall.com')
                      : 'http://localhost:3000');
    
    // Determine redirect URL
    let redirectPath = '/?twitter_oauth1_connected=true';
    if (returnUrl) {
      try {
        // If returnUrl is a full URL, extract just the path
        if (returnUrl.startsWith('http://') || returnUrl.startsWith('https://')) {
          const returnUrlObj = new URL(returnUrl);
          returnUrl = returnUrlObj.pathname + returnUrlObj.search;
        }
        
        if (returnUrl.startsWith('/')) {
          const separator = returnUrl.includes('?') ? '&' : '?';
          redirectPath = `${returnUrl}${separator}twitter_oauth1_connected=true`;
          console.log('[Twitter OAuth1 Callback] Redirecting to original path:', redirectPath);
        }
      } catch (e) {
        console.warn('[Twitter OAuth1 Callback] Error processing returnUrl, using default:', e);
      }
    }
    
    // Construct full URL using the correct base URL, not request.url
    const redirectUrl = new URL(redirectPath, baseUrl);
    console.log('[Twitter OAuth1 Callback] Final redirect URL:', redirectUrl.toString());
    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error('[Twitter OAuth1 Callback] Error:', error);
    return NextResponse.redirect(
      new URL(`/?error=twitter_oauth1_failed&message=${encodeURIComponent(error.message || 'Unknown error')}`, request.url)
    );
  }
}

