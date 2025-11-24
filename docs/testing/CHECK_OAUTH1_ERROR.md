# Check OAuth 1.0a Callback Error

## Step 1: Check if you were redirected with an error

After authorizing on Twitter, check the URL you were redirected to. Look for error parameters:

```javascript
// Check current URL for OAuth 1.0a errors
const urlParams = new URLSearchParams(window.location.search);
const error = urlParams.get('error');
const message = urlParams.get('message');

if (error) {
  console.error('❌ OAuth 1.0a Error detected in URL:');
  console.error('Error code:', error);
  console.error('Message:', message ? decodeURIComponent(message) : 'No message');
  
  // Common errors:
  const errorMessages = {
    'twitter_oauth1_denied': 'You denied the authorization on Twitter',
    'twitter_oauth1_missing_params': 'Missing OAuth parameters from Twitter',
    'twitter_oauth1_state_mismatch': 'Security check failed - possible CSRF attack',
    'twitter_oauth1_missing_token_secret': 'Request token secret expired or missing',
    'twitter_oauth1_user_mismatch': 'User ID mismatch',
    'twitter_oauth1_expired': 'OAuth flow expired (took more than 10 minutes)',
    'twitter_oauth1_invalid_state': 'Invalid state parameter',
    'twitter_oauth1_not_configured': 'Twitter OAuth 1.0a not configured on server',
    'twitter_oauth1_failed': 'OAuth 1.0a callback failed: ' + (message ? decodeURIComponent(message) : 'Unknown error')
  };
  
  console.error('Meaning:', errorMessages[error] || 'Unknown error');
} else {
  console.log('✅ No error in URL');
  console.log('Current URL:', window.location.href);
}
```

## Step 2: Try the OAuth 1.0a flow again

If there was an error, try again:

```javascript
// Initiate OAuth 1.0a flow again
const returnPath = window.location.pathname + window.location.search;
fetch(`/api/twitter/oauth1?returnUrl=${encodeURIComponent(returnPath)}`)
  .then(r => r.json())
  .then(data => {
    if (data.authUrl) {
      console.log('✅ Redirecting to Twitter...');
      window.location.href = data.authUrl;
    } else {
      console.error('❌ Failed:', data);
    }
  })
  .catch(err => console.error('❌ Error:', err));
```

## Step 3: Check server logs

If the error persists, check the server logs for:
- `[Twitter OAuth1 Callback] Error:` - shows what went wrong
- `[Twitter OAuth1 Callback] Stored OAuth 1.0a tokens` - confirms success

