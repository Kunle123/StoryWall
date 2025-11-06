import 'dotenv/config';

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function testGenerateEvents(timelineName: string, timelineDescription: string, isFactual: boolean = true) {
  try {
    console.log(`\n📡 Testing /api/ai/generate-events`);
    console.log(`   Timeline: ${timelineName}`);
    console.log(`   Type: ${isFactual ? 'Factual' : 'Fictional'}`);
    console.log(`   Description: ${timelineDescription.substring(0, 100)}...`);
    
    const startTime = Date.now();
    
    const response = await fetch(`${API_BASE}/api/ai/generate-events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timelineName,
        timelineDescription,
        maxEvents: 5, // Test with 5 events for faster response
        isFactual,
      }),
    });

    const elapsed = Date.now() - startTime;
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Success (${response.status}) - ${elapsed}ms`);
      console.log(`   Generated ${data.events?.length || 0} events:`);
      
      if (data.events && data.events.length > 0) {
        data.events.forEach((event: any, idx: number) => {
          const dateStr = event.month && event.day 
            ? `${event.year}-${event.month}-${event.day}` 
            : event.month 
            ? `${event.year}-${event.month}` 
            : `${event.year}`;
          console.log(`   ${idx + 1}. [${dateStr}] ${event.title}`);
        });
      } else {
        console.log(`   ⚠️  No events generated (AI returned empty array)`);
      }
      
      return { success: true, data, elapsed };
    } else {
      console.log(`❌ Error (${response.status}):`, data.error || data.details || JSON.stringify(data));
      return { success: false, data, status: response.status };
    }
  } catch (error: any) {
    console.log(`❌ Request failed:`, error.message);
    return { success: false, error: error.message };
  }
}

async function checkServer() {
  try {
    const response = await fetch(`${API_BASE}/api/timelines`);
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  console.log('🧪 Testing GPT-5-mini Event Generation Endpoint\n');
  console.log('📍 Base URL:', API_BASE);
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('❌ Next.js dev server is not running!');
    console.log('   Please run: npm run dev');
    console.log('   Then run this test script again.\n');
    process.exit(1);
  }

  // Test 1: Factual timeline (historical)
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 1: Factual Timeline (Historical Events)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await testGenerateEvents(
    'World War II',
    'A timeline of major events during World War II from 1939 to 1945',
    true
  );

  // Test 2: Fictional timeline
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 2: Fictional Timeline (Creative Story)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await testGenerateEvents(
    'A Space Adventure',
    'A sci-fi story about a crew discovering a new planet with mysterious alien technology',
    false
  );

  // Test 3: Recent events (should return few or no events)
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 3: Recent Events (Should be Conservative)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await testGenerateEvents(
    'Recent Tech Developments',
    'Major technology developments and AI breakthroughs from 2023 to present day',
    true
  );

  console.log('\n✅ All tests completed!\n');
}

main().catch(console.error);

