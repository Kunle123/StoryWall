/**
 * Test Google Imagen with a reference image for Zohran Mamdani
 * 
 * Usage: npx tsx scripts/test-imagen-with-reference.ts
 */

// Load environment variables from .env.local
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

import { generateImageWithImagen, isGoogleCloudConfigured } from '../lib/google/imagen';
import * as fs from 'fs';

// Helper to download reference image from URL and convert to base64
async function downloadReferenceImage(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.warn(`Failed to download reference image: ${imageUrl}`);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = response.headers.get('content-type') || 'image/jpeg';
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error(`Error downloading reference image ${imageUrl}:`, error);
    return null;
  }
}

async function testWithReference() {
  console.log('🧪 Testing Google Imagen 4 WITH Reference Image\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Check credentials
  if (!isGoogleCloudConfigured()) {
    console.error('❌ Google Cloud credentials not configured!\n');
    process.exit(1);
  }

  console.log('✅ Credentials found\n');

  // You can provide a reference image URL here
  // For Zohran Mamdani, you could use a news photo or official image
  const referenceImageUrl = process.argv[2] || '';
  
  let referenceImage: string | null = null;
  
  if (referenceImageUrl) {
    console.log(`📥 Downloading reference image from: ${referenceImageUrl}\n`);
    referenceImage = await downloadReferenceImage(referenceImageUrl);
    if (referenceImage) {
      console.log('✅ Reference image downloaded\n');
    } else {
      console.log('⚠️  Failed to download reference image, continuing without it\n');
    }
  } else {
    console.log('ℹ️  No reference image URL provided\n');
    console.log('   Usage: npx tsx scripts/test-imagen-with-reference.ts <image-url>\n');
    console.log('   Example: npx tsx scripts/test-imagen-with-reference.ts https://example.com/zohran.jpg\n');
  }

  const testPrompt = 'Zohran Mamdani, photorealistic portrait, professional headshot, high quality, detailed facial features, modern politician, clean background';
  
  console.log('📝 Generating image with prompt:');
  console.log(`   "${testPrompt}"\n`);
  if (referenceImage) {
    console.log('   ✅ Using reference image for better likeness\n');
  } else {
    console.log('   ⚠️  No reference image - likeness may vary\n');
  }
  console.log('⏳ This may take 10-30 seconds...\n');

  try {
    const startTime = Date.now();
    const imageData = await generateImageWithImagen(testPrompt, {
      quality: 'fast',
      aspectRatio: '1:1',
      personGeneration: 'dont_allow_adult',
      referenceImage: referenceImage, // Pass reference image if available
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
    const filename = referenceImage ? 'test-imagen-with-reference.png' : 'test-imagen-no-reference.png';
    const outputPath = path.join(outputDir, filename);
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

testWithReference();

