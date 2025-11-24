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
    
    // Verify state contains correct userId and extract returnUrl
    let returnUrl: string | null = null;
    let stateData: any;
    try {
      stateData = JSON.parse(Buffer.from(storedState, 'base64').toString());
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
      
      // Extract returnUrl from state
      returnUrl = stateData.returnUrl || null;
    } catch (e) {
      console.error('[Twitter Callback] Invalid state format');
      return NextResponse.redirect(
        new URL('/?error=twitter_auth_invalid_state', request.url)
      );
    }
    
    const clientId = process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;
    
    // In production, require TWITTER_REDIRECT_URI to be set explicitly
    // In development, allow fallback to localhost
    let redirectUri = process.env.TWITTER_REDIRECT_URI;
    if (!redirectUri) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.redirect(
          new URL('/?error=twitter_not_configured', request.url)
        );
      }
      // Development fallback
      redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/twitter/callback`;
    }
    
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
    
    // Determine redirect URL - use returnUrl from state if available and valid
    // Get the correct base URL from environment or construct from request
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    (process.env.NODE_ENV === 'production' 
                      ? (process.env.TWITTER_REDIRECT_URI?.replace('/api/twitter/callback', '') || 'https://www.storywall.com')
                      : 'http://localhost:3000');
    
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
    const redirectUrl = new URL(redirectPath, baseUrl);
    console.log('[Twitter Callback] Final redirect URL:', redirectUrl.toString());
    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error('[Twitter Callback] Error:', error);
    return NextResponse.redirect(
      new URL(`/?error=twitter_auth_error&message=${encodeURIComponent(error.message)}`, request.url)
    );
  }
}

