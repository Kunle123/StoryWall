/**
 * Script to generate events and images for existing timelines that don't have events
 * Run with: npx tsx scripts/generate-events-for-existing-timelines.ts
 * 
 * To test with a single timeline:
 * TEST_SINGLE=true npx tsx scripts/generate-events-for-existing-timelines.ts
 */

import fs from 'fs';
import path from 'path';

const SEED_FILE = path.join(process.cwd(), 'data', 'seed-30-timelines.json');
const TEST_SINGLE = process.env.TEST_SINGLE === 'true';

async function generateEventsForTimelines() {
  try {
    // Read the seed data file to get timeline descriptions
    const seedData = JSON.parse(fs.readFileSync(SEED_FILE, 'utf-8'));
    const timelineMap = new Map<string, any>();
    
    // Create a map of timeline titles to their data
    seedData[0].timelines.forEach((tl: any) => {
      timelineMap.set(tl.title, tl);
    });
    
    // Get the API URL
    const apiUrl = process.env.PRODUCTION_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    console.log(`🌐 Using API URL: ${apiUrl}`);
    console.log('🔍 Fetching existing timelines...\n');
    
    // Fetch all public timelines
    const timelinesResponse = await fetch(`${apiUrl}/api/timelines?is_public=true&limit=100`);
    if (!timelinesResponse.ok) {
      throw new Error(`Failed to fetch timelines: ${timelinesResponse.statusText}`);
    }
    
    const timelines = await timelinesResponse.json();
    console.log(`📋 Found ${timelines.length} timelines\n`);
    
    let processed = 0;
    let eventsGenerated = 0;
    let imagesGenerated = 0;
    let errors: string[] = [];
    
    // Process timelines concurrently with a concurrency limit
    const CONCURRENCY_LIMIT = TEST_SINGLE ? 1 : 10; // Process 10 timelines at once (or 1 for testing)
    const timelinesToProcess = timelines.filter(timeline => {
      // Check if timeline needs events or if events are missing descriptions/images
      if (timeline.events && timeline.events.length > 0) {
        // Check if events have descriptions and images
        const hasDescriptions = timeline.events.some((e: any) => e.description);
        const hasImages = timeline.events.some((e: any) => e.image_url);
        
        if (hasDescriptions && hasImages) {
          console.log(`⏭️  Skipping "${timeline.title}" - already has ${timeline.events.length} complete events`);
          return false;
        } else {
          console.log(`🔄 "${timeline.title}" has events but missing ${!hasDescriptions ? 'descriptions' : ''}${!hasDescriptions && !hasImages ? ' and ' : ''}${!hasImages ? 'images' : ''} - will regenerate`);
        }
      }
      return true;
    });
    
    // If testing, only process the first timeline
    if (TEST_SINGLE && timelinesToProcess.length > 0) {
      console.log(`🧪 TEST MODE: Processing only the first timeline\n`);
      timelinesToProcess.splice(1); // Keep only the first one
    }
    
    // Process in batches
    const totalBatches = Math.ceil(timelinesToProcess.length / CONCURRENCY_LIMIT);
    for (let i = 0; i < timelinesToProcess.length; i += CONCURRENCY_LIMIT) {
      const batch = timelinesToProcess.slice(i, i + CONCURRENCY_LIMIT);
      console.log(`\n📦 Processing batch ${Math.floor(i / CONCURRENCY_LIMIT) + 1} of ${totalBatches} (${batch.length} timeline${batch.length === 1 ? '' : 's'})\n`);
      
      await Promise.all(batch.map(async (timeline) => {
        // Skip if timeline already has events (double-check in case filtering missed it)
        if (timeline.events && timeline.events.length > 0) {
          console.log(`⏭️  Skipping "${timeline.title}" - already has ${timeline.events.length} events`);
          return;
        }
      
        // Find matching seed data
        const seedData = timelineMap.get(timeline.title);
        if (!seedData) {
          console.log(`⚠️  No seed data found for "${timeline.title}"`);
          return;
        }
        
        console.log(`🔄 Processing: "${timeline.title}"`);
        processed++;
        
        try {
        // Check if we need to delete existing events first
        const existingEvents = timeline.events || [];
        const needsRegeneration = existingEvents.length === 0 || 
                                  !existingEvents.some((e: any) => e.description) ||
                                  !existingEvents.some((e: any) => e.image_url);
        
        if (needsRegeneration && existingEvents.length > 0) {
          console.log(`   🗑️  Deleting ${existingEvents.length} incomplete events...`);
          // Delete existing events
          for (const event of existingEvents) {
            try {
              await fetch(`${apiUrl}/api/events/${event.id}`, {
                method: 'DELETE',
              });
            } catch (e) {
              // Ignore deletion errors
            }
          }
        }
        
        // Step 1: Generate events
        console.log(`   📝 Generating events...`);
        const generateEventsResponse = await fetch(`${apiUrl}/api/ai/generate-events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            timelineName: timeline.title,
            timelineDescription: seedData.description,
            maxEvents: seedData.maxEvents || 20,
            isFactual: seedData.isFactual !== false,
          }),
        });
        
        if (!generateEventsResponse.ok) {
          const errorText = await generateEventsResponse.text();
          throw new Error(`Event generation failed: ${errorText}`);
        }
        
        const { events, imageReferences } = await generateEventsResponse.json();
        
        if (!events || events.length === 0) {
          throw new Error('No events were generated');
        }
        
        console.log(`   ✅ Generated ${events.length} events`);
        
        // Step 2: Save events to timeline
        console.log(`   💾 Saving events to timeline...`);
        for (const event of events) {
          const eventDate = new Date(
            event.year || 2020,
            (event.month || 1) - 1,
            event.day || 1
          );
          
          const createEventResponse = await fetch(`${apiUrl}/api/timelines/${timeline.id}/events`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: event.title,
              description: event.description || '',
              date: eventDate.toISOString().split('T')[0],
              year: event.year,
              month: event.month,
              day: event.day,
              number: event.number,
              number_label: event.numberLabel,
            }),
          });
          
          if (!createEventResponse.ok) {
            const errorText = await createEventResponse.text();
            console.warn(`   ⚠️  Failed to save event "${event.title}": ${errorText}`);
          }
        }
        
        // Step 3: Generate images if requested
        if (seedData.generateImages && events.length > 0) {
          console.log(`   🎨 Generating images...`);
          const generateImagesResponse = await fetch(`${apiUrl}/api/ai/generate-images`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              timelineId: timeline.id,
              events: events.map((e: any) => ({
                id: `temp_${Date.now()}_${Math.random()}`,
                title: e.title,
                description: e.description || '',
                year: e.year,
                month: e.month,
                day: e.day,
                number: e.number,
                imagePrompt: e.imagePrompt || '',
              })),
              imageStyle: seedData.imageStyle || 'photorealistic',
              imageReferences: imageReferences || [],
            }),
          });
          
          if (generateImagesResponse.ok) {
            const { images } = await generateImagesResponse.json();
            if (images && Array.isArray(images)) {
              console.log(`   ✅ Generated ${images.length} images`);
              
              // Step 4: Save images to events
              console.log(`   💾 Saving images to events...`);
              
              // Fetch the timeline events we just created
              const timelineEventsResponse = await fetch(`${apiUrl}/api/timelines/${timeline.id}/events`);
              if (timelineEventsResponse.ok) {
                const timelineEvents = await timelineEventsResponse.json();
                
                // Update each event with its corresponding image
                for (let i = 0; i < Math.min(images.length, timelineEvents.length); i++) {
                  if (images[i] && timelineEvents[i] && images[i] !== null) {
                    const updateEventResponse = await fetch(`${apiUrl}/api/events/${timelineEvents[i].id}`, {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        image_url: images[i],
                      }),
                    });
                    
                    if (!updateEventResponse.ok) {
                      const errorText = await updateEventResponse.text();
                      console.warn(`   ⚠️  Failed to save image for event "${timelineEvents[i].title}": ${errorText}`);
                    }
                  }
                }
                console.log(`   ✅ Saved ${Math.min(images.filter((img: any) => img !== null).length, timelineEvents.length)} images to events`);
              }
            }
          } else {
            const errorText = await generateImagesResponse.text();
            console.warn(`   ⚠️  Image generation failed: ${errorText}`);
          }
        }
        } catch (error: any) {
          const errorMsg = `Failed to process "${timeline.title}": ${error.message}`;
          console.error(`   ❌ ${errorMsg}`);
          errors.push(errorMsg);
        }
      }));
      
      // Small delay between batches to avoid overwhelming the API
      if (i + CONCURRENCY_LIMIT < timelinesToProcess.length) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between batches
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`   Timelines processed: ${processed}`);
    console.log(`   Events generated: ${eventsGenerated}`);
    console.log(`   Images generated: ${imagesGenerated}`);
    console.log(`   Errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n⚠️  Errors:');
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
  } catch (error: any) {
    console.error('❌ Failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the function
generateEventsForTimelines();

