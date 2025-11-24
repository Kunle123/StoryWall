/**
 * Test script to post a tweet with an image to Twitter
 * 
 * Usage:
 * 1. Make sure you're signed in to StoryWall and have connected Twitter (OAuth 2.0)
 * 2. Make sure you've enabled image upload (OAuth 1.0a) in the app
 * 3. Get your Clerk session token from browser DevTools:
 *    - Open DevTools → Application → Cookies
 *    - Copy the value of __session cookie
 * 4. Run: CLERK_SESSION="your_session_token" npx tsx scripts/test-twitter-image-post.ts
 * 
 * Or use the browser console method (see below)
 */

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://www.storywall.com';
const CLERK_SESSION = process.env.CLERK_SESSION;

async function testPostTweetWithImage() {
  const testText = 'Test tweet from StoryWall API 🚀\n\nTesting image upload with OAuth 1.0a!';
  const testImageUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800'; // Sample image URL
  
  console.log('🧪 Testing Twitter post with image...\n');
  console.log(`API Base: ${API_BASE}`);
  console.log(`Tweet text: ${testText}`);
  console.log(`Image URL: ${testImageUrl}\n`);
  
  if (!CLERK_SESSION) {
    console.error('❌ CLERK_SESSION environment variable not set');
    console.log('\nTo get your session token:');
    console.log('1. Open StoryWall in your browser');
    console.log('2. Open DevTools (F12) → Application → Cookies');
    console.log('3. Copy the value of the __session cookie');
    console.log('4. Run: CLERK_SESSION="your_token" npx tsx scripts/test-twitter-image-post.ts');
    console.log('\nOr use the browser console method (see script comments)');
    process.exit(1);
  }
  
  try {
    const response = await fetch(`${API_BASE}/api/twitter/post-tweet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `__session=${CLERK_SESSION}`,
      },
      body: JSON.stringify({
        text: testText,
        imageUrl: testImageUrl,
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Error posting tweet:', data);
      return;
    }
    
    console.log('✅ Success! Tweet posted:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.tweetUrl) {
      console.log(`\n🔗 View tweet: ${data.tweetUrl}`);
    }
    
    if (data.imageAttached) {
      console.log('✅ Image was successfully attached!');
    } else if (data.warning) {
      console.log('⚠️  Warning:', data.warning);
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

testPostTweetWithImage();

