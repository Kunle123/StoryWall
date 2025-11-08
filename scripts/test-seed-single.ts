/**
 * Test seeding with a single timeline first
 * If successful, starts the full batch seeding
 */

import fs from 'fs';
import path from 'path';

const SEED_FILE = path.join(process.cwd(), 'data', 'seed-30-timelines.json');

async function testSingleTimeline() {
  try {
    // Read the seed data file
    const seedDataArray = JSON.parse(fs.readFileSync(SEED_FILE, 'utf-8'));
    
    // Get the API URL
    const apiUrl = process.env.PRODUCTION_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // Extract first timeline
    const firstTimeline = seedDataArray[0]?.timelines?.[0];
    const user = seedDataArray[0]?.user;
    
    if (!firstTimeline || !user) {
      throw new Error('No timeline data found in seed file');
    }
    
    console.log(`🧪 Testing with 1 timeline: "${firstTimeline.title}"`);
    console.log(`🌐 Using API URL: ${apiUrl}\n`);
    
    // Create test batch with just 1 timeline
    const testBatch = [{
      user: user,
      timelines: [firstTimeline]
    }];
    
    const seedEndpoint = `${apiUrl}/api/admin/seed`;
    
    console.log(`📡 Sending request to: ${seedEndpoint}`);
    console.log(`📦 Testing with: ${firstTimeline.title}\n`);
    
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
    
    console.log('✅ Test successful!\n');
    
    if (result.summary) {
      const summary = result.summary;
      console.log('📊 Test Results:');
      console.log(`   Timeline created: ${summary.timelinesCreated > 0 ? '✅' : '❌'}`);
      console.log(`   Events generated: ${summary.eventsGenerated || 0}`);
      console.log(`   Images generated: ${summary.imagesGenerated || 0}`);
      
      if (summary.errors && summary.errors.length > 0) {
        console.log('\n⚠️  Errors:');
        summary.errors.forEach((error: string) => {
          console.log(`   - ${error}`);
        });
      }
    }
    
    // Check if timeline was actually created
    console.log('\n🔍 Verifying timeline was created...');
    const timelinesResponse = await fetch(`${apiUrl}/api/timelines?limit=10`);
    if (timelinesResponse.ok) {
      const timelines = await timelinesResponse.json();
      const createdTimeline = timelines.find((t: any) => t.title === firstTimeline.title);
      if (createdTimeline) {
        console.log(`✅ Timeline found: "${createdTimeline.title}"`);
        console.log(`   Events: ${createdTimeline.events?.length || 0}`);
        console.log(`   Has images: ${createdTimeline.events?.some((e: any) => e.imageUrl) || false}`);
        
        if (createdTimeline.events && createdTimeline.events.length > 5) {
          console.log('\n✅ Test passed! Timeline has sufficient events.');
          console.log('🚀 Starting full batch seeding...\n');
          
          // Start full seeding
          const { spawn } = await import('child_process');
          const seedScript = spawn('npx', ['tsx', 'scripts/seed-30-timelines.ts'], {
            cwd: process.cwd(),
            stdio: 'inherit',
            env: { ...process.env, PRODUCTION_URL: apiUrl }
          });
          
          seedScript.on('close', (code) => {
            process.exit(code || 0);
          });
        } else {
          console.log('\n⚠️  Timeline created but has insufficient events. Not starting batch seeding.');
          process.exit(1);
        }
      } else {
        console.log('❌ Timeline not found in database. Test failed.');
        process.exit(1);
      }
    } else {
      console.log('⚠️  Could not verify timeline creation.');
      process.exit(1);
    }
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testSingleTimeline();

