#!/usr/bin/env ts-node

/**
 * Test script for timeline generation
 * Usage: npx ts-node scripts/test-timeline-generation.ts
 */

const testQuery = {
  timelineName: "Alan Carr's Time in The Traitors House",
  timelineDescription: "Alan Carr's time in the Traitors house",
  maxEvents: 20,
  isFactual: true,
};

async function testTimelineGeneration() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  console.log('Testing timeline generation...');
  console.log('Query:', testQuery);
  console.log(`\nSending request to ${appUrl}/api/ai/generate-events\n`);

  try {
    const startTime = Date.now();
    
    const response = await fetch(`${appUrl}/api/ai/generate-events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testQuery),
    });

    const duration = Date.now() - startTime;
    console.log(`Response received in ${duration}ms`);
    console.log(`Status: ${response.status} ${response.statusText}\n`);

    const responseText = await response.text();
    let data;
    
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse JSON response:');
      console.error(responseText.substring(0, 1000));
      return;
    }

    if (data.error) {
      console.error('❌ Error:', data.error);
      if (data.details) {
        console.error('Details:', data.details);
      }
      if (data.debug) {
        console.error('Debug info:', JSON.stringify(data.debug, null, 2));
      }
      return;
    }

    if (data.events && Array.isArray(data.events)) {
      console.log(`✅ Success! Generated ${data.events.length} events:\n`);
      
      data.events.forEach((event: any, index: number) => {
        const date = event.year 
          ? `${event.year}${event.month ? `-${String(event.month).padStart(2, '0')}` : ''}${event.day ? `-${String(event.day).padStart(2, '0')}` : ''}`
          : 'Date unknown';
        console.log(`${index + 1}. [${date}] ${event.title}`);
      });

      if (data.sources && data.sources.length > 0) {
        console.log(`\n📰 Sources (${data.sources.length}):`);
        data.sources.forEach((source: any) => {
          console.log(`   - ${source.name || 'Unknown'}: ${source.url}`);
        });
      }

      if (data.imageReferences && data.imageReferences.length > 0) {
        console.log(`\n🖼️  Image References (${data.imageReferences.length}):`);
        data.imageReferences.forEach((ref: any) => {
          console.log(`   - ${ref.name || 'Unknown'}: ${ref.url}`);
        });
      }
    } else {
      console.error('❌ Unexpected response format:');
      console.error(JSON.stringify(data, null, 2));
    }
  } catch (error: any) {
    console.error('❌ Request failed:', error.message);
    console.error(error.stack);
  }
}

testTimelineGeneration();

