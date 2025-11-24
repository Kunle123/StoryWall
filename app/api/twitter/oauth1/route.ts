import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser } from '@/lib/db/users';
import { getOAuth1RequestToken, getOAuth1AuthUrl } from '@/lib/twitter/api';
import { cookies } from 'next/headers';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

/**
 * GET /api/twitter/oauth1
 * Initiate OAuth 1.0a flow for media upload permissions
 * This is a 3-legged OAuth flow:
 * 1. Get request token
 * 2. Redirect user to Twitter to authorize
 * 3. Exchange request token for access token (in callback)
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser(userId);
    
    const consumerKey = process.env.TWITTER_API_KEY;
    const consumerSecret = process.env.TWITTER_API_SECRET;
    
    // In production, require TWITTER_REDIRECT_URI to be set explicitly
    // In development, allow fallback to localhost
    let redirectUri = process.env.TWITTER_REDIRECT_URI;
    if (!redirectUri) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Twitter OAuth 1.0a not configured. Please add TWITTER_REDIRECT_URI to environment variables.' },
          { status: 500 }
        );
      }
      // Development fallback - use OAuth 1.0a callback endpoint
      redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/twitter/oauth1/callback`;
    } else {
      // If TWITTER_REDIRECT_URI is set, use it but ensure it points to the OAuth 1.0a callback
      // If it's the OAuth 2.0 callback, convert it to OAuth 1.0a callback
      if (redirectUri.includes('/api/twitter/callback') && !redirectUri.includes('/oauth1/callback')) {
        redirectUri = redirectUri.replace('/api/twitter/callback', '/api/twitter/oauth1/callback');
      } else if (!redirectUri.includes('/oauth1/callback')) {
        // If it's a base URL, append the OAuth 1.0a callback path
        redirectUri = `${redirectUri.replace(/\/$/, '')}/api/twitter/oauth1/callback`;
      }
    }
    
    if (!consumerKey || !consumerSecret) {
      return NextResponse.json(
        { error: 'Twitter OAuth 1.0a not configured. Please add TWITTER_API_KEY and TWITTER_API_SECRET to environment variables.' },
        { status: 500 }
      );
    }
    
    // Get return URL from query param
    const returnUrl = request.nextUrl.searchParams.get('returnUrl') || null;
    
    console.log('[Twitter OAuth1] Initiating OAuth 1.0a flow for user:', user.id);
    console.log('[Twitter OAuth1] Return URL:', returnUrl);
    console.log('[Twitter OAuth1] Callback URL:', redirectUri);
    
    // Generate state for CSRF protection (include returnUrl in state)
    const state = Buffer.from(JSON.stringify({ 
      userId: user.id, 
      timestamp: Date.now(),
      returnUrl: returnUrl 
    })).toString('base64');
    
    // Step 1: Get request token
    console.log('[Twitter OAuth1] Getting request token...');
    const requestTokenData = await getOAuth1RequestToken(
      consumerKey,
      consumerSecret,
      redirectUri
    );
    console.log('[Twitter OAuth1] Got request token:', requestTokenData.oauth_token.substring(0, 20) + '...');
    
    // Store request token secret and state in secure httpOnly cookies
    const cookieStore = await cookies();
    cookieStore.set('twitter_oauth1_request_token_secret', requestTokenData.oauth_token_secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });
    
    cookieStore.set('twitter_oauth1_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });
    
    // Step 2: Generate authorization URL
    const authUrl = getOAuth1AuthUrl(requestTokenData.oauth_token);
    
    // Add state to the auth URL as a query parameter (Twitter will pass it back)
    const authUrlWithState = `${authUrl}&state=${encodeURIComponent(state)}`;
    
    console.log('[Twitter OAuth1] Generated auth URL, redirecting user to Twitter');
    console.log('[Twitter OAuth1] Auth URL:', authUrlWithState);
    
    return NextResponse.json({ authUrl: authUrlWithState });
  } catch (error: any) {
    console.error('[Twitter OAuth1] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate Twitter OAuth 1.0a' },
      { status: 500 }
    );
  }
}

