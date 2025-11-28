import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser } from '@/lib/db/users';
import { prisma } from '@/lib/db/prisma';
import { generateOAuth1Signature } from '@/lib/twitter/api';

/**
 * GET /api/twitter/test-append-signature
 * Test endpoint to validate APPEND step signature generation WITHOUT making actual API calls
 * This allows testing OAuth 1.0a signature generation without hitting rate limits
 * 
 * Usage: Visit /api/twitter/test-append-signature in your browser or use curl
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser(userId);
    
    // Get OAuth 1.0a tokens from database
    const userWithToken = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        twitterOAuth1Token: true,
        twitterOAuth1TokenSecret: true,
      },
    });

    if (!userWithToken?.twitterOAuth1Token || !userWithToken?.twitterOAuth1TokenSecret) {
      return NextResponse.json(
        { error: 'OAuth 1.0a tokens not found. Please connect your Twitter account.' },
        { status: 400 }
      );
    }

    const consumerKey = process.env.TWITTER_API_KEY;
    const consumerSecret = process.env.TWITTER_API_SECRET;

    if (!consumerKey || !consumerSecret) {
      return NextResponse.json(
        { error: 'Twitter API credentials not configured' },
        { status: 500 }
      );
    }

    // Simulate APPEND step parameters (you can pass custom values via query params)
    const searchParams = request.nextUrl.searchParams;
    const testMediaId = searchParams.get('media_id') || '1994362715783958528';
    const testSegmentIndex = searchParams.get('segment_index') || '0';

    const uploadUrl = 'https://upload.twitter.com/1.1/media/upload.json';
    const appendParams = {
      command: 'APPEND',
      media_id: testMediaId,
      segment_index: testSegmentIndex,
    };

    // Generate signature (same as actual APPEND step)
    const { signature, timestamp, nonce } = generateOAuth1Signature(
      'POST',
      uploadUrl,
      appendParams,
      consumerKey,
      consumerSecret,
      userWithToken.twitterOAuth1Token,
      userWithToken.twitterOAuth1TokenSecret
    );

    // Simulate what createOAuth1Header would generate (with percent-encoded signature for media upload)
    const percentEncodedSignature = encodeURIComponent(signature);
    const authHeader = `OAuth oauth_consumer_key="${encodeURIComponent(consumerKey)}", oauth_nonce="${encodeURIComponent(nonce)}", oauth_signature="${percentEncodedSignature}", oauth_signature_method="HMAC-SHA1", oauth_timestamp="${timestamp}", oauth_token="${encodeURIComponent(userWithToken.twitterOAuth1Token)}", oauth_version="1.0"`;

    // Simulate form-data headers
    const FormDataNode = require('form-data');
    const testFormData = new FormDataNode();
    testFormData.append('command', 'APPEND');
    testFormData.append('media_id', testMediaId);
    testFormData.append('segment_index', testSegmentIndex);
    const formHeaders = testFormData.getHeaders();

    // Return comprehensive test results
    return NextResponse.json({
      success: true,
      message: '✅ Signature and request construction validated (NO API call made - safe to test)',
      test: {
        url: uploadUrl,
        method: 'POST',
        params: appendParams,
        signature: {
          raw: signature,
          percentEncoded: percentEncodedSignature,
          length: signature.length,
          endsWithEquals: signature.endsWith('='),
        },
        timestamp,
        nonce,
        authorizationHeader: authHeader,
        formHeaders: {
          contentType: formHeaders['content-type'],
          hasBoundary: formHeaders['content-type']?.includes('boundary'),
        },
        validation: {
          signatureFormat: signature.includes('=') ? '✅ valid (contains padding)' : '❌ unusual',
          signatureLength: signature.length > 20 && signature.length < 30 ? '✅ normal' : '⚠️ unusual',
          signaturePercentEncoded: percentEncodedSignature.includes('%3D') ? '✅ correct' : '❌ missing %3D',
          timestampValid: /^\d+$/.test(timestamp) && parseInt(timestamp) > 0 ? '✅ valid' : '❌ invalid',
          nonceValid: /^[a-f0-9]{32}$/.test(nonce) ? '✅ valid' : '❌ invalid',
          formDataBoundary: formHeaders['content-type']?.includes('boundary') ? '✅ present' : '❌ missing',
        },
      },
      note: 'This endpoint validates signature generation and request construction. It does NOT make actual API calls to Twitter, so it will NOT hit rate limits.',
      nextSteps: [
        '1. Verify signature is percent-encoded correctly (should contain %3D for =)',
        '2. Verify form-data boundary is present in Content-Type header',
        '3. Once validated, try actual upload (but wait for rate limit to reset)',
      ],
    });
  } catch (error: any) {
    console.error('[Test Append Signature] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate test signature' },
      { status: 500 }
    );
  }
}

