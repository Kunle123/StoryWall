/**
 * Script to seed 30 engaging, US-centric timelines
 * Run with: npx tsx scripts/seed-30-timelines.ts
 */

import fs from 'fs';
import path from 'path';

const SEED_FILE = path.join(process.cwd(), 'data', 'seed-30-timelines.json');

async function seedTimelines() {
  try {
    // Read the seed data file
    const seedData = JSON.parse(fs.readFileSync(SEED_FILE, 'utf-8'));
    
    // Get the API URL - allow override via PRODUCTION_URL env var
    const apiUrl = process.env.PRODUCTION_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const seedEndpoint = `${apiUrl}/api/admin/seed`;
    
    console.log(`🌐 Using API URL: ${apiUrl}`);
    
    console.log('🌱 Starting to seed 30 timelines...');
    console.log(`📡 Sending request to: ${seedEndpoint}`);
    
    // Send POST request to the seed endpoint
    const response = await fetch(seedEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(seedData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error seeding timelines:', errorText);
      process.exit(1);
    }
    
    const result = await response.json();
    
    console.log('✅ Seeding complete!');
    
    if (result.summary) {
      const summary = result.summary;
      console.log('\n📊 Results:');
      console.log(`   Total users processed: ${summary.totalUsers}`);
      console.log(`   Users created: ${summary.usersCreated}`);
      console.log(`   Users skipped: ${summary.usersSkipped}`);
      console.log(`   Total timelines: ${summary.totalTimelines}`);
      console.log(`   Timelines created: ${summary.timelinesCreated}`);
      console.log(`   Timelines failed: ${summary.timelinesFailed}`);
      console.log(`   Events generated: ${summary.eventsGenerated}`);
      console.log(`   Images generated: ${summary.imagesGenerated}`);
      
      if (summary.errors && summary.errors.length > 0) {
        console.log('\n⚠️  Errors:');
        summary.errors.forEach((error: string, index: number) => {
          console.log(`   ${index + 1}. ${error}`);
        });
      }
    } else {
      console.log('\n📊 Response:', JSON.stringify(result, null, 2));
    }
    
  } catch (error: any) {
    console.error('❌ Failed to seed timelines:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the seed function
seedTimelines();

