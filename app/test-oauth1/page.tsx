'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestOAuth1Page() {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);

  const testOAuth1 = async () => {
    setLoading(true);
    setStatus('Initiating OAuth 1.0a flow...');
    setError(null);

    try {
      const returnPath = window.location.pathname + window.location.search;
      const response = await fetch(`/api/twitter/oauth1?returnUrl=${encodeURIComponent(returnPath)}`);
      const data = await response.json();

      if (data.authUrl) {
        setAuthUrl(data.authUrl);
        setStatus('✅ OAuth 1.0a initiated! Redirecting to Twitter...');
        console.log('✅ OAuth 1.0a initiated!');
        console.log('Auth URL:', data.authUrl);
        // Use replace instead of href to avoid Safari issues
        // Also add a small delay to ensure status message is visible
        setTimeout(() => {
          window.location.replace(data.authUrl);
        }, 100);
      } else {
        const errorMsg = data.error || 'Unknown error';
        setError(`❌ Error: ${errorMsg}`);
        setStatus('');
        console.error('❌ Error:', data);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to initiate OAuth 1.0a';
      setError(`❌ Error: ${errorMsg}`);
      setStatus('');
      console.error('❌ Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Test OAuth 1.0a Connection</CardTitle>
          <CardDescription>
            Test OAuth 1.0a flow independently of OAuth 2.0
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              This will test:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Environment variables (TWITTER_API_KEY, TWITTER_API_SECRET)</li>
              <li>OAuth 1.0a request token generation</li>
              <li>Twitter authorization flow</li>
              <li>Token storage in database</li>
              <li>Token permission verification</li>
            </ul>
          </div>

          {status && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
              <p className="text-sm text-blue-900 dark:text-blue-100">{status}</p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
              <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Button 
              onClick={testOAuth1} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Initiating...' : 'Test OAuth 1.0a Connection (JavaScript)'}
            </Button>
            
            <Button 
              onClick={() => {
                const returnPath = window.location.pathname + window.location.search;
                window.location.href = `/api/twitter/oauth1?returnUrl=${encodeURIComponent(returnPath)}`;
              }}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              Test OAuth 1.0a Connection (Direct Redirect)
            </Button>
          </div>

          {authUrl && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-900 dark:text-yellow-100 mb-2">
                <strong>If automatic redirect failed:</strong>
              </p>
              <a 
                href={authUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
              >
                Click here to open Twitter authorization page
              </a>
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Note:</strong> You must be signed in to use this test.</p>
            <p>After clicking, you'll be redirected to Twitter to authorize the app.</p>
            <p>After authorization, you'll be redirected back here with tokens stored.</p>
            <p className="text-yellow-600 dark:text-yellow-400 mt-2">
              <strong>Tip:</strong> If the redirect fails, use the direct link above or try a different browser.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

