/**
 * Test seeding with first 3 timelines (one batch)
 */

import fs from 'fs';
import path from 'path';

const SEED_FILE = path.join(process.cwd(), 'data', 'seed-30-timelines.json');

async function testFirstBatch() {
  try {
    // Read the seed data file
    const seedDataArray = JSON.parse(fs.readFileSync(SEED_FILE, 'utf-8'));
    
    // Get the API URL
    const apiUrl = process.env.PRODUCTION_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Extract next 3 timelines (indices 3-5)
    const next3Timelines = seedDataArray[0]?.timelines?.slice(3, 6);
    const user = seedDataArray[0]?.user;
    
    if (!next3Timelines || next3Timelines.length < 3) {
      throw new Error('Not enough timelines in seed file');
    }
    
    console.log(`🧪 Testing with next 3 timelines (4-6):`);
    next3Timelines.forEach((t: any, i: number) => {
      console.log(`   ${i + 4}. ${t.title}`);
    });
    console.log(`\n🌐 Using API URL: ${apiUrl}\n`);
    
    // Create test batch with 3 timelines
    const testBatch = [{
      user: user,
      timelines: next3Timelines
    }];
    
    const seedEndpoint = `${apiUrl}/api/admin/seed`;
    
    console.log(`📡 Sending request to: ${seedEndpoint}\n`);
    
    const response = await fetch(seedEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testBatch),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Test failed:', errorText);
      process.exit(1);
    }
    
    const result = await response.json();
    
    console.log('✅ Batch complete!\n');
    
    const summary = result.summary;
    console.log('📊 Results:');
    console.log(`   Timelines created: ${summary?.timelinesCreated || 0}`);
    console.log(`   Events generated: ${summary?.eventsGenerated || 0}`);
    console.log(`   Images generated: ${summary?.imagesGenerated || 0}`);
    
    if (summary?.errors && summary.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      summary.errors.forEach((error: string) => {
        console.log(`   - ${error}`);
      });
    }
    
    console.log('\n✅ First batch test passed!');
    console.log('🚀 Ready to proceed with full 30-timeline batch.');
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testFirstBatch();

