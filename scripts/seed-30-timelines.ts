/**
 * Script to seed 30 engaging, US-centric timelines
 * Run with: npx tsx scripts/seed-30-timelines.ts
 */

import fs from 'fs';
import path from 'path';

const SEED_FILE = path.join(process.cwd(), 'data', 'seed-30-timelines.json');
const BATCH_SIZE = 3; // Process 3 timelines per batch
const CONCURRENCY = 1; // Run 1 batch at a time for stability
const REQUEST_TIMEOUT = 600000; // 10 minutes per batch

async function seedTimelineBatch(batchData: any[], apiUrl: string, batchNumber: number) {
  const seedEndpoint = `${apiUrl}/api/admin/seed`;
  
  const timelineCount = batchData[0]?.timelines?.length || 0;
  console.log(`📦 Batch ${batchNumber}: Processing ${timelineCount} timelines...`);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  
  try {
    const response = await fetch(seedEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batchData),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Batch ${batchNumber} failed: ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`✅ Batch ${batchNumber}: Complete!`);
    
    return result.summary || result;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Batch ${batchNumber} timed out after ${REQUEST_TIMEOUT / 1000}s`);
    }
    throw error;
  }
}

async function seedTimelines() {
  try {
    // Read the seed data file
    const seedDataArray = JSON.parse(fs.readFileSync(SEED_FILE, 'utf-8'));
    
    // Get the API URL - allow override via PRODUCTION_URL env var
    const apiUrl = process.env.PRODUCTION_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Extract all timelines and the user from the seed data
    const allTimelines = seedDataArray.flatMap((item: any) => item.timelines || []);
    const user = seedDataArray[0].user; // Assuming one user for all timelines
    
    console.log(`🌐 Using API URL: ${apiUrl}`);
    console.log(`🌱 Starting to seed ${allTimelines.length} timelines in batches of ${BATCH_SIZE}...`);
    console.log(`⚡ Concurrency: ${CONCURRENCY} batches at a time\n`);
    
    // Split timelines into batches, maintaining the API's expected format
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
          seedTimelineBatch(batch, apiUrl, batchNumbers[idx])
        )
      );
      
      results.push(...groupResults);
      
      // Small delay between batch groups to avoid overwhelming the API
      if (i + CONCURRENCY < batches.length) {
        console.log('\n⏳ Waiting 5 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    // Aggregate results
    console.log('\n✅ All batches complete!');
    
    const totalSummary = results.reduce((acc, summary) => {
      return {
        totalUsers: (acc.totalUsers || 0) + (summary.totalUsers || 0),
        usersCreated: (acc.usersCreated || 0) + (summary.usersCreated || 0),
        usersSkipped: (acc.usersSkipped || 0) + (summary.usersSkipped || 0),
        totalTimelines: (acc.totalTimelines || 0) + (summary.totalTimelines || 0),
        timelinesCreated: (acc.timelinesCreated || 0) + (summary.timelinesCreated || 0),
        timelinesFailed: (acc.timelinesFailed || 0) + (summary.timelinesFailed || 0),
        eventsGenerated: (acc.eventsGenerated || 0) + (summary.eventsGenerated || 0),
        imagesGenerated: (acc.imagesGenerated || 0) + (summary.imagesGenerated || 0),
        errors: [...(acc.errors || []), ...(summary.errors || [])]
      };
    }, {} as any);
    
    console.log('\n📊 Final Results:');
    console.log(`   Total users processed: ${totalSummary.totalUsers}`);
    console.log(`   Users created: ${totalSummary.usersCreated}`);
    console.log(`   Users skipped: ${totalSummary.usersSkipped}`);
    console.log(`   Total timelines: ${totalSummary.totalTimelines}`);
    console.log(`   Timelines created: ${totalSummary.timelinesCreated}`);
    console.log(`   Timelines failed: ${totalSummary.timelinesFailed}`);
    console.log(`   Events generated: ${totalSummary.eventsGenerated}`);
    console.log(`   Images generated: ${totalSummary.imagesGenerated}`);
    
    if (totalSummary.errors && totalSummary.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      totalSummary.errors.forEach((error: string, index: number) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
  } catch (error: any) {
    console.error('❌ Failed to seed timelines:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the seed function
seedTimelines();

