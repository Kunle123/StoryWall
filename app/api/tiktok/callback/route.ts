import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser } from '@/lib/db/users';
import { prisma } from '@/lib/db/prisma';
import { exchangeCodeForToken } from '@/lib/tiktok/api';
import { cookies } from 'next/headers';

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
    console.error('[TikTok Callback] Failed to get base URL:', error);
    return NextResponse.json(
      { error: error.message || 'Configuration error: NEXT_PUBLIC_APP_URL must be set' },
      { status: 500 }
    );
  }

  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in?redirect=/api/tiktok/callback', baseUrl));
    }

    const user = await getOrCreateUser(userId);
    
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    if (error) {
      return NextResponse.redirect(
        new URL(`/?error=tiktok_auth_failed&message=${encodeURIComponent(error)}`, baseUrl)
      );
    }
    
    if (!code) {
      return NextResponse.redirect(
        new URL('/?error=tiktok_auth_missing_code', baseUrl)
      );
    }
    
    // Verify state parameter
    const cookieStore = await cookies();
    const storedState = cookieStore.get('tiktok_oauth_state')?.value;
    const storedRandomState = cookieStore.get('tiktok_oauth_random_state')?.value;
    
    if (!storedRandomState || !state || storedRandomState !== state) {
      console.error('[TikTok Callback] State mismatch - possible CSRF attack');
      return NextResponse.redirect(
        new URL('/?error=tiktok_auth_state_mismatch', baseUrl)
      );
    }
    
    // Verify state contains correct userId and extract returnUrl
    let returnUrl: string | null = null;
    let stateData: any;
    try {
      if (!storedState) {
        throw new Error('Missing stored state');
      }
      stateData = JSON.parse(Buffer.from(storedState, 'base64').toString());
      if (stateData.userId !== user.id) {
        console.error('[TikTok Callback] State userId mismatch');
        return NextResponse.redirect(
          new URL('/?error=tiktok_auth_user_mismatch', baseUrl)
        );
      }
      
      // Check if state is not too old (10 minutes max)
      const stateAge = Date.now() - (stateData.timestamp || 0);
      if (stateAge > 10 * 60 * 1000) {
        console.error('[TikTok Callback] State expired');
        return NextResponse.redirect(
          new URL('/?error=tiktok_auth_expired', baseUrl)
        );
      }
      
      returnUrl = stateData.returnUrl || null;
    } catch (e) {
      console.error('[TikTok Callback] Invalid state format');
      return NextResponse.redirect(
        new URL('/?error=tiktok_auth_invalid_state', baseUrl)
      );
    }
    
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
    
    if (!clientKey || !clientSecret) {
      return NextResponse.redirect(
        new URL('/?error=tiktok_not_configured', baseUrl)
      );
    }
    
    // Get redirect URI
    let redirectUri = process.env.TIKTOK_REDIRECT_URI;
    if (!redirectUri) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.redirect(
          new URL('/?error=tiktok_not_configured', baseUrl)
        );
      }
      redirectUri = `${baseUrl}/api/tiktok/callback`;
    }
    
    // Exchange code for token
    const tokenData = await exchangeCodeForToken(
      clientKey,
      clientSecret,
      code,
      redirectUri
    );
    
    // Store tokens in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        tiktokAccessToken: tokenData.access_token,
        tiktokRefreshToken: tokenData.refresh_token,
        tiktokOpenId: tokenData.open_id,
      },
    });
    
    console.log('[TikTok Callback] ✅ Stored TikTok access token, refresh token, and open_id');
    
    // Clear OAuth cookies
    cookieStore.delete('tiktok_oauth_state');
    cookieStore.delete('tiktok_oauth_random_state');
    
    // Determine redirect URL
    let redirectPath = '/?tiktok_connected=true';
    if (returnUrl) {
      try {
        let pathToUse: string | null = returnUrl;
        
        if (returnUrl.startsWith('http://') || returnUrl.startsWith('https://')) {
          const returnUrlObj = new URL(returnUrl);
          const baseUrlObj = new URL(baseUrl);
          
          if (returnUrlObj.origin !== baseUrlObj.origin) {
            console.warn('[TikTok Callback] Return URL origin mismatch, extracting path only');
            pathToUse = returnUrlObj.pathname + returnUrlObj.search;
          } else {
            pathToUse = returnUrlObj.pathname + returnUrlObj.search;
          }
        }
        
        if (pathToUse) {
          if (!pathToUse.startsWith('/')) {
            pathToUse = '/' + pathToUse;
          }
          
          const separator = pathToUse.includes('?') ? '&' : '?';
          redirectPath = `${pathToUse}${separator}tiktok_connected=true`;
          console.log('[TikTok Callback] Redirecting to original page:', redirectPath);
        }
      } catch (e) {
        console.warn('[TikTok Callback] Invalid returnUrl format, using default:', e);
      }
    }
    
    const redirectUrl = new URL(redirectPath, baseUrl);
    console.log('[TikTok Callback] Final redirect URL:', redirectUrl.toString());
    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error('[TikTok Callback] Error:', error);
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

