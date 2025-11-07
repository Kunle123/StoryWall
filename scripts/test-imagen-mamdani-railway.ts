/**
 * Test Google Imagen with Zohran Mamdani via Railway API
 * 
 * Usage: 
 *   NEXT_PUBLIC_APP_URL=https://your-railway-url.com npx tsx scripts/test-imagen-mamdani-railway.ts
 * 
 * Or set NEXT_PUBLIC_APP_URL in .env.local
 */

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function testMamdaniImage() {
  console.log('🧪 Testing Google Imagen with Zohran Mamdani\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log(`📡 API URL: ${API_URL}\n`);
  
  const testEvent = {
    title: 'Zohran Mamdani wins mayoral election',
    description: 'Zohran Mamdani celebrating his mayoral victory, photorealistic',
    year: 2024,
  };
  
  const requestBody = {
    events: [testEvent],
    imageStyle: 'Photorealistic', // This should trigger Google Imagen on Railway
    themeColor: '#3B82F6',
    imageReferences: [],
  };
  
  console.log('📝 Test Event:');
  console.log(`   Title: ${testEvent.title}`);
  console.log(`   Description: ${testEvent.description}`);
  console.log(`   Style: ${requestBody.imageStyle}\n`);
  console.log('⏳ Generating image (this may take 10-30 seconds)...\n');
  
  try {
    const startTime = Date.now();
    const response = await fetch(`${API_URL}/api/ai/generate-images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error (${response.status}):`);
      console.error(errorText);
      
      // Check if it's a safety filter issue
      if (errorText.includes('safety') || errorText.includes('person') || errorText.includes('blocked')) {
        console.log('\n⚠️  This might be a safety filter blocking the generation of recognizable people.');
        console.log('   Google Imagen may restrict generating images of real people.\n');
      }
      
      process.exit(1);
    }
    
    const result = await response.json();
    
    if (result.images && result.images[0]) {
      const imageUrl = result.images[0];
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('✅ Image generated successfully!\n');
      console.log(`⏱️  Generation time: ${duration} seconds\n`);
      console.log(`🖼️  Image URL:`);
      console.log(`   ${imageUrl.substring(0, 100)}...\n`);
      
      // If it's a base64 data URL, save it
      if (imageUrl.startsWith('data:image')) {
        const fs = require('fs');
        const path = require('path');
        const base64Match = imageUrl.match(/data:image\/(\w+);base64,(.+)/);
        if (base64Match) {
          const imageFormat = base64Match[1] || 'png';
          const base64Data = base64Match[2];
          const buffer = Buffer.from(base64Data, 'base64');
          const outputPath = path.join(__dirname, '..', `test-mamdani-imagen.${imageFormat}`);
          fs.writeFileSync(outputPath, buffer);
          console.log(`💾 Image saved to: ${outputPath}\n`);
          console.log(`📂 To view: open "${outputPath}"\n`);
        }
      } else {
        console.log('📂 To view the image, open the URL in your browser\n');
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('✅ Test complete! Check the image to see how well it worked.\n');
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

testMamdaniImage();

