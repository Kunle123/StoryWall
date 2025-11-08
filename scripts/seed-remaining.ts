/**
 * Seed remaining timelines one at a time, skipping those that already exist
 */

import fs from 'fs';
import path from 'path';

const SEED_FILE = path.join(process.cwd(), 'data', 'seed-30-timelines.json');

async function seedRemaining() {
  try {
    const seedDataArray = JSON.parse(fs.readFileSync(SEED_FILE, 'utf-8'));
    const apiUrl = process.env.PRODUCTION_URL || 'http://localhost:3000';
    
    const allTimelines = seedDataArray[0]?.timelines || [];
    const user = seedDataArray[0]?.user;
    
    console.log(`🌱 Seeding remaining timelines (one at a time)`);
    console.log(`🌐 Using API URL: ${apiUrl}\n`);
    
    // Get existing timelines
    const existingResponse = await fetch(`${apiUrl}/api/timelines?limit=50`);
    const existing = await existingResponse.json();
    const existingTitles = new Set(existing.map((t: any) => t.title));
    
    console.log(`📋 Found ${existing.length} existing timelines`);
    console.log(`📝 Total timelines to seed: ${allTimelines.length}\n`);
    
    let created = 0;
    let skipped = 0;
    let failed = 0;
    
    for (let i = 0; i < allTimelines.length; i++) {
      const timeline = allTimelines[i];
      
      // Skip if already exists
      if (existingTitles.has(timeline.title)) {
        console.log(`⏭️  [${i+1}/${allTimelines.length}] Skipping: ${timeline.title} (already exists)`);
        skipped++;
        continue;
      }
      
      console.log(`\n🔨 [${i+1}/${allTimelines.length}] Creating: ${timeline.title}`);
      
      try {
        const response = await fetch(`${apiUrl}/api/admin/seed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify([{ user, timelines: [timeline] }])
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        console.log(`   ✅ Created: ${result.summary?.eventsGenerated || 0} events, ${result.summary?.imagesGenerated || 0} images`);
        created++;
        
      } catch (error: any) {
        console.log(`   ❌ Failed: ${error.message}`);
        failed++;
      }
      
      // Small delay between timelines
      if (i < allTimelines.length - 1) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    
    console.log(`\n📊 Final Results:`);
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Failed: ${failed}`);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedRemaining();

