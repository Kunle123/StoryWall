/**
 * Test Google Imagen with different settings to find what works best
 * 
 * Usage: npx tsx scripts/test-imagen-variations.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

import { generateImageWithImagen, isGoogleCloudConfigured } from '../lib/google/imagen';
import * as fs from 'fs';

async function downloadReferenceImage(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = response.headers.get('content-type') || 'image/jpeg';
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    return null;
  }
}

async function testVariation(
  name: string,
  prompt: string,
  options: {
    quality?: 'fast' | 'standard' | 'ultra';
    referenceImage?: string | null;
    personGeneration?: 'allow_all' | 'dont_allow_adult' | 'dont_allow';
    safetyFilterLevel?: 'block_most' | 'block_some' | 'block_few' | 'block_fewest';
  }
) {
  console.log(`\n🧪 Testing: ${name}`);
  console.log(`   Options:`, JSON.stringify(options, null, 2));
  
  try {
    const startTime = Date.now();
    const imageData = await generateImageWithImagen(prompt, {
      quality: options.quality || 'fast',
      aspectRatio: '1:1',
      referenceImage: options.referenceImage || undefined,
      personGeneration: options.personGeneration || 'dont_allow_adult',
      safetyFilterLevel: options.safetyFilterLevel || 'block_some',
    });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    const base64Match = imageData.match(/data:image\/(\w+);base64,(.+)/);
    if (!base64Match) {
      console.log(`   ❌ Invalid image data`);
      return;
    }

    const imageFormat = base64Match[1] || 'png';
    const base64Data = base64Match[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const outputPath = path.join(__dirname, '..', `test-imagen-${name.toLowerCase().replace(/\s+/g, '-')}.${imageFormat}`);
    fs.writeFileSync(outputPath, buffer);

    console.log(`   ✅ Generated in ${duration}s, saved to: ${outputPath}`);
    console.log(`   📊 Size: ${(buffer.length / 1024).toFixed(2)} KB`);
    
    return outputPath;
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function runTests() {
  if (!isGoogleCloudConfigured()) {
    console.error('❌ Google Cloud credentials not configured!');
    process.exit(1);
  }

  const referenceImageUrl = "https://www.newsday.com/_next/image?url=https%3A%2F%2Fcdn.newsday.com%2Fimage-service%2Fversion%2Fc%3AM2IwNTc3YTctNjFlYy00%3ANGFhMzgyMWYtYzU2NS00%2Fcopy-of-election-2025-mayor-new-york.jpeg%3Ff%3DLandscape%2B16%253A9%26w%3D770%26q%3D1&w=1920&q=80";
  const referenceImage = await downloadReferenceImage(referenceImageUrl);
  
  const basePrompt = "Zohran Mamdani, photorealistic portrait, professional headshot, high quality, detailed facial features, modern politician, clean background";

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Testing Google Imagen with Different Settings');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Test 1: Without reference image, allow_all
  await testVariation(
    "No Reference Allow All",
    basePrompt,
    { personGeneration: 'allow_all', referenceImage: null }
  );

  // Test 2: With reference image, allow_all
  if (referenceImage) {
    await testVariation(
      "With Reference Allow All",
      basePrompt,
      { personGeneration: 'allow_all', referenceImage }
    );
  }

  // Test 3: Without reference, less restrictive safety
  await testVariation(
    "No Reference Block Few",
    basePrompt,
    { 
      personGeneration: 'dont_allow_adult',
      safetyFilterLevel: 'block_few',
      referenceImage: null 
    }
  );

  // Test 4: Generic person prompt (not specific name)
  await testVariation(
    "Generic Person Prompt",
    "Professional politician, photorealistic portrait, professional headshot, high quality, detailed facial features, clean background",
    { 
      personGeneration: 'allow_all',
      referenceImage: referenceImage 
    }
  );

  // Test 5: Standard quality instead of fast
  await testVariation(
    "Standard Quality",
    basePrompt,
    { 
      quality: 'standard',
      personGeneration: 'allow_all',
      referenceImage: referenceImage 
    }
  );

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ All tests complete! Check the generated images to compare quality.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

runTests();

