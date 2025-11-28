import { NextRequest, NextResponse } from 'next/server';

/**
 * TEMPORARY DEBUG ENDPOINT - REMOVE IN PRODUCTION
 * 
 * This endpoint helps diagnose OAuth 1.0a configuration issues.
 * Use this to verify your environment variables and callback URLs.
 * 
 * Access at: /api/twitter/debug-oauth1-config
 */
export async function GET(request: NextRequest) {
  try {
    const consumerKey = process.env.TWITTER_API_KEY;
    const consumerSecret = process.env.TWITTER_API_SECRET;
    const redirectUri = process.env.TWITTER_REDIRECT_URI;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    
    // Construct expected callback URLs
    let expectedOAuth1Callback: string | null = null;
    let callbackSource = 'none';
    
    if (redirectUri) {
      callbackSource = 'TWITTER_REDIRECT_URI';
      // If TWITTER_REDIRECT_URI is set, convert it to OAuth 1.0a callback
      if (redirectUri.includes('/api/twitter/callback') && !redirectUri.includes('/oauth1/callback')) {
        expectedOAuth1Callback = redirectUri.replace('/api/twitter/callback', '/api/twitter/oauth1/callback');
      } else if (!redirectUri.includes('/oauth1/callback')) {
        expectedOAuth1Callback = `${redirectUri.replace(/\/$/, '')}/api/twitter/oauth1/callback`;
      } else {
        expectedOAuth1Callback = redirectUri;
      }
    } else if (appUrl) {
      callbackSource = 'NEXT_PUBLIC_APP_URL';
      expectedOAuth1Callback = `${appUrl}/api/twitter/oauth1/callback`;
    }
    
    // For production (storywall.com), also show both www and non-www variants
    const productionCallbacks = [
      'https://www.storywall.com/api/twitter/oauth1/callback',
      'https://storywall.com/api/twitter/oauth1/callback',
    ];
    
    // Validate environment variables
    const issues: string[] = [];
    const warnings: string[] = [];
    
    if (!consumerKey) {
      issues.push('TWITTER_API_KEY is not set');
    } else {
      // Check for common formatting issues
      if (consumerKey.startsWith('"') || consumerKey.endsWith('"')) {
        issues.push('TWITTER_API_KEY has quotes - remove them');
      }
      if (consumerKey.startsWith("'") || consumerKey.endsWith("'")) {
        issues.push("TWITTER_API_KEY has single quotes - remove them");
      }
      if (consumerKey.includes(' ')) {
        issues.push('TWITTER_API_KEY contains spaces - check for extra spaces');
      }
      if (consumerKey.length < 20 || consumerKey.length > 30) {
        warnings.push(`TWITTER_API_KEY length is ${consumerKey.length} (expected ~25 characters)`);
      }
    }
    
    if (!consumerSecret) {
      issues.push('TWITTER_API_SECRET is not set');
    } else {
      // Check for common formatting issues
      if (consumerSecret.startsWith('"') || consumerSecret.endsWith('"')) {
        issues.push('TWITTER_API_SECRET has quotes - remove them');
      }
      if (consumerSecret.startsWith("'") || consumerSecret.endsWith("'")) {
        issues.push("TWITTER_API_SECRET has single quotes - remove them");
      }
      if (consumerSecret.includes(' ')) {
        issues.push('TWITTER_API_SECRET contains spaces - check for extra spaces');
      }
      if (consumerSecret.length < 40 || consumerSecret.length > 60) {
        warnings.push(`TWITTER_API_SECRET length is ${consumerSecret.length} (expected ~50 characters)`);
      }
    }
    
    if (!expectedOAuth1Callback) {
      issues.push('Cannot determine OAuth 1.0a callback URL - set TWITTER_REDIRECT_URI or NEXT_PUBLIC_APP_URL');
    }
    
    return NextResponse.json({
      success: issues.length === 0,
      configuration: {
        consumerKey: {
          present: !!consumerKey,
          value: consumerKey ? consumerKey.substring(0, 10) + '...' : null,
          fullLength: consumerKey?.length || 0,
          firstChars: consumerKey ? consumerKey.substring(0, 5) : null,
        },
        consumerSecret: {
          present: !!consumerSecret,
          value: consumerSecret ? '***' + consumerSecret.substring(consumerSecret.length - 5) : null,
          fullLength: consumerSecret?.length || 0,
        },
        callbackUrl: {
          expected: expectedOAuth1Callback,
          source: callbackSource,
          productionVariants: productionCallbacks,
          note: 'For storywall.com, you may need to register both www and non-www variants in Twitter Developer Portal',
        },
        environment: {
          redirectUri,
          appUrl,
        },
      },
      issues,
      warnings,
      checklist: {
        step1: {
          title: 'Verify Consumer Key matches Developer Portal',
          description: 'Go to Twitter Developer Portal → Your App → Keys and tokens → API Key',
          check: consumerKey ? `Compare: ${consumerKey.substring(0, 10)}... (length: ${consumerKey.length})` : 'TWITTER_API_KEY not set',
          action: 'If they don\'t match, update TWITTER_API_KEY in your environment variables',
        },
        step2: {
          title: 'Verify Consumer Secret matches Developer Portal',
          description: 'Go to Twitter Developer Portal → Your App → Keys and tokens → API Secret',
          check: consumerSecret ? `Length should be ~50 characters (current: ${consumerSecret.length})` : 'TWITTER_API_SECRET not set',
          action: 'If they don\'t match, update TWITTER_API_SECRET in your environment variables',
        },
        step3: {
          title: 'Verify Callback URL is registered in Developer Portal',
          description: 'Go to Twitter Developer Portal → Your App → Settings → User authentication settings → OAuth 1.0a → Callback URLs',
          check: expectedOAuth1Callback 
            ? `Must match EXACTLY: ${expectedOAuth1Callback}` 
            : 'Cannot determine callback URL - check environment variables',
          action: expectedOAuth1Callback 
            ? `Add this URL if missing: ${expectedOAuth1Callback}\n\nFor storywall.com, you may need BOTH:\n- https://www.storywall.com/api/twitter/oauth1/callback\n- https://storywall.com/api/twitter/oauth1/callback\n\n(case-sensitive, no trailing slash, exact protocol)`
            : 'Set TWITTER_REDIRECT_URI=https://www.storywall.com/api/twitter/callback (or your production URL)',
          productionUrls: productionCallbacks,
        },
        step4: {
          title: 'Verify OAuth 1.0a is enabled',
          description: 'Go to Twitter Developer Portal → Your App → Settings → User authentication settings',
          check: 'OAuth 1.0a section should be enabled',
          action: 'Enable OAuth 1.0a if it\'s disabled',
        },
        step5: {
          title: 'Verify App Permissions',
          description: 'In OAuth 1.0a section, App permissions should be "Read and write"',
          check: 'Check that permissions are set to "Read and write" (not "Read only")',
          action: 'Set to "Read and write" and click Save',
        },
        step6: {
          title: 'Redeploy after changes',
          description: 'After updating environment variables, redeploy your application',
          check: 'Environment variables are loaded at deployment time',
          action: 'Redeploy your application after updating TWITTER_API_KEY or TWITTER_API_SECRET',
        },
      },
      commonIssues: {
        code215: {
          title: 'Code 215 "Bad Authentication data"',
          causes: [
            'Consumer Key/Secret don\'t match Developer Portal',
            'Callback URL doesn\'t match Developer Portal (must be exact, case-sensitive)',
            'OAuth 1.0a not enabled in Developer Portal',
            'Environment variables have quotes or extra spaces',
            'App not redeployed after updating environment variables',
          ],
          solutions: [
            '1. Verify Consumer Key matches Developer Portal → Keys and tokens → API Key',
            '2. Verify Consumer Secret matches Developer Portal → Keys and tokens → API Secret',
            '3. Verify Callback URL matches Developer Portal → Settings → OAuth 1.0a → Callback URLs',
            '4. Check environment variables have no quotes, no spaces: TWITTER_API_KEY=your_key_here',
            '5. Redeploy application after updating environment variables',
          ],
        },
      },
      warning: '⚠️  THIS IS A DEBUG ENDPOINT - REMOVE IN PRODUCTION',
    });
  } catch (error: any) {
    console.error('[Debug OAuth1 Config] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to check configuration',
        details: error.stack
      },
      { status: 500 }
    );
  }
}

