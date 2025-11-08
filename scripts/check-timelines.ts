const apiUrl = process.env.PRODUCTION_URL || 'http://localhost:3000';

async function checkTimelines() {
  try {
    const response = await fetch(`${apiUrl}/api/timelines?limit=50`);
    const data = await response.json();
    
    console.log(`Total timelines: ${data.length}`);
    
    if (data.length > 0) {
      console.log('\nTimelines found:');
      
      // Fetch full event list for each timeline
      for (let i = 0; i < data.length; i++) {
        const t = data[i];
        
        // Fetch all events for this timeline
        const eventsResponse = await fetch(`${apiUrl}/api/timelines/${t.id}/events`);
        const events = await eventsResponse.json();
        
        const eventsCount = events.length;
        const hasImages = events.filter((e: any) => e.imageUrl).length;
        const hasDescriptions = events.some((e: any) => e.description);
        
        console.log(`${i+1}. ${t.title}`);
        console.log(`   - Events: ${eventsCount}`);
        console.log(`   - Has images: ${hasImages}/${eventsCount}`);
        console.log(`   - Has descriptions: ${hasDescriptions}`);
        console.log(`   - Creator: ${t.creator?.username || 'unknown'}`);
      }
    } else {
      console.log('No timelines found.');
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

checkTimelines();

