import 'dotenv/config';

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const TEST_USER_ID = '4b499a69-c3f1-48ee-a938-305cce4c19e8';

let createdTimelineId: string | null = null;
let createdEventId: string | null = null;

async function testAPI(endpoint: string, options: RequestInit = {}) {
  try {
    const url = `${API_BASE}${endpoint}`;
    console.log(`\n📡 ${options.method || 'GET'} ${endpoint}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Success (${response.status})`);
      if (data.id) console.log(`   ID: ${data.id}`);
      return { success: true, data, status: response.status };
    } else {
      console.log(`❌ Error (${response.status}):`, data.error || data.message);
      return { success: false, data, status: response.status };
    }
  } catch (error: any) {
    console.log(`❌ Request failed:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Starting API Tests...\n');
  console.log('📍 Base URL:', API_BASE);
  console.log('👤 Test User ID:', TEST_USER_ID);

  // Test 1: List timelines (empty initially)
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 1: List Timelines (GET /api/timelines)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await testAPI('/api/timelines');

  // Test 2: Create timeline
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 2: Create Timeline (POST /api/timelines)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const createTimelineResult = await testAPI('/api/timelines', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Test Timeline - API Test',
      description: 'This timeline was created by the API test script',
      visualization_type: 'vertical',
      is_public: true,
      is_collaborative: false,
    }),
  });
  
  if (createTimelineResult.success && createTimelineResult.data?.id) {
    createdTimelineId = createTimelineResult.data.id;
    console.log(`   ✅ Timeline created with ID: ${createdTimelineId}`);
  }

  if (!createdTimelineId) {
    console.log('\n❌ Failed to create timeline. Stopping tests.');
    return;
  }

  // Test 3: Get timeline by ID
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 3: Get Timeline (GET /api/timelines/[id])');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await testAPI(`/api/timelines/${createdTimelineId}`);

  // Test 4: Create event
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 4: Create Event (POST /api/timelines/[id]/events)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const createEventResult = await testAPI(`/api/timelines/${createdTimelineId}/events`, {
    method: 'POST',
    body: JSON.stringify({
      title: 'Test Event 1',
      description: 'This is the first test event',
      date: '2024-01-15',
      category: 'milestone',
      image_url: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800',
    }),
  });

  if (createEventResult.success && createEventResult.data?.id) {
    createdEventId = createEventResult.data.id;
    console.log(`   ✅ Event created with ID: ${createdEventId}`);
  }

  // Test 5: Create another event
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 5: Create Second Event');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await testAPI(`/api/timelines/${createdTimelineId}/events`, {
    method: 'POST',
    body: JSON.stringify({
      title: 'Test Event 2',
      description: 'This is the second test event',
      date: '2024-02-20',
      category: 'crisis',
    }),
  });

  // Test 6: List events for timeline
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 6: List Events (GET /api/timelines/[id]/events)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await testAPI(`/api/timelines/${createdTimelineId}/events`);

  // Test 7: Get event by ID
  if (createdEventId) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 7: Get Event (GET /api/events/[id])');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    await testAPI(`/api/events/${createdEventId}`);
  }

  // Test 8: Update timeline
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 8: Update Timeline (PATCH /api/timelines/[id])');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await testAPI(`/api/timelines/${createdTimelineId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      description: 'Updated description from API test',
      is_collaborative: true,
    }),
  });

  // Test 9: Update event
  if (createdEventId) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 9: Update Event (PATCH /api/events/[id])');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    await testAPI(`/api/events/${createdEventId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        description: 'Updated event description',
      }),
    });
  }

  // Test 10: List timelines again (should show our new timeline)
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 10: List Timelines Again');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await testAPI('/api/timelines');

  // Cleanup (optional - comment out if you want to keep test data)
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧹 Cleanup: Deleting test data...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (createdTimelineId) {
    console.log('\n⚠️  To delete test timeline, uncomment cleanup code in test script');
    // Uncomment to enable cleanup:
    // await testAPI(`/api/timelines/${createdTimelineId}`, { method: 'DELETE' });
  }

  console.log('\n✅ All tests completed!\n');
}

// Check if Next.js dev server is running
async function checkServer() {
  try {
    const response = await fetch(`${API_BASE}/api/timelines`);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('❌ Next.js dev server is not running!');
    console.log('   Please run: npm run dev');
    console.log('   Then run this test script again.\n');
    process.exit(1);
  }

  await runTests();
}

main();

