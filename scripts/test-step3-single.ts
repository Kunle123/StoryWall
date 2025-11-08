/**
 * Test step 3 (generate images) with a single timeline
 */

async function testStep3Single() {
  try {
    const apiUrl = process.env.PRODUCTION_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    console.log(`\n🎯 Testing STEP 3: Generate Images (Single Timeline)`);
    console.log(`🌐 Using API URL: ${apiUrl}\n`);
    
    // Fetch all timelines
    const timelinesResponse = await fetch(`${apiUrl}/api/timelines?limit=10`);
    const timelines = await timelinesResponse.json();
    
    if (timelines.length === 0) {
      console.log('❌ No timelines found. Run step 1 first.');
      process.exit(1);
    }
    
    const timeline = timelines[0];
    console.log(`🖼️  Generating images for: ${timeline.title}`);
    console.log(`   ID: ${timeline.id}`);
    console.log(`   Image Style: ${timeline.imageStyle || 'illustration'}`);
    console.log(`   Theme Color: ${timeline.themeColor || '#3B82F6'}\n`);
    
    // Fetch events
    const eventsResponse = await fetch(`${apiUrl}/api/timelines/${timeline.id}/events`);
    const events = await eventsResponse.json();
    
    console.log(`   Events found: ${events.length}`);
    
    if (events.length === 0) {
      console.log('❌ No events found.');
      process.exit(1);
    }
    
    console.log(`   🎨 Calling image generation API...`);
    
    // Generate images
    const imageResponse = await fetch(`${apiUrl}/api/ai/generate-images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        events: events.map((e: any) => ({
          title: e.title,
          description: e.description || '',
          year: e.year,
          imagePrompt: e.imagePrompt || '',
        })),
        imageStyle: timeline.imageStyle || 'illustration',
        themeColor: timeline.themeColor || '#3B82F6',
        imageReferences: [],
      }),
    });
    
    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.log(`❌ Image generation failed: ${errorText}`);
      process.exit(1);
    }
    
    const { images } = await imageResponse.json();
    
    console.log(`   ✅ Generated ${images?.length || 0} images`);
    
    // Update first event with image as a test
    if (images && images[0] && events[0]) {
      console.log(`\n   📸 Updating first event with image...`);
      
      const updateResponse = await fetch(`${apiUrl}/api/events/${events[0].id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: images[0],
        }),
      });
      
      if (updateResponse.ok) {
        console.log(`   ✅ Successfully saved image to event`);
        console.log(`   🔗 Image URL: ${images[0].substring(0, 60)}...`);
      } else {
        console.log(`   ⚠️  Failed to save image: ${await updateResponse.text()}`);
      }
    }
    
    console.log(`\n✅ Step 3 test passed!`);
    console.log(`🚀 Ready to proceed with full step 3 batch.`);
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testStep3Single();

