import { prisma } from '../lib/db/prisma';
import { listTimelines } from '../lib/db/timelines';

async function checkTimeline() {
  try {
    const timelines = await listTimelines({ limit: 100 });
    const timeline = timelines.find(t => 
      t.title?.toLowerCase().includes('north america') ||
      t.title?.toLowerCase().includes('history of north')
    );
    
    if (!timeline) {
      console.log('Timeline "A History of North America" not found');
      console.log('Available timelines:');
      timelines.slice(0, 10).forEach(t => console.log(`  - ${t.title}`));
      return;
    }
    
    console.log('\n=== Timeline Found ===');
    console.log('Title:', timeline.title);
    console.log('ID:', timeline.id);
    console.log('Events count:', timeline.events?.length || 0);
    
    if (timeline.events && timeline.events.length > 0) {
      console.log('\n=== Events (first 15) ===');
      timeline.events.slice(0, 15).forEach((e: any, i: number) => {
        console.log(`\n${i + 1}. ${e.title}`);
        console.log(`   Raw date string: ${e.date}`);
        console.log(`   Year: ${e.year || 'N/A'}`);
        console.log(`   Month: ${e.month || 'N/A'}`);
        console.log(`   Day: ${e.day || 'N/A'}`);
        if (e.description) {
          console.log(`   Description: ${e.description.substring(0, 80)}...`);
        }
      });
      
      // Check for date issues
      console.log('\n=== Date Analysis ===');
      const dates = timeline.events.map((e: any) => ({
        title: e.title,
        dateStr: e.date,
        year: e.year,
        month: e.month,
        day: e.day,
      }));
      
      // Check for BC dates
      const bcDates = dates.filter(d => d.year && d.year < 0);
      const adDates = dates.filter(d => d.year && d.year > 0);
      console.log(`BC dates: ${bcDates.length}`);
      console.log(`AD dates: ${adDates.length}`);
      
      // Check sorting
      const years = dates.map(d => d.year).filter(y => y !== undefined && y !== null);
      const sortedYears = [...years].sort((a, b) => a - b);
      const isSorted = JSON.stringify(years) === JSON.stringify(sortedYears);
      console.log(`Is sorted correctly: ${isSorted}`);
      
      if (!isSorted) {
        console.log('\n⚠️  Dates are NOT in chronological order!');
        console.log('First 10 years:', years.slice(0, 10));
        console.log('Should be:', sortedYears.slice(0, 10));
      }
    }
  } catch (error: any) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkTimeline();

