/**
 * STEP 2: Enhance descriptions for existing timelines
 * Adds better descriptions and image prompts to events
 * Run with: npx tsx scripts/step2-enhance-descriptions.ts
 */

async function enhanceDescriptions() {
  try {
    const apiUrl = process.env.PRODUCTION_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    console.log(`\n🎯 STEP 2: Enhance Event Descriptions`);
    console.log(`🌐 Using API URL: ${apiUrl}\n`);
    
    // Fetch all timelines
    const timelinesResponse = await fetch(`${apiUrl}/api/timelines?limit=100`);
    const timelines = await timelinesResponse.json();
    
    console.log(`📋 Found ${timelines.length} timelines to enhance`);
    
    let enhanced = 0;
    let failed = 0;
    
    for (let i = 0; i < timelines.length; i++) {
      const timeline = timelines[i];
      
      console.log(`\n[${i + 1}/${timelines.length}] Enhancing: ${timeline.title}`);
      
      try {
        // Fetch events for this timeline
        const eventsResponse = await fetch(`${apiUrl}/api/timelines/${timeline.id}/events`);
        const events = await eventsResponse.json();
        
        if (!events || events.length === 0) {
          console.log(`   ⏭️  Skipping (no events)`);
          continue;
        }
        
        console.log(`   📝 Enhancing ${events.length} events...`);
        
        // Call description enhancement API
        const enhanceResponse = await fetch(`${apiUrl}/api/ai/generate-descriptions-v2`, {
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
            imageStyle: timeline.imageStyle || 'photorealistic',
            themeColor: '#3B82F6',
          }),
        });
        
        if (!enhanceResponse.ok) {
          throw new Error(`Enhancement failed: ${await enhanceResponse.text()}`);
        }
        
        const { descriptions, imagePrompts } = await enhanceResponse.json();
        
        // Update each event with enhanced description
        for (let j = 0; j < events.length; j++) {
          if (descriptions[j]) {
            await fetch(`${apiUrl}/api/events/${events[j].id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                description: descriptions[j],
              }),
            });
          }
        }
        
        console.log(`   ✅ Enhanced ${events.length} events`);
        enhanced++;
        
        // Small delay to avoid overwhelming API
        if (i < timelines.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error: any) {
        console.log(`   ❌ Failed: ${error.message}`);
        failed++;
      }
    }
    
    console.log('\n📊 Step 2 Results:');
    console.log(`   Timelines enhanced: ${enhanced}`);
    console.log(`   Timelines failed: ${failed}`);
    
    console.log('\n✨ Step 2 complete! Run step3-generate-images.ts next.');
    
  } catch (error: any) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  }
}

enhanceDescriptions();

