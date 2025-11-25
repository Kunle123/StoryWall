import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { verifyOAuth1TokenPermissions } from '@/lib/twitter/api';

/**
 * Admin endpoint to verify OAuth 1.0a tokens (including manually provided ones)
 * 
 * Usage:
 * POST /api/admin/verify-oauth1-tokens
 * Body: {
 *   "token": "your_access_token",
 *   "tokenSecret": "your_access_token_secret"
 * }
 * 
 * Or test with user's stored tokens:
 * POST /api/admin/verify-oauth1-tokens?email=kunle2000@gmail.com
 */
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { token, tokenSecret, email } = body;
    
    // Get consumer key/secret from environment
    const consumerKey = process.env.TWITTER_API_KEY;
    const consumerSecret = process.env.TWITTER_API_SECRET;
    
    if (!consumerKey || !consumerSecret) {
      return NextResponse.json(
        { error: 'OAuth 1.0a not configured on server (missing TWITTER_API_KEY or TWITTER_API_SECRET)' },
        { status: 500 }
      );
    }
    
    let tokenToTest: string | null = null;
    let tokenSecretToTest: string | null = null;
    
    // If email provided, get tokens from database
    if (email) {
      const { prisma } = await import('@/lib/db/prisma');
      const user = await prisma.user.findFirst({
        where: { email },
        select: {
          twitterOAuth1Token: true,
          twitterOAuth1TokenSecret: true,
        },
      });
      
      if (!user || !user.twitterOAuth1Token || !user.twitterOAuth1TokenSecret) {
        return NextResponse.json(
          { error: 'User not found or OAuth 1.0a tokens not configured', email },
          { status: 404 }
        );
      }
      
      tokenToTest = user.twitterOAuth1Token;
      tokenSecretToTest = user.twitterOAuth1TokenSecret;
    } else if (token && tokenSecret) {
      // Use manually provided tokens
      tokenToTest = token;
      tokenSecretToTest = tokenSecret;
    } else {
      return NextResponse.json(
        { error: 'Either provide email or token+tokenSecret in request body' },
        { status: 400 }
      );
    }
    
    if (!tokenToTest || !tokenSecretToTest) {
      return NextResponse.json(
        { error: 'Missing token or tokenSecret' },
        { status: 400 }
      );
    }
    
    // Verify token permissions
    console.log('[Verify OAuth1 Tokens] Testing tokens...');
    console.log('[Verify OAuth1 Tokens] Consumer Key (first 20 chars):', consumerKey.substring(0, 20));
    console.log('[Verify OAuth1 Tokens] Token (first 20 chars):', tokenToTest.substring(0, 20));
    console.log('[Verify OAuth1 Tokens] Token Secret (first 20 chars):', tokenSecretToTest.substring(0, 20));
    
    // Import the verification function - we need to make it exported
    // For now, let's use a direct test
    const testUrl = 'https://upload.twitter.com/1.1/media/upload.json';
    const testParams = {
      command: 'INIT',
      total_bytes: '1',
      media_type: 'image/jpeg',
    };
    
    const { generateOAuth1Signature, createOAuth1Header } = await import('@/lib/twitter/api');
    const { signature, timestamp, nonce } = generateOAuth1Signature(
      'POST',
      testUrl,
      testParams,
      consumerKey,
      consumerSecret,
      tokenToTest,
      tokenSecretToTest
    );
    
    const authHeader = createOAuth1Header(consumerKey, tokenToTest, signature, timestamp, nonce);
    
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(testParams),
    });
    
    const responseText = await response.text();
    let responseData: any = {};
    try {
      responseData = JSON.parse(responseText);
    } catch {}
    
    const isSuccess = response.ok;
    const hasWritePermissions = isSuccess || (response.status === 400 && responseData?.errors?.[0]?.code !== 215);
    const errorCode = responseData?.errors?.[0]?.code;
    const errorMessage = responseData?.errors?.[0]?.message;
    
    return NextResponse.json({
      success: true,
      test: {
        authenticated: verification.authenticated,
        hasWritePermissions: verification.hasWritePermissions,
        errorCode,
        errorMessage,
      },
      tokens: {
        consumerKey: consumerKey.substring(0, 20) + '...',
        token: tokenToTest.substring(0, 20) + '...',
        tokenSecret: tokenSecretToTest.substring(0, 20) + '...',
        source: email ? 'from_database' : 'manually_provided',
      },
      diagnosis: {
        ifSuccess: '✅ Tokens have write permissions - app permissions are correct',
        ifCode215: '❌ Tokens lack write permissions - app permissions in Developer Portal are NOT set to "Read and Write"',
        ifOtherError: `❌ Other error: ${errorMessage || 'Unknown error'}`,
      },
      nextSteps: !verification.hasWritePermissions ? [
        '1. Go to Twitter Developer Portal → Your App → Settings → User authentication settings',
        '2. Find OAuth 1.0a section (separate from OAuth 2.0)',
        '3. Set "App permissions" to "Read and write"',
        '4. Save changes',
        '5. Revoke app access at https://twitter.com/settings/apps',
        '6. Reconnect in StoryWall',
      ] : [],
    });
  } catch (error: any) {
    console.error('[Verify OAuth1 Tokens] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify tokens' },
      { status: 500 }
    );
  }
}

