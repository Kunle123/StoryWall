/**
 * STEP 1: Generate timelines and events only (no images, no enhanced descriptions)
 * Fast and cheap - just creates the timeline structure
 * Run with: npx tsx scripts/step1-generate-timelines.ts
 */

import fs from 'fs';
import path from 'path';

const SEED_FILE = path.join(process.cwd(), 'data', 'seed-30-timelines.json');
const BATCH_SIZE = 5; // Process 5 timelines per batch
const CONCURRENCY = 2; // Run 2 batches at a time
const REQUEST_TIMEOUT = 300000; // 5 minutes per batch

async function generateTimelineBatch(batchData: any[], apiUrl: string, batchNumber: number) {
  const seedEndpoint = `${apiUrl}/api/admin/seed`;
  
  // Disable image generation for step 1
  const batchWithoutImages = batchData.map(entry => ({
    ...entry,
    timelines: entry.timelines.map((t: any) => ({
      ...t,
      generateImages: false, // Disable images in step 1
    }))
  }));
  
  const timelineCount = batchWithoutImages[0]?.timelines?.length || 0;
  console.log(`📦 Batch ${batchNumber}: Processing ${timelineCount} timelines (events only)...`);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  
  try {
    const response = await fetch(seedEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batchWithoutImages),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Batch ${batchNumber} failed: ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`✅ Batch ${batchNumber}: Complete! (${result.summary?.eventsGenerated || 0} events created)`);
    
    return result.summary || result;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Batch ${batchNumber} timed out after ${REQUEST_TIMEOUT / 1000}s`);
    }
    throw error;
  }
}

async function generateTimelines() {
  try {
    // Read the seed data file
    const seedDataArray = JSON.parse(fs.readFileSync(SEED_FILE, 'utf-8'));
    
    // Get the API URL
    const apiUrl = process.env.PRODUCTION_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Extract all timelines and the user from the seed data
    const allTimelines = seedDataArray.flatMap((item: any) => item.timelines || []);
    const user = seedDataArray[0].user;
    
    console.log(`\n🎯 STEP 1: Generate Timelines + Events (No Images)`);
    console.log(`🌐 Using API URL: ${apiUrl}`);
    console.log(`📝 Processing ${allTimelines.length} timelines in batches of ${BATCH_SIZE}...`);
    console.log(`⚡ Concurrency: ${CONCURRENCY} batches at a time\n`);
    
    // Split timelines into batches
    const batches = [];
    for (let i = 0; i < allTimelines.length; i += BATCH_SIZE) {
      batches.push([
        {
          user: user,
          timelines: allTimelines.slice(i, i + BATCH_SIZE)
        }
      ]);
    }
    
    console.log(`📋 Total batches: ${batches.length}\n`);
    
    // Process batches with concurrency limit
    const results = [];
    for (let i = 0; i < batches.length; i += CONCURRENCY) {
      const batchGroup = batches.slice(i, i + CONCURRENCY);
      const batchNumbers = Array.from(
        { length: batchGroup.length },
        (_, idx) => i + idx + 1
      );
      
      console.log(`\n🚀 Starting batch group: ${batchNumbers.join(', ')}`);
      
      const groupResults = await Promise.all(
        batchGroup.map((batch, idx) => 
          generateTimelineBatch(batch, apiUrl, batchNumbers[idx])
        )
      );
      
      results.push(...groupResults);
      
      // Small delay between batch groups
      if (i + CONCURRENCY < batches.length) {
        console.log('\n⏳ Waiting 3 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    // Aggregate results
    console.log('\n✅ All batches complete!');
    
    const totalSummary = results.reduce((acc, summary) => {
      return {
        timelinesCreated: (acc.timelinesCreated || 0) + (summary.timelinesCreated || 0),
        eventsGenerated: (acc.eventsGenerated || 0) + (summary.eventsGenerated || 0),
        timelinesFailed: (acc.timelinesFailed || 0) + (summary.timelinesFailed || 0),
        errors: [...(acc.errors || []), ...(summary.errors || [])]
      };
    }, {} as any);
    
    console.log('\n📊 Step 1 Results:');
    console.log(`   Timelines created: ${totalSummary.timelinesCreated}`);
    console.log(`   Timelines failed: ${totalSummary.timelinesFailed}`);
    console.log(`   Events generated: ${totalSummary.eventsGenerated}`);
    
    if (totalSummary.errors && totalSummary.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      totalSummary.errors.forEach((error: string, index: number) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    console.log('\n✨ Step 1 complete! Run step2-enhance-descriptions.ts next.');
    
  } catch (error: any) {
    console.error('❌ Failed to generate timelines:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

generateTimelines();

