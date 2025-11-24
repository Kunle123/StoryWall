import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser } from '@/lib/db/users';
import { prisma } from '@/lib/db/prisma';
import { exchangeOAuth1RequestTokenForAccessToken } from '@/lib/twitter/api';
import { cookies } from 'next/headers';

/**
 * Get the correct base URL for redirects
 * Prevents redirects to localhost:8080 or incorrect origins
 * This function is safe to call during build time - it never throws
 */
function getBaseUrl(): string {
  // First, try NEXT_PUBLIC_APP_URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl && appUrl.trim()) {
    // Validate it's a proper URL
    try {
      new URL(appUrl);
      return appUrl;
    } catch {
      // Invalid URL, continue to next option
    }
  }
  
  // In production, try to extract from TWITTER_REDIRECT_URI
  if (process.env.NODE_ENV === 'production') {
    const redirectUri = process.env.TWITTER_REDIRECT_URI;
    if (redirectUri && redirectUri.trim()) {
      try {
        const url = new URL(redirectUri);
        return `${url.protocol}//${url.host}`;
      } catch {
        // Invalid URL, use default
      }
    }
    // Default production URL
    return 'https://www.storywall.com';
  }
  
  // Development fallback
  return 'http://localhost:3000';
}

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

/**
 * GET /api/twitter/oauth1/callback
 * Handle OAuth 1.0a callback and exchange request token for access token
 */
export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl();
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in?redirect=/api/twitter/oauth1/callback', baseUrl));
    }

    const user = await getOrCreateUser(userId);
    
    const searchParams = request.nextUrl.searchParams;
    const oauthToken = searchParams.get('oauth_token');
    const oauthVerifier = searchParams.get('oauth_verifier');
    const state = searchParams.get('state');
    const denied = searchParams.get('denied');
    
    if (denied) {
      return NextResponse.redirect(
        new URL('/?error=twitter_oauth1_denied', baseUrl)
      );
    }
    
    if (!oauthToken || !oauthVerifier) {
      return NextResponse.redirect(
        new URL('/?error=twitter_oauth1_missing_params', baseUrl)
      );
    }
    
    // Verify state parameter
    const cookieStore = await cookies();
    const storedState = cookieStore.get('twitter_oauth1_state')?.value;
    const requestTokenSecret = cookieStore.get('twitter_oauth1_request_token_secret')?.value;
    
    console.log('[Twitter OAuth1 Callback] Received params:', {
      oauthToken: oauthToken ? 'present' : 'missing',
      oauthVerifier: oauthVerifier ? 'present' : 'missing',
      state: state ? 'present' : 'missing',
      storedState: storedState ? 'present' : 'missing',
      requestTokenSecret: requestTokenSecret ? 'present' : 'missing',
    });
    
    if (!storedState || !state || storedState !== state) {
      console.error('[Twitter OAuth1 Callback] State mismatch - possible CSRF attack or cookie lost');
      console.error('[Twitter OAuth1 Callback] Stored state:', storedState?.substring(0, 50));
      console.error('[Twitter OAuth1 Callback] Received state:', state?.substring(0, 50));
      return NextResponse.redirect(
        new URL('/?error=twitter_oauth1_state_mismatch', baseUrl)
      );
    }
    
    if (!requestTokenSecret) {
      console.error('[Twitter OAuth1 Callback] Missing request token secret - cookie may have expired or been lost');
      return NextResponse.redirect(
        new URL('/?error=twitter_oauth1_missing_token_secret', baseUrl)
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
          new URL('/?error=twitter_oauth1_user_mismatch', baseUrl)
        );
      }
      
      // Check if state is not too old (10 minutes max)
      const stateAge = Date.now() - (stateData.timestamp || 0);
      if (stateAge > 10 * 60 * 1000) {
        console.error('[Twitter OAuth1 Callback] State expired');
        return NextResponse.redirect(
          new URL('/?error=twitter_oauth1_expired', baseUrl)
        );
      }
      
      // Extract returnUrl from state
      returnUrl = stateData.returnUrl || null;
    } catch (e) {
      console.error('[Twitter OAuth1 Callback] Invalid state format');
      return NextResponse.redirect(
        new URL('/?error=twitter_oauth1_invalid_state', baseUrl)
      );
    }
    
    const consumerKey = process.env.TWITTER_API_KEY;
    const consumerSecret = process.env.TWITTER_API_SECRET;
    
    if (!consumerKey || !consumerSecret) {
      return NextResponse.redirect(
        new URL('/?error=twitter_oauth1_not_configured', baseUrl)
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
    // Validate baseUrl is a proper URL before using it
    let finalBaseUrl = baseUrl;
    try {
      new URL(baseUrl); // Validate it's a proper URL
    } catch {
      // If baseUrl is invalid, use default
      finalBaseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://www.storywall.com' 
        : 'http://localhost:3000';
      console.warn('[Twitter OAuth1 Callback] Invalid baseUrl, using default:', finalBaseUrl);
    }
    
    const redirectUrl = new URL(redirectPath, finalBaseUrl);
    console.log('[Twitter OAuth1 Callback] Final redirect URL:', redirectUrl.toString());
    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error('[Twitter OAuth1 Callback] Error:', error);
    try {
      const baseUrl = getBaseUrl();
      // Validate baseUrl before using it
      try {
        new URL(baseUrl);
        return NextResponse.redirect(
          new URL(`/?error=twitter_oauth1_failed&message=${encodeURIComponent(error.message || 'Unknown error')}`, baseUrl)
        );
      } catch {
        // Invalid baseUrl, use default
        return NextResponse.redirect(
          new URL(`/?error=twitter_oauth1_failed&message=${encodeURIComponent(error.message || 'Unknown error')}`, 'https://www.storywall.com')
        );
      }
    } catch (urlError) {
      // Fallback if getBaseUrl fails
      console.error('[Twitter OAuth1 Callback] Error getting base URL:', urlError);
      return NextResponse.redirect(
        new URL(`/?error=twitter_oauth1_failed&message=${encodeURIComponent(error.message || 'Unknown error')}`, 'https://www.storywall.com')
      );
    }
  }
}

