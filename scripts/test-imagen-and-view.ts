/**
 * Test Google Imagen and save the image for viewing
 * 
 * Usage: npx tsx scripts/test-imagen-and-view.ts
 */

// Load environment variables from .env.local
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

import { generateImageWithImagen, isGoogleCloudConfigured } from '../lib/google/imagen';
import * as fs from 'fs';

async function testAndView() {
  console.log('🧪 Testing Google Imagen 4 - Generating Test Image\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Check credentials
  if (!isGoogleCloudConfigured()) {
    console.error('❌ Google Cloud credentials not configured!\n');
    console.log('Please add to .env.local:');
    console.log('  GOOGLE_CLOUD_PROJECT_ID=your-project-id');
    console.log('  GOOGLE_APPLICATION_CREDENTIALS_JSON=\'{"type":"service_account",...}\'\n');
    process.exit(1);
  }

  console.log('✅ Credentials found\n');

  // Generate a test image with a recognizable person
  const testPrompt = 'Zohran Mamdani, photorealistic portrait, professional headshot, high quality, detailed facial features, modern politician, clean background';
  
  console.log('📝 Generating image with prompt:');
  console.log(`   "${testPrompt}"\n`);
  console.log('⏳ This may take 10-30 seconds...\n');
  console.log('⚠️  Note: Google Imagen may have restrictions on generating images of real people.\n');
  console.log('   If it fails, we\'ll see what error we get.\n');

  try {
    const startTime = Date.now();
    const imageData = await generateImageWithImagen(testPrompt, {
      quality: 'fast',
      aspectRatio: '1:1',
      personGeneration: 'dont_allow_adult', // Try with restricted person generation
    });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (!imageData) {
      console.error('❌ No image data returned');
      process.exit(1);
    }

    // Extract base64 data
    const base64Match = imageData.match(/data:image\/(\w+);base64,(.+)/);
    if (!base64Match) {
      console.error('❌ Invalid image data format');
      process.exit(1);
    }

    const imageFormat = base64Match[1] || 'png';
    const base64Data = base64Match[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Save image
    const outputDir = path.join(__dirname, '..');
    const outputPath = path.join(outputDir, `test-imagen-output.${imageFormat}`);
    fs.writeFileSync(outputPath, buffer);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ Image generated successfully!\n');
    console.log(`⏱️  Generation time: ${duration} seconds`);
    console.log(`📊 Image size: ${(buffer.length / 1024).toFixed(2)} KB`);
    console.log(`🖼️  Format: ${imageFormat.toUpperCase()}\n`);
    console.log(`💾 Image saved to:`);
    console.log(`   ${outputPath}\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📂 To view the image:');
    console.log(`   open "${outputPath}"\n`);
    console.log('   Or navigate to the file in your file explorer\n');

  } catch (error: any) {
    console.error('❌ Error generating image:\n');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testAndView();

