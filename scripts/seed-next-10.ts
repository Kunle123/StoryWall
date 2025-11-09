/**
 * Script to seed the next 10 timelines from the list of 60
 * Run with: npx tsx scripts/seed-next-10.ts
 * 
 * This script will seed timelines starting from index 10 (11th timeline) through index 19 (20th timeline)
 */

import fs from 'fs';
import path from 'path';

const SEED_FILE = path.join(process.cwd(), 'data', 'seed-60-timelines.json');
const START_INDEX = 10; // Start from the 11th timeline (0-indexed, so 10 = 11th)
const COUNT = 10; // Seed 10 timelines
const BATCH_SIZE = 3; // Process 3 timelines per batch
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

async function seedNext10Timelines() {
  try {
    // Read the seed data file
    const seedDataArray = JSON.parse(fs.readFileSync(SEED_FILE, 'utf-8'));
    
    // Get the API URL - allow override via PRODUCTION_URL env var
    const apiUrl = process.env.PRODUCTION_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Extract all timelines and the user from the seed data
    const allTimelines = seedDataArray.flatMap((item: any) => item.timelines || []);
    const user = seedDataArray[0].user; // Assuming one user for all timelines
    
    // Get the next 10 timelines starting from START_INDEX
    const timelinesToSeed = allTimelines.slice(START_INDEX, START_INDEX + COUNT);
    
    if (timelinesToSeed.length === 0) {
      console.log(`⚠️  No timelines found at index ${START_INDEX}. All timelines may have been seeded.`);
      return;
    }
    
    console.log(`🌐 Using API URL: ${apiUrl}`);
    console.log(`🌱 Seeding timelines ${START_INDEX + 1} to ${START_INDEX + timelinesToSeed.length} (${timelinesToSeed.length} timelines)`);
    console.log(`📋 Timelines to seed:`);
    timelinesToSeed.forEach((tl: any, idx: number) => {
      console.log(`   ${START_INDEX + idx + 1}. ${tl.title}`);
    });
    console.log(`\n⚡ Processing in batches of ${BATCH_SIZE}...\n`);
    
    // Split timelines into batches, maintaining the API's expected format
    const batches = [];
    for (let i = 0; i < timelinesToSeed.length; i += BATCH_SIZE) {
      batches.push([
        {
          user: user,
          timelines: timelinesToSeed.slice(i, i + BATCH_SIZE)
        }
      ]);
    }
    
    console.log(`📋 Total batches: ${batches.length}\n`);
    
    // Process batches sequentially
    const results = [];
    for (let i = 0; i < batches.length; i++) {
      const batchNumber = i + 1;
      console.log(`\n🚀 Starting batch ${batchNumber}/${batches.length}`);
      
      try {
        const result = await seedTimelineBatch(batches[i], apiUrl, batchNumber);
        results.push(result);
        
        // Small delay between batches to avoid overwhelming the API
        if (i < batches.length - 1) {
          console.log('\n⏳ Waiting 5 seconds before next batch...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      } catch (error: any) {
        console.error(`❌ Batch ${batchNumber} failed:`, error.message);
        results.push({ error: error.message });
        // Continue with next batch even if one fails
      }
    }
    
    // Aggregate results
    console.log('\n✅ All batches complete!');
    
    const totalSummary = results.reduce((acc, summary) => {
      if (summary.error) {
        return acc; // Skip error summaries in aggregation
      }
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
    console.log(`   Total users processed: ${totalSummary.totalUsers || 0}`);
    console.log(`   Users created: ${totalSummary.usersCreated || 0}`);
    console.log(`   Users skipped: ${totalSummary.usersSkipped || 0}`);
    console.log(`   Total timelines: ${totalSummary.totalTimelines || 0}`);
    console.log(`   Timelines created: ${totalSummary.timelinesCreated || 0}`);
    console.log(`   Timelines failed: ${totalSummary.timelinesFailed || 0}`);
    console.log(`   Events generated: ${totalSummary.eventsGenerated || 0}`);
    console.log(`   Images generated: ${totalSummary.imagesGenerated || 0}`);
    
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
seedNext10Timelines();

