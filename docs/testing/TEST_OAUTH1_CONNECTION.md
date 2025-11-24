# Test OAuth 1.0a Connection

## Quick Test in Browser Console

1. **Make sure you're signed in** to StoryWall as `kunle2000@gmail.com`
2. **Open DevTools** (F12) → Console tab
3. **Run this test script:**

```javascript
// Test OAuth 1.0a connection
console.log('🧪 Testing OAuth 1.0a connection...\n');

// Step 1: Check current token status
console.log('Step 1: Checking current token status...');
fetch('/api/admin/check-twitter-tokens?email=kunle2000@gmail.com')
  .then(r => r.json())
  .then(data => {
    console.log('Current status:', data);
    console.log('OAuth 2.0:', data.tokens.oauth2.connected ? '✅ Connected' : '❌ Not Connected');
    console.log('OAuth 1.0a:', data.tokens.oauth1.configured ? '✅ Configured' : '❌ Not Configured');
    console.log('\n');
    
    // Step 2: Test OAuth 1.0a initiation
    if (!data.tokens.oauth1.configured) {
      console.log('Step 2: Testing OAuth 1.0a initiation...');
      const returnPath = window.location.pathname + window.location.search;
      console.log('Return path:', returnPath);
      
      return fetch(`/api/twitter/oauth1?returnUrl=${encodeURIComponent(returnPath)}`)
        .then(r => r.json())
        .then(oauthData => {
          if (oauthData.authUrl) {
            console.log('✅ OAuth 1.0a initiation successful!');
            console.log('Auth URL received:', oauthData.authUrl.substring(0, 100) + '...');
            console.log('\n🔗 Ready to redirect to Twitter!');
            console.log('Click the button below or run: window.location.href = "' + oauthData.authUrl + '"');
            
            // Create a test button
            const testBtn = document.createElement('button');
            testBtn.textContent = '🚀 Test OAuth 1.0a Flow';
            testBtn.style.cssText = 'padding: 10px 20px; background: #1DA1F2; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; margin: 10px 0;';
            testBtn.onclick = () => {
              console.log('Redirecting to Twitter...');
              window.location.href = oauthData.authUrl;
            };
            document.body.appendChild(testBtn);
          } else {
            console.error('❌ OAuth 1.0a initiation failed:', oauthData);
            if (oauthData.error) {
              console.error('Error:', oauthData.error);
              if (oauthData.error.includes('Callback URL not approved')) {
                console.error('\n⚠️  The callback URL needs to be added to Twitter Developer Portal!');
                console.error('Add this URL: https://www.storywall.com/api/twitter/oauth1/callback');
              }
            }
          }
        })
        .catch(err => {
          console.error('❌ Error initiating OAuth 1.0a:', err);
        });
    } else {
      console.log('✅ OAuth 1.0a is already configured!');
      console.log('You can test posting a tweet with an image now.');
    }
  })
  .catch(err => {
    console.error('❌ Error checking token status:', err);
  });
```

## Expected Results

### ✅ Success
- You should see "OAuth 1.0a initiation successful!"
- A button will appear to test the flow
- Clicking it will redirect you to Twitter for authorization

### ❌ If you see "Callback URL not approved"
- Make sure you added `https://www.storywall.com/api/twitter/oauth1/callback` to Twitter Developer Portal
- Wait 1-2 minutes after saving for Twitter to update
- Try again

### ✅ After Authorization
- You'll be redirected back to StoryWall
- OAuth 1.0a tokens will be saved automatically
- You can then test posting a tweet with an image

