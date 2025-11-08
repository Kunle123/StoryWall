/**
 * Script to delete specific timelines by ID
 */

const timelineIds = [
  'a2f102ad-cfe9-4bdf-8531-15e519126b5b',
  'e982672c-dad6-4da7-8993-0540a82b5b7f',
  'd25ebd68-bc92-4cba-bfc2-9acd1f58971c',
  'f1103fbc-1e05-4c79-9d8e-4496aac74cc8'
];

async function deleteTimelines() {
  const apiUrl = process.env.PRODUCTION_URL || 'http://localhost:3000';
  
  console.log(`🗑️  Deleting ${timelineIds.length} timelines...\n`);
  
  for (const id of timelineIds) {
    try {
      // First, get timeline details to check event count
      const getResponse = await fetch(`${apiUrl}/api/timelines/${id}`);
      if (getResponse.ok) {
        const timeline = await getResponse.json();
        console.log(`   Checking: ${timeline.title} (${timeline.events?.length || 0} events)`);
      }
      
      // Delete via admin endpoint (force delete by passing as incomplete)
      const deleteResponse = await fetch(`${apiUrl}/api/admin/timelines/delete-incomplete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timelineIds: [id] })
      });
      
      if (deleteResponse.ok) {
        const result = await deleteResponse.json();
        if (result.results.deleted > 0) {
          console.log(`   ✅ Deleted: ${id}`);
        } else {
          console.log(`   ⚠️  Not deleted (may not be marked incomplete): ${id}`);
        }
      } else {
        console.log(`   ❌ Failed: ${id} - ${deleteResponse.statusText}`);
      }
    } catch (error: any) {
      console.log(`   ❌ Error deleting ${id}: ${error.message}`);
    }
  }
  
  console.log('\n✅ Done!');
}

deleteTimelines();

