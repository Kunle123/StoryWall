/**
 * Script to clear timelines that have incomplete events (missing descriptions or images)
 * Run with: npx tsx scripts/clear-incomplete-timelines.ts
 * 
 * To test with a single timeline:
 * TEST_SINGLE=true npx tsx scripts/clear-incomplete-timelines.ts
 */

const TEST_SINGLE = process.env.TEST_SINGLE === 'true';

async function clearIncompleteTimelines() {
  try {
    // Get the API URL
    const apiUrl = process.env.PRODUCTION_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    console.log(`🌐 Using API URL: ${apiUrl}`);
    console.log('🔍 Fetching timelines...\n');
    
    // Fetch all public timelines
    const timelinesResponse = await fetch(`${apiUrl}/api/timelines?is_public=true&limit=100`);
    if (!timelinesResponse.ok) {
      throw new Error(`Failed to fetch timelines: ${timelinesResponse.statusText}`);
    }
    
    const timelines = await timelinesResponse.json();
    console.log(`📋 Found ${timelines.length} timelines\n`);
    
    // Filter timelines with incomplete events
    const incompleteTimelines = timelines.filter((timeline: any) => {
      if (!timeline.events || timeline.events.length === 0) {
        return true; // No events at all
      }
      
      // Consider timelines with very few events (< 5) as incomplete
      // Most timelines should have 20+ events
      if (timeline.events.length < 5) {
        return true;
      }
      
      // Check if events are missing descriptions or images
      const hasDescriptions = timeline.events.some((e: any) => e.description);
      const hasImages = timeline.events.some((e: any) => e.image_url);
      
      return !hasDescriptions || !hasImages;
    });
    
    if (TEST_SINGLE && incompleteTimelines.length > 0) {
      console.log(`🧪 TEST MODE: Will clear only the first incomplete timeline\n`);
      incompleteTimelines.splice(1);
    }
    
    console.log(`🗑️  Found ${incompleteTimelines.length} timelines with incomplete events\n`);
    
    if (incompleteTimelines.length === 0) {
      console.log('✅ No incomplete timelines to clear!');
      return;
    }
    
    // Use admin endpoint to delete incomplete timelines
    console.log(`🗑️  Deleting ${incompleteTimelines.length} incomplete timeline(s)...\n`);
    
    const timelineIds = incompleteTimelines.map(t => t.id);
    
    const deleteResponse = await fetch(`${apiUrl}/api/admin/timelines/delete-incomplete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timelineIds: TEST_SINGLE ? [timelineIds[0]] : timelineIds,
      }),
    });
    
    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text();
      throw new Error(`Failed to delete timelines: ${errorText}`);
    }
    
    const result = await deleteResponse.json();
    
    console.log('\n📊 Summary:');
    console.log(`   Timelines checked: ${result.results.totalChecked}`);
    console.log(`   Incomplete found: ${result.results.incompleteFound}`);
    console.log(`   Timelines deleted: ${result.results.deleted}`);
    console.log(`   Failed: ${result.results.failed}`);
    
    if (result.results.errors && result.results.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      result.results.errors.forEach((error: string, index: number) => {
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
clearIncompleteTimelines();

