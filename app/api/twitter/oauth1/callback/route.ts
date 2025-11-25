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
    const state = searchParams.get('state'); // Twitter may not send this in OAuth 1.0a
    const denied = searchParams.get('denied');
    
    if (denied) {
      return NextResponse.redirect(
        new URL('/?error=twitter_oauth1_denied', baseUrl)
      );
    }
    
    if (!oauthToken || !oauthVerifier) {
      console.error('[Twitter OAuth1 Callback] Missing required params:', {
        oauthToken: !!oauthToken,
        oauthVerifier: !!oauthVerifier,
      });
      return NextResponse.redirect(
        new URL('/?error=twitter_oauth1_missing_params', baseUrl)
      );
    }
    
    // Verify state parameter from cookie (Twitter OAuth 1.0a may not send state in URL)
    const cookieStore = await cookies();
    const storedState = cookieStore.get('twitter_oauth1_state')?.value;
    const requestTokenSecret = cookieStore.get('twitter_oauth1_request_token_secret')?.value;
    
    console.log('[Twitter OAuth1 Callback] Received params:', {
      oauthToken: oauthToken ? 'present' : 'missing',
      oauthVerifier: oauthVerifier ? 'present' : 'missing',
      state: state ? 'present' : 'missing (Twitter may not send this)',
      storedState: storedState ? 'present' : 'missing',
      requestTokenSecret: requestTokenSecret ? 'present' : 'missing',
    });
    
    // For OAuth 1.0a, we rely on the cookie for state verification
    // Twitter's OAuth 1.0a implementation may not reliably send state back
    // We'll verify the state from the cookie, but be lenient if Twitter sends a different one
    if (!storedState) {
      console.error('[Twitter OAuth1 Callback] Missing stored state in cookie - cookie may have expired or been lost');
      return NextResponse.redirect(
        new URL('/?error=twitter_oauth1_missing_state_cookie', baseUrl)
      );
    }
    
    // For OAuth 1.0a, Twitter may modify or not send the state parameter correctly
    // We'll use the stored state from the cookie for verification instead
    // Only log a warning if state is provided and doesn't match, but don't fail
    if (state && storedState !== state) {
      console.warn('[Twitter OAuth1 Callback] State mismatch (Twitter may have modified it) - using stored state from cookie');
      console.warn('[Twitter OAuth1 Callback] Stored state:', storedState?.substring(0, 50));
      console.warn('[Twitter OAuth1 Callback] Received state:', state?.substring(0, 50));
      // Don't fail - use the stored state from cookie instead
    }
    
    if (!requestTokenSecret) {
      console.error('[Twitter OAuth1 Callback] Missing request token secret - cookie may have expired or been lost');
      return NextResponse.redirect(
        new URL('/?error=twitter_oauth1_missing_token_secret', baseUrl)
      );
    }
    
    // Verify state contains correct userId and extract returnUrl
    // Use storedState from cookie (not the state from URL, as Twitter may modify it)
    let returnUrl: string | null = null;
    let stateData: any;
    try {
      stateData = JSON.parse(Buffer.from(storedState, 'base64').toString());
      console.log('[Twitter OAuth1 Callback] State data:', {
        userId: stateData.userId,
        currentUserId: user.id,
        match: stateData.userId === user.id,
      });
      
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
    console.log('[Twitter OAuth1 Callback] Exchanging request token for access token...');
    let accessTokenData;
    try {
      accessTokenData = await exchangeOAuth1RequestTokenForAccessToken(
        consumerKey,
        consumerSecret,
        oauthToken,
        requestTokenSecret,
        oauthVerifier
      );
      console.log('[Twitter OAuth1 Callback] Successfully exchanged request token for access token');
    } catch (error: any) {
      console.error('[Twitter OAuth1 Callback] Failed to exchange request token:', error);
      console.error('[Twitter OAuth1 Callback] Error details:', error.message);
      return NextResponse.redirect(
        new URL('/?error=twitter_oauth1_exchange_failed', baseUrl)
      );
    }
    
    // Store OAuth 1.0a access tokens in database
    console.log('[Twitter OAuth1 Callback] Storing OAuth 1.0a tokens in database...');
    
    // Check if we're getting the same tokens (which might indicate they don't have write permissions)
    // This needs to be outside the try block so it's accessible when constructing the redirect URL
    let isSameToken = false;
    try {
      const existingUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          twitterOAuth1Token: true,
          twitterOAuth1TokenSecret: true,
        },
      });
      
      isSameToken = existingUser?.twitterOAuth1Token === accessTokenData.oauth_token;
      if (isSameToken) {
        console.warn('[Twitter OAuth1 Callback] ⚠️  WARNING: Twitter returned the same token after reconnection!');
        console.warn('[Twitter OAuth1 Callback] ⚠️  This usually means the token still lacks write permissions.');
        console.warn('[Twitter OAuth1 Callback] ⚠️  SOLUTION: Revoke app access in Twitter Settings → Security → Apps and sessions, then reconnect.');
        // Store a flag in the redirect URL to prevent infinite reconnection loops
        // The client will check for this and show a manual revocation message instead
      }
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          twitterOAuth1Token: accessTokenData.oauth_token,
          twitterOAuth1TokenSecret: accessTokenData.oauth_token_secret,
        },
      });
      console.log(`[Twitter OAuth1 Callback] ✅ Stored OAuth 1.0a tokens for user ${user.id}`);
      console.log('[Twitter OAuth1 Callback] Consumer Key (first 20 chars):', consumerKey.substring(0, 20));
      console.log('[Twitter OAuth1 Callback] Consumer Key (full length):', consumerKey.length);
      console.log('[Twitter OAuth1 Callback] Consumer Secret (first 10 chars):', consumerSecret.substring(0, 10));
      console.log('[Twitter OAuth1 Callback] Consumer Secret (full length):', consumerSecret.length);
      console.log('[Twitter OAuth1 Callback] Token (first 20 chars):', accessTokenData.oauth_token.substring(0, 20));
      console.log('[Twitter OAuth1 Callback] Token (full length):', accessTokenData.oauth_token.length);
      console.log('[Twitter OAuth1 Callback] Token Secret (first 20 chars):', accessTokenData.oauth_token_secret.substring(0, 20));
      console.log('[Twitter OAuth1 Callback] Token Secret (full length):', accessTokenData.oauth_token_secret.length);
      
      // Verify token permissions immediately after storing
      // If token lacks write permissions, clear it and flag for user to revoke access
      try {
        const { verifyOAuth1TokenPermissions } = await import('@/lib/twitter/api');
        const verification = await verifyOAuth1TokenPermissions(
          consumerKey,
          consumerSecret,
          accessTokenData.oauth_token,
          accessTokenData.oauth_token_secret
        );
        
        if (!verification.hasWritePermissions) {
          console.warn('[Twitter OAuth1 Callback] ⚠️  Token lacks write permissions - clearing tokens');
          console.warn('[Twitter OAuth1 Callback] ⚠️  User must revoke app access in Twitter Settings first');
          // Clear the tokens we just stored
          await prisma.user.update({
            where: { id: user.id },
            data: {
              twitterOAuth1Token: null,
              twitterOAuth1TokenSecret: null,
            },
          });
          // Set flag to indicate user needs to revoke access
          isSameToken = true; // Use this flag to show the revocation message
        } else {
          console.log('[Twitter OAuth1 Callback] ✅ Token has write permissions');
        }
      } catch (verifyError) {
        // Verification failed, but don't block the flow
        // The actual upload will fail if permissions are missing
        console.warn('[Twitter OAuth1 Callback] ⚠️  Could not verify token permissions:', verifyError);
      }
    } catch (error: any) {
      console.error('[Twitter OAuth1 Callback] Failed to store tokens in database:', error);
      return NextResponse.redirect(
        new URL('/?error=twitter_oauth1_storage_failed', baseUrl)
      );
    }
    
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
          // Add flag if same tokens were returned (prevents infinite reconnection loop)
          const sameTokenFlag = isSameToken ? '&same_token_detected=true' : '';
          redirectPath = `${returnUrl}${separator}twitter_oauth1_connected=true${sameTokenFlag}`;
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

