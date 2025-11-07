/**
 * Test Google Imagen via the actual API route
 * This will work on Railway where credentials are configured
 * 
 * Usage: 
 *   Local: npx tsx scripts/test-imagen-via-api.ts
 *   Railway: The API will automatically use Google Imagen when credentials are set
 */

async function testViaAPI() {
  const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  console.log('🧪 Testing Google Imagen via API Route\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log(`📡 API URL: ${API_URL}\n`);
  
  const testEvent = {
    title: 'Beautiful Sunset',
    description: 'A photorealistic sunset over the ocean',
    year: 2024,
  };
  
  const requestBody = {
    events: [testEvent],
    imageStyle: 'Photorealistic', // This should trigger Google Imagen
    themeColor: '#FF6B35',
    imageReferences: [],
  };
  
  console.log('📤 Sending request to /api/ai/generate-images...');
  console.log(`   Style: ${requestBody.imageStyle}`);
  console.log(`   Event: ${testEvent.title}\n`);
  
  try {
    const response = await fetch(`${API_URL}/api/ai/generate-images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error (${response.status}):`);
      console.error(errorText);
      process.exit(1);
    }
    
    const result = await response.json();
    
    if (result.images && result.images[0]) {
      console.log('✅ Image generated successfully!\n');
      console.log(`🖼️  Image URL: ${result.images[0].substring(0, 100)}...\n`);
      console.log('✅ Google Imagen integration is working via API!\n');
    } else {
      console.error('❌ No image in response');
      console.error('Response:', JSON.stringify(result, null, 2));
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Error calling API:');
    console.error(error.message);
    process.exit(1);
  }
}

testViaAPI();

