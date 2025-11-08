/**
 * Test step 2 (enhance descriptions) with a single timeline
 */

async function testStep2Single() {
  try {
    const apiUrl = process.env.PRODUCTION_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    console.log(`\n🎯 Testing STEP 2: Enhance Descriptions (Single Timeline)`);
    console.log(`🌐 Using API URL: ${apiUrl}\n`);
    
    // Fetch all timelines
    const timelinesResponse = await fetch(`${apiUrl}/api/timelines?limit=10`);
    const timelines = await timelinesResponse.json();
    
    if (timelines.length === 0) {
      console.log('❌ No timelines found. Run step 1 first.');
      process.exit(1);
    }
    
    const timeline = timelines[0];
    console.log(`📝 Enhancing: ${timeline.title}`);
    console.log(`   ID: ${timeline.id}\n`);
    
    // Fetch events
    const eventsResponse = await fetch(`${apiUrl}/api/timelines/${timeline.id}/events`);
    const events = await eventsResponse.json();
    
    console.log(`   Events found: ${events.length}`);
    
    if (events.length === 0) {
      console.log('❌ No events found.');
      process.exit(1);
    }
    
    console.log(`   🔧 Calling description enhancement API...`);
    
    // Call description enhancement
    const enhanceResponse = await fetch(`${apiUrl}/api/ai/generate-descriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        events: events.map((e: any) => ({
          year: e.year,
          title: e.title,
        })),
        timelineDescription: timeline.description,
        writingStyle: 'narrative',
        imageStyle: timeline.imageStyle || 'illustration',
        themeColor: timeline.themeColor || '#3B82F6',
      }),
    });
    
    if (!enhanceResponse.ok) {
      const errorText = await enhanceResponse.text();
      console.log(`❌ Enhancement failed: ${errorText}`);
      process.exit(1);
    }
    
    const { descriptions, imagePrompts } = await enhanceResponse.json();
    
    console.log(`   ✅ Received ${descriptions?.length || 0} descriptions and ${imagePrompts?.length || 0} image prompts`);
    
    // Update first event as a test
    if (descriptions && descriptions[0] && events[0]) {
      console.log(`\n   📝 Updating first event with enhanced description...`);
      
      const updateResponse = await fetch(`${apiUrl}/api/events/${events[0].id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: descriptions[0],
        }),
      });
      
      if (updateResponse.ok) {
        console.log(`   ✅ Successfully updated event description`);
      } else {
        console.log(`   ⚠️  Failed to update event: ${await updateResponse.text()}`);
      }
    }
    
    console.log(`\n✅ Step 2 test passed!`);
    console.log(`🚀 Ready to proceed with full step 2 batch.`);
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testStep2Single();

