const apiUrl = process.env.PRODUCTION_URL || 'http://localhost:3000';

async function checkTimelines() {
  try {
    const response = await fetch(`${apiUrl}/api/timelines?limit=50`);
    const data = await response.json();
    
    console.log(`Total timelines: ${data.length}`);
    
    if (data.length > 0) {
      console.log('\nTimelines found:');
      data.forEach((t: any, i: number) => {
        const eventsCount = t.events?.length || 0;
        const hasImages = t.events?.some((e: any) => e.imageUrl) || false;
        const hasDescriptions = t.events?.some((e: any) => e.description) || false;
        console.log(`${i+1}. ${t.title}`);
        console.log(`   - Events: ${eventsCount}`);
        console.log(`   - Has images: ${hasImages}`);
        console.log(`   - Has descriptions: ${hasDescriptions}`);
        console.log(`   - Creator: ${t.creator?.username || 'unknown'}`);
      });
    } else {
      console.log('No timelines found.');
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

checkTimelines();

