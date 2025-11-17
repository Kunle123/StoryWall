/**
 * Script to check production database status
 * Run with: npx tsx scripts/check-production-db.ts
 */

const PRODUCTION_URL = 'https://www.storywall.com';

async function checkProductionDatabase() {
  console.log('🔍 Checking production database...\n');

  try {
    // Check timelines endpoint
    console.log('1. Checking timelines API...');
    const timelinesResponse = await fetch(`${PRODUCTION_URL}/api/timelines?limit=100`);
    const timelines = await timelinesResponse.json();
    console.log(`   ✅ Found ${timelines.length} timelines`);

    if (timelines.length === 0) {
      console.log('\n⚠️  No timelines found in production!');
      console.log('\nPossible causes:');
      console.log('  1. Database is empty');
      console.log('  2. Database connection issue');
      console.log('  3. Schema mismatch');
      console.log('\nNext steps:');
      console.log('  1. Check Railway logs for database errors');
      console.log('  2. Verify DATABASE_URL in Railway variables');
      console.log('  3. Check if database was reset');
      console.log('  4. Consider seeding the database');
    } else {
      console.log('\n✅ Database has content!');
      console.log('\nSample timelines:');
      timelines.slice(0, 5).forEach((t: any, i: number) => {
        console.log(`   ${i + 1}. ${t.title} (${t.id})`);
      });
    }

    // Check events
    if (timelines.length > 0) {
      console.log('\n2. Checking events for first timeline...');
      const firstTimeline = timelines[0];
      const eventsResponse = await fetch(`${PRODUCTION_URL}/api/timelines/${firstTimeline.id}/events`);
      const events = await eventsResponse.json();
      console.log(`   ✅ Found ${events.length} events`);
    }

    // Check users
    console.log('\n3. Checking users...');
    try {
      const usersResponse = await fetch(`${PRODUCTION_URL}/api/user/profile`);
      if (usersResponse.ok) {
        console.log('   ✅ User API is working');
      } else {
        console.log('   ⚠️  User API returned:', usersResponse.status);
      }
    } catch (e) {
      console.log('   ⚠️  Could not check users:', (e as Error).message);
    }

  } catch (error: any) {
    console.error('\n❌ Error checking production:', error.message);
    console.error('\nThis could indicate:');
    console.error('  1. Production site is down');
    console.error('  2. Database connection issue');
    console.error('  3. API endpoint error');
  }
}

checkProductionDatabase();

