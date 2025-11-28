import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser } from '@/lib/db/users';
import { prisma } from '@/lib/db/prisma';
import { exchangeCodeForToken } from '@/lib/twitter/api';
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
  
  // In development, require NEXT_PUBLIC_APP_URL to be set
  throw new Error('NEXT_PUBLIC_APP_URL must be set in development environment');
}

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  let baseUrl: string;
  try {
    baseUrl = getBaseUrl();
  } catch (error: any) {
    console.error('[Twitter Callback] Failed to get base URL:', error);
    return NextResponse.json(
      { error: error.message || 'Configuration error: NEXT_PUBLIC_APP_URL must be set' },
      { status: 500 }
    );
  }
  
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in?redirect=/api/twitter/callback', baseUrl));
    }

    const user = await getOrCreateUser(userId);
    
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    if (error) {
      return NextResponse.redirect(
        new URL(`/?error=twitter_auth_failed&message=${encodeURIComponent(error)}`, baseUrl)
      );
    }
    
    if (!code) {
      return NextResponse.redirect(
        new URL('/?error=twitter_auth_missing_code', baseUrl)
      );
    }
    
    // Verify state parameter to prevent CSRF attacks
    const cookieStore = await cookies();
    const storedState = cookieStore.get('twitter_oauth_state')?.value;
    const codeVerifier = cookieStore.get('twitter_oauth_code_verifier')?.value;
    
    if (!storedState || !state || storedState !== state) {
      console.error('[Twitter Callback] State mismatch - possible CSRF attack');
      return NextResponse.redirect(
        new URL('/?error=twitter_auth_state_mismatch', baseUrl)
      );
    }
    
    if (!codeVerifier) {
      console.error('[Twitter Callback] Missing code_verifier');
      return NextResponse.redirect(
        new URL('/?error=twitter_auth_missing_verifier', baseUrl)
      );
    }
    
    // Verify state contains correct userId and extract returnUrl
    let returnUrl: string | null = null;
    let stateData: any;
    try {
      stateData = JSON.parse(Buffer.from(storedState, 'base64').toString());
      if (stateData.userId !== user.id) {
        console.error('[Twitter Callback] State userId mismatch');
        return NextResponse.redirect(
          new URL('/?error=twitter_auth_user_mismatch', baseUrl)
        );
      }
      
      // Check if state is not too old (10 minutes max)
      const stateAge = Date.now() - (stateData.timestamp || 0);
      if (stateAge > 10 * 60 * 1000) {
        console.error('[Twitter Callback] State expired');
        return NextResponse.redirect(
          new URL('/?error=twitter_auth_expired', baseUrl)
        );
      }
      
      // Extract returnUrl from state
      returnUrl = stateData.returnUrl || null;
    } catch (e) {
      console.error('[Twitter Callback] Invalid state format');
      return NextResponse.redirect(
        new URL('/?error=twitter_auth_invalid_state', baseUrl)
      );
    }
    
    const clientId = process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;
    
    // Require TWITTER_REDIRECT_URI to be set explicitly
    let redirectUri = process.env.TWITTER_REDIRECT_URI;
    if (!redirectUri) {
      // In production, require TWITTER_REDIRECT_URI
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.redirect(
          new URL('/?error=twitter_not_configured', baseUrl)
        );
      }
      // In development, construct from baseUrl (which comes from NEXT_PUBLIC_APP_URL)
      redirectUri = `${baseUrl}/api/twitter/callback`;
    }
    
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL('/?error=twitter_not_configured', baseUrl)
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
    
    // Always complete OAuth 1.0a flow after OAuth 2.0 to ensure tokens match consumer key/secret
    // This ensures fresh tokens that are guaranteed to work with the current app credentials
    const consumerKey = process.env.TWITTER_API_KEY;
    const consumerSecret = process.env.TWITTER_API_SECRET;
    const oauth1Configured = !!(consumerKey && consumerSecret);
    
    // If OAuth 1.0a is configured, ALWAYS redirect to OAuth 1.0a flow to get fresh tokens
    // This ensures tokens always match the consumer key/secret (prevents token mismatch errors)
    // Note: We always redirect even if returnUrl is missing to ensure OAuth 1.0a completes
    if (oauth1Configured) {
      console.log('[Twitter Callback] OAuth 2.0 connected, automatically initiating OAuth 1.0a flow for image uploads');
      // Clear any existing OAuth 1.0a tokens to force fresh authentication
      await prisma.user.update({
        where: { id: user.id },
        data: {
          twitterOAuth1Token: null,
          twitterOAuth1TokenSecret: null,
        },
      });
      // Redirect to OAuth 1.0a flow with the returnUrl (if available)
      const oauth1Url = new URL('/api/twitter/oauth1', baseUrl);
      if (returnUrl) {
        oauth1Url.searchParams.set('returnUrl', returnUrl);
      }
      return NextResponse.redirect(oauth1Url);
    }
    
    // Determine redirect URL - use returnUrl from state if available and valid
    let redirectPath = '/?twitter_connected=true';
    if (returnUrl) {
      try {
        // returnUrl should be a path (e.g., /timeline/123 or /timeline/123?param=value)
        // If it's a full URL, extract the path and validate origin
        let pathToUse: string | null = returnUrl;
        
        // Check if it's a full URL or just a path
        if (returnUrl.startsWith('http://') || returnUrl.startsWith('https://')) {
          const returnUrlObj = new URL(returnUrl);
          const baseUrlObj = new URL(baseUrl);
          
          // If the returnUrl has localhost:8080 or wrong origin, extract just the path
          if (returnUrlObj.origin !== baseUrlObj.origin) {
            console.warn('[Twitter Callback] Return URL origin mismatch, extracting path only. Return origin:', returnUrlObj.origin, 'Expected origin:', baseUrlObj.origin);
            pathToUse = returnUrlObj.pathname + returnUrlObj.search;
          } else {
            pathToUse = returnUrlObj.pathname + returnUrlObj.search;
          }
        }
        
        if (pathToUse) {
          // Ensure path starts with /
          if (!pathToUse.startsWith('/')) {
            pathToUse = '/' + pathToUse;
          }
          
          // Add success parameter
          const separator = pathToUse.includes('?') ? '&' : '?';
          redirectPath = `${pathToUse}${separator}twitter_connected=true`;
          console.log('[Twitter Callback] Redirecting to original page:', redirectPath);
        }
      } catch (e) {
        console.warn('[Twitter Callback] Invalid returnUrl format, using default:', e, 'ReturnUrl:', returnUrl);
      }
    } else {
      console.log('[Twitter Callback] No returnUrl in state, using default redirect');
    }
    
    // Clear OAuth cookies
    cookieStore.delete('twitter_oauth_state');
    cookieStore.delete('twitter_oauth_code_verifier');
    
    // Construct full URL using the correct base URL, not request.url
    // Validate baseUrl is a proper URL before using it
    let finalBaseUrl = baseUrl;
    try {
      new URL(baseUrl); // Validate it's a proper URL
    } catch {
      // If baseUrl is invalid, use production default
      finalBaseUrl = 'https://www.storywall.com';
      console.warn('[Twitter Callback] Invalid baseUrl, using production default:', finalBaseUrl);
    }
    
    const redirectUrl = new URL(redirectPath, finalBaseUrl);
    console.log('[Twitter Callback] Final redirect URL:', redirectUrl.toString());
    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error('[Twitter Callback] Error:', error);
    let errorBaseUrl: string;
    try {
      errorBaseUrl = getBaseUrl();
      new URL(errorBaseUrl); // Validate it's a proper URL
    } catch {
      // If getBaseUrl fails or URL is invalid, use production default
      errorBaseUrl = 'https://www.storywall.com';
    }
    return NextResponse.redirect(
      new URL(`/?error=twitter_auth_error&message=${encodeURIComponent(error.message)}`, errorBaseUrl)
    );
  }
}

