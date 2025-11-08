/**
 * STEP 3: Generate images for existing timelines
 * This is the most expensive step - only run after steps 1 & 2 succeed
 * Run with: npx tsx scripts/step3-generate-images.ts
 */

const CONCURRENCY_LIMIT = 3; // Process 3 timelines at once (careful with Replicate rate limits)

async function generateImagesForTimelines() {
  try {
    const apiUrl = process.env.PRODUCTION_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    console.log(`\n🎯 STEP 3: Generate Images for Timelines`);
    console.log(`🌐 Using API URL: ${apiUrl}\n`);
    
    // Fetch all timelines without images
    const timelinesResponse = await fetch(`${apiUrl}/api/timelines?limit=100`);
    const allTimelines = await timelinesResponse.json();
    
    // Filter for timelines that need images
    const timelinesNeedingImages = allTimelines.filter((t: any) => {
      const hasEvents = t.events && t.events.length > 0;
      const hasImages = t.events && t.events.some((e: any) => e.imageUrl);
      return hasEvents && !hasImages;
    });
    
    console.log(`📋 Found ${timelinesNeedingImages.length} timelines needing images (out of ${allTimelines.length} total)`);
    
    if (timelinesNeedingImages.length === 0) {
      console.log('\n✅ All timelines already have images!');
      return;
    }
    
    let generated = 0;
    let failed = 0;
    
    // Process in batches with concurrency limit
    for (let i = 0; i < timelinesNeedingImages.length; i += CONCURRENCY_LIMIT) {
      const batch = timelinesNeedingImages.slice(i, i + CONCURRENCY_LIMIT);
      console.log(`\n📦 Processing batch ${Math.floor(i / CONCURRENCY_LIMIT) + 1} (${batch.length} timelines)\n`);
      
      await Promise.all(batch.map(async (timeline: any) => {
        console.log(`   🖼️  Generating images for: ${timeline.title}`);
        
        try {
          // Fetch events for this timeline
          const eventsResponse = await fetch(`${apiUrl}/api/timelines/${timeline.id}/events`);
          const events = await eventsResponse.json();
          
          if (!events || events.length === 0) {
            console.log(`      ⏭️  Skipping (no events)`);
            return;
          }
          
          console.log(`      📸 Generating ${events.length} images...`);
          
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
              imageStyle: 'illustration', // Use cheap model for batch generation
              themeColor: '#3B82F6',
              imageReferences: [],
            }),
          });
          
          if (!imageResponse.ok) {
            throw new Error(`Image generation failed: ${await imageResponse.text()}`);
          }
          
          const { images } = await imageResponse.json();
          
          if (!images || images.length === 0) {
            throw new Error('No images were generated');
          }
          
          console.log(`      💾 Saving ${images.length} images to events...`);
          
          // Update each event with its image
          for (let j = 0; j < Math.min(images.length, events.length); j++) {
            if (images[j]) {
              await fetch(`${apiUrl}/api/events/${events[j].id}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  image_url: images[j],
                }),
              });
            }
          }
          
          console.log(`      ✅ Complete!`);
          generated++;
          
        } catch (error: any) {
          console.log(`      ❌ Failed: ${error.message}`);
          failed++;
        }
      }));
      
      // Delay between batches to avoid overwhelming Replicate
      if (i + CONCURRENCY_LIMIT < timelinesNeedingImages.length) {
        console.log('\n⏳ Waiting 10 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    
    console.log('\n📊 Step 3 Results:');
    console.log(`   Timelines with images: ${generated}`);
    console.log(`   Timelines failed: ${failed}`);
    
    console.log('\n✨ Step 3 complete! All timelines now have images.');
    
  } catch (error: any) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  }
}

generateImagesForTimelines();

