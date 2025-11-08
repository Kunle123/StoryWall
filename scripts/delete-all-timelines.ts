/**
 * Script to delete ALL timelines (use with caution!)
 * Run with: npx tsx scripts/delete-all-timelines.ts
 */

async function deleteAllTimelines() {
  try {
    const apiUrl = process.env.PRODUCTION_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    console.log(`🌐 Using API URL: ${apiUrl}`);
    console.log('⚠️  WARNING: Deleting ALL timelines...\n');
    
    // Fetch all timelines
    const timelinesResponse = await fetch(`${apiUrl}/api/timelines?limit=100`);
    const timelines = await timelinesResponse.json();
    
    console.log(`📋 Found ${timelines.length} timelines to delete\n`);
    
    let deleted = 0;
    let failed = 0;
    
    for (const timeline of timelines) {
      try {
        console.log(`   🗑️  Deleting: ${timeline.title}`);
        
        const deleteResponse = await fetch(`${apiUrl}/api/admin/timelines/delete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ timelineIds: [timeline.id] }),
        });
        
        if (!deleteResponse.ok) {
          throw new Error(`Failed to delete: ${await deleteResponse.text()}`);
        }
        
        deleted++;
        
      } catch (error: any) {
        console.log(`      ❌ Failed: ${error.message}`);
        failed++;
      }
    }
    
    console.log(`\n✅ Deletion complete!`);
    console.log(`   Deleted: ${deleted}`);
    console.log(`   Failed: ${failed}`);
    
  } catch (error: any) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  }
}

deleteAllTimelines();

