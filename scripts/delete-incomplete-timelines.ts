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
      body: JSON.stringify({}),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete timelines: ${errorText}`);
    }
    
    const result = await response.json();
    
    console.log('✅ Deletion complete!');
    console.log(`   Timelines checked: ${result.results?.totalChecked || 0}`);
    console.log(`   Incomplete found: ${result.results?.incompleteFound || 0}`);
    console.log(`   Timelines deleted: ${result.results?.deleted || 0}`);
    console.log(`   Failed: ${result.results?.failed || 0}`);
    
    if (result.results?.errors && result.results.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      result.results.errors.forEach((error: string) => {
        console.log(`   - ${error}`);
      });
    }
    
  } catch (error: any) {
    console.error('❌ Failed to delete timelines:', error.message);
    process.exit(1);
  }
}

// Run the function
deleteIncompleteTimelines();

