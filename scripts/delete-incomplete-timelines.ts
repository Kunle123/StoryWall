/**
 * Script to delete incomplete timelines (timelines with < 5 events or missing descriptions/images)
 * Run with: npx tsx scripts/delete-incomplete-timelines.ts
 */

async function deleteIncompleteTimelines() {
  try {
    // Get the API URL - allow override via PRODUCTION_URL env var
    const apiUrl = process.env.PRODUCTION_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    console.log(`🌐 Using API URL: ${apiUrl}`);
    console.log('🗑️  Deleting incomplete timelines...\n');
    
    const response = await fetch(`${apiUrl}/api/admin/timelines/delete-incomplete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete timelines: ${errorText}`);
    }
    
    const result = await response.json();
    
    console.log('✅ Deletion complete!');
    console.log(`   Timelines found: ${result.found}`);
    console.log(`   Timelines deleted: ${result.deleted}`);
    
    if (result.deletedIds && result.deletedIds.length > 0) {
      console.log('\n📋 Deleted timeline IDs:');
      result.deletedIds.forEach((id: string) => {
        console.log(`   - ${id}`);
      });
    }
    
  } catch (error: any) {
    console.error('❌ Failed to delete timelines:', error.message);
    process.exit(1);
  }
}

// Run the function
deleteIncompleteTimelines();

