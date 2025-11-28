import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser } from '@/lib/db/users';
import { prisma } from '@/lib/db/prisma';
import { generateOAuth1Signature } from '@/lib/twitter/api';

/**
 * TEMPORARY DEBUG ENDPOINT - REMOVE IN PRODUCTION
 * 
 * This endpoint validates OAuth 1.0a signature generation.
 * Use this to verify:
 * - Timestamp is current (within 5 minutes)
 * - Nonce is unique
 * - Signature length is ~27 characters (base64)
 * 
 * Access at: /api/twitter/debug-signature
 * 
 * Token sources (in order of priority):
 * 1. Environment variables: TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET
 * 2. Authenticated user's tokens from database (if signed in)
 */
export async function GET(request: NextRequest) {
  try {
    const consumerKey = process.env.TWITTER_API_KEY;
    const consumerSecret = process.env.TWITTER_API_SECRET;
    
    // Try environment variables first
    let token = process.env.TWITTER_ACCESS_TOKEN;
    let tokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;
    let tokenSource = 'environment';
    
    // If not in env vars, try authenticated user's tokens from database
    if (!token || !tokenSecret) {
      try {
        const { userId } = await auth();
        if (userId) {
          const user = await getOrCreateUser(userId);
          const userWithToken = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
              twitterOAuth1Token: true,
              twitterOAuth1TokenSecret: true,
            },
          });
          
          if (userWithToken?.twitterOAuth1Token && userWithToken?.twitterOAuth1TokenSecret) {
            token = userWithToken.twitterOAuth1Token;
            tokenSecret = userWithToken.twitterOAuth1TokenSecret;
            tokenSource = 'database (authenticated user)';
          }
        }
      } catch (authError) {
        // Ignore auth errors, continue with env var check
      }
    }

    // Validate environment variables
    if (!consumerKey || !consumerSecret) {
      return NextResponse.json(
        { 
          error: 'TWITTER_API_KEY and TWITTER_API_SECRET must be set',
          missing: {
            consumerKey: !consumerKey,
            consumerSecret: !consumerSecret,
          }
        },
        { status: 500 }
      );
    }

    if (!token || !tokenSecret) {
      return NextResponse.json(
        { 
          error: 'OAuth 1.0a tokens not found',
          missing: {
            token: !token,
            tokenSecret: !tokenSecret,
          },
          note: 'Set TWITTER_ACCESS_TOKEN and TWITTER_ACCESS_TOKEN_SECRET in environment variables, OR sign in and connect your Twitter account to use tokens from the database.',
          tokenSource: tokenSource
        },
        { status: 500 }
      );
    }

    const params = {
      command: 'INIT',
      total_bytes: '1000',
      media_type: 'image/jpeg',
    };

    const { signature, timestamp, nonce } = generateOAuth1Signature(
      'POST',
      'https://upload.twitter.com/1.1/media/upload.json',
      params,
      consumerKey,
      consumerSecret,
      token,
      tokenSecret
    );

    // Validate timestamp (should be within 5 minutes)
    const timestampNum = parseInt(timestamp);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const timestampAge = currentTimestamp - timestampNum;
    const isTimestampValid = timestampAge >= 0 && timestampAge < 300; // 5 minutes

    // Validate signature length (base64 should be ~27-28 chars)
    const isSignatureLengthValid = signature.length >= 20 && signature.length <= 30;

    return NextResponse.json({
      success: true,
      validation: {
        timestamp: {
          value: timestamp,
          current: currentTimestamp,
          age: timestampAge,
          isValid: isTimestampValid,
          note: isTimestampValid 
            ? 'Timestamp is valid (within 5 minutes)' 
            : `Timestamp is ${timestampAge > 0 ? 'old' : 'invalid'} (age: ${timestampAge}s)`
        },
        nonce: {
          value: nonce.substring(0, 10) + '...',
          fullLength: nonce.length,
          isValid: nonce.length >= 16,
          note: 'Nonce should be unique for each request'
        },
        signature: {
          value: signature.substring(0, 20) + '...',
          fullLength: signature.length,
          isValid: isSignatureLengthValid,
          note: isSignatureLengthValid 
            ? 'Signature length is valid (base64, ~27 chars)' 
            : `Signature length is ${signature.length} (expected ~27 chars)`
        }
      },
      // Partial values for verification (security: don't expose full secrets)
      partial: {
        consumerKey: consumerKey.substring(0, 10) + '...',
        consumerKeyLength: consumerKey.length,
        token: token.substring(0, 10) + '...',
        tokenLength: token.length,
        tokenSource,
        timestamp,
        nonce: nonce.substring(0, 10) + '...',
        signature: signature.substring(0, 20) + '...',
        signatureLength: signature.length,
      },
      warning: '⚠️  THIS IS A DEBUG ENDPOINT - REMOVE IN PRODUCTION',
    });
  } catch (error: any) {
    console.error('[Debug Signature] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to generate signature',
        details: error.stack
      },
      { status: 500 }
    );
  }
}

