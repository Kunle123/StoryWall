# Debug Image Upload Issue

## Step 1: Verify OAuth 1.0a Tokens Are Saved

Run this in your browser console to check if OAuth 1.0a tokens are actually saved:

```javascript
fetch('/api/admin/check-twitter-tokens?email=kunle2000@gmail.com')
  .then(r => r.json())
  .then(data => {
    console.log('📊 Token Status:');
    console.log('OAuth 2.0:', data.tokens.oauth2.connected ? '✅' : '❌');
    console.log('OAuth 1.0a:', data.tokens.oauth1.configured ? '✅' : '❌');
    console.log('Has Token:', data.tokens.oauth1.hasToken);
    console.log('Has Secret:', data.tokens.oauth1.hasSecret);
    console.log('Token Preview:', data.tokens.oauth1.tokenPreview);
    console.log('Secret Preview:', data.tokens.oauth1.secretPreview);
    
    if (!data.tokens.oauth1.configured) {
      console.error('❌ OAuth 1.0a is NOT configured!');
      console.error('You need to complete the OAuth 1.0a authorization flow.');
    } else {
      console.log('✅ OAuth 1.0a is configured!');
    }
  });
```

## Step 2: Test Image Upload Directly

Test posting a tweet with an image and check the response:

```javascript
fetch('/api/twitter/post-tweet', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Test tweet with image 🚀\n\nTesting OAuth 1.0a image upload!',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800'
  })
})
  .then(r => r.json())
  .then(data => {
    console.log('📤 Post Result:', data);
    console.log('Image Attached:', data.imageAttached ? '✅ Yes' : '❌ No');
    if (data.warning) {
      console.warn('⚠️  Warning:', data.warning);
    }
    if (data.error) {
      console.error('❌ Error:', data.error);
    }
  })
  .catch(err => console.error('❌ Request failed:', err));
```

## Step 3: Check Server Logs

If the image still doesn't attach, check the server logs for:
- `[Twitter Post Tweet] Using OAuth 1.0a for media upload` - confirms OAuth 1.0a is being used
- `[Twitter Upload Media OAuth1]` - shows the upload process
- Any error messages about media upload

## Common Issues

### Issue 1: OAuth 1.0a tokens not saved
**Symptom**: `oauth1.configured: false` in the status check
**Solution**: Complete the OAuth 1.0a authorization flow again

### Issue 2: Environment variables missing
**Symptom**: Error about `TWITTER_API_KEY` or `TWITTER_API_SECRET`
**Solution**: Make sure these are set in your environment variables

### Issue 3: Image URL not accessible
**Symptom**: Error about image URL not accessible
**Solution**: Make sure the image URL is publicly accessible and returns an image

### Issue 4: Media upload fails silently
**Symptom**: Tweet posts but `imageAttached: false`
**Solution**: Check server logs for the actual error message

