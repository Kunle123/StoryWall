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
    
    // Extract second timeline (Taylor Swift - safer than political figures)
    const firstTimeline = seedDataArray[0]?.timelines?.[2];
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
    
    const summary = result.summary;
    const createdTimelineIds = result.createdTimelineIds || [];
    
    console.log('📊 Test Results:');
    console.log(`   Timeline created: ${summary?.timelinesCreated > 0 ? '✅' : '❌'}`);
    console.log(`   Events generated: ${summary?.eventsGenerated || 0}`);
    console.log(`   Images generated: ${summary?.imagesGenerated || 0}`);
    
    if (summary?.errors && summary.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      summary.errors.forEach((error: string) => {
        console.log(`   - ${error}`);
      });
    }
    
    // Verify using the returned timeline ID (not by searching by title)
    if (createdTimelineIds.length > 0) {
      const timelineId = createdTimelineIds[0];
      console.log(`\n🔍 Verifying timeline ${timelineId}...`);
      
      const timelineResponse = await fetch(`${apiUrl}/api/timelines/${timelineId}`);
      if (timelineResponse.ok) {
        const timeline = await timelineResponse.json();
        
        // Fetch events for this timeline
        const eventsResponse = await fetch(`${apiUrl}/api/timelines/${timelineId}/events`);
        const events = eventsResponse.ok ? await eventsResponse.json() : [];
        
        console.log(`✅ Timeline found: "${timeline.title}"`);
        console.log(`   ID: ${timelineId}`);
        console.log(`   Events: ${events.length}`);
        console.log(`   Has images: ${events.some((e: any) => e.imageUrl)}`);
        
        if (events.length > 5) {
          console.log('\n✅ Test passed! Timeline has sufficient events.');
          console.log('🚀 Ready to proceed with full batch seeding.');
          process.exit(0);
        } else {
          console.log('\n⚠️  Timeline created but has insufficient events.');
          process.exit(1);
        }
      } else {
        console.log('❌ Timeline not found in database. Test failed.');
        process.exit(1);
      }
    } else {
      console.log('❌ No timeline ID returned from API.');
      process.exit(1);
    }
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testSingleTimeline();

