/**
 * Test script for Google Imagen 4 integration
 * 
 * Usage: npx tsx scripts/test-google-imagen.ts
 */

import { generateImageWithImagen, isGoogleCloudConfigured } from '../lib/google/imagen';

async function testGoogleImagen() {
  console.log('🧪 Testing Google Imagen 4 Integration\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Step 1: Check if credentials are configured
  console.log('1️⃣ Checking Google Cloud credentials...');
  const isConfigured = isGoogleCloudConfigured();
  
  if (!isConfigured) {
    console.error('❌ Google Cloud credentials not configured!\n');
    console.log('Required environment variables:');
    console.log('  - GOOGLE_CLOUD_PROJECT_ID');
    console.log('  - GOOGLE_APPLICATION_CREDENTIALS_JSON\n');
    process.exit(1);
  }
  
  console.log('✅ Google Cloud credentials found\n');

  // Step 2: Check environment variables
  console.log('2️⃣ Checking environment variables...');
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  
  if (!projectId) {
    console.error('❌ GOOGLE_CLOUD_PROJECT_ID not set');
    process.exit(1);
  }
  
  if (!credentialsJson) {
    console.error('❌ GOOGLE_APPLICATION_CREDENTIALS_JSON not set');
    process.exit(1);
  }
  
  console.log(`✅ Project ID: ${projectId}`);
  console.log(`✅ Credentials JSON: ${credentialsJson.substring(0, 50)}...\n`);

  // Step 3: Test image generation
  console.log('3️⃣ Testing image generation...');
  console.log('   Generating a simple test image...\n');
  
  try {
    const testPrompt = 'A beautiful sunset over a calm ocean, photorealistic, high quality';
    
    console.log(`📝 Prompt: "${testPrompt}"`);
    console.log('⏳ Generating image (this may take 10-30 seconds)...\n');
    
    const startTime = Date.now();
    const imageData = await generateImageWithImagen(testPrompt, {
      quality: 'fast',
      aspectRatio: '1:1',
    });
    const endTime = Date.now();
    
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    if (imageData) {
      console.log('✅ Image generated successfully!\n');
      console.log(`⏱️  Generation time: ${duration} seconds`);
      console.log(`📊 Image data length: ${imageData.length} characters`);
      console.log(`🖼️  Image format: ${imageData.substring(0, 20)}...`);
      console.log('\n✅ Google Imagen 4 integration is working!\n');
      
      // Optionally save the image to a file for inspection
      if (imageData.startsWith('data:image')) {
        const fs = require('fs');
        const path = require('path');
        const base64Data = imageData.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const outputPath = path.join(__dirname, '../test-imagen-output.png');
        fs.writeFileSync(outputPath, buffer);
        console.log(`💾 Image saved to: ${outputPath}\n`);
      }
    } else {
      console.error('❌ Image generation returned null/empty');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Error generating image:\n');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('🎉 All tests passed! Google Imagen 4 is ready to use.\n');
}

// Run the test
testGoogleImagen().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

