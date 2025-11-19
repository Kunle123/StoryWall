/**
 * Test script for the verify-events endpoint
 * 
 * Usage:
 *   npx tsx scripts/test-verify-events.ts
 * 
 * Or test with curl:
 *   curl -X POST http://localhost:3000/api/ai/verify-events \
 *     -H "Content-Type: application/json" \
 *     -d '{"events": [...], "timelineDescription": "...", "timelineName": "..."}'
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

async function testVerifyEvents() {
  const testEvents = [
    {
      year: 1920,
      title: "Mamie Smith Records 'Crazy Blues'",
      description: "Mamie Smith walks into Okeh Studios and cuts 'Crazy Blues,' the first blues record sung by a Black woman. Its unexpected sale of 75,000 copies in a month proves there's a market for Black female vocalists."
    },
    {
      year: 1923,
      title: "Bessie Smith's 'Downhearted Blues' Released",
      description: "Columbia releases Bessie Smith's 'Downhearted Blues,' backed by 'Gulf Coast Blues'; it sells 780,000 copies in six months and makes her the highest-paid Black entertainer of her era."
    },
    {
      year: 1925,
      title: "Ma Rainey Records 'See See Rider Blues'",
      description: "Ma Rainey records 'See See Rider Blues' in New York, cementing the moaning, slow-drag style that lets her slip erotic innuendo past censors."
    },
    {
      year: 2025,
      title: "Test Event - This should be flagged",
      description: "This is a test event that doesn't exist and should be flagged by verification."
    }
  ];

  const requestBody = {
    events: testEvents,
    timelineDescription: "A timeline of female jazz vocalists of the 1920s and 1930s",
    timelineName: "Female Jazz Vocalists Test"
  };

  console.log('🧪 Testing Verify Events Endpoint\n');
  console.log('📍 API Base:', API_BASE);
  console.log('📋 Testing with', testEvents.length, 'events\n');

  try {
    const response = await fetch(`${API_BASE}/api/ai/verify-events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error:', response.status, response.statusText);
      console.error('Response:', errorText);
      return;
    }

    const result = await response.json();
    
    console.log('✅ Verification Complete!\n');
    console.log('📊 Summary:');
    console.log(`   Total events: ${result.summary.total}`);
    console.log(`   Verified: ${result.summary.verified}`);
    console.log(`   Flagged: ${result.summary.flagged}`);
    console.log(`   High confidence: ${result.summary.highConfidence}`);
    console.log(`   Medium confidence: ${result.summary.mediumConfidence}`);
    console.log(`   Low confidence: ${result.summary.lowConfidence}\n`);

    console.log('📝 Event Details:');
    result.verifiedEvents.forEach((event: any, idx: number) => {
      const status = event.verified ? '✅' : '⚠️';
      const confidence = event.confidence === 'high' ? '🟢' : event.confidence === 'medium' ? '🟡' : '🔴';
      console.log(`\n${idx + 1}. ${status} ${confidence} ${event.title} (${event.year || 'No date'})`);
      console.log(`   Confidence: ${event.confidence}`);
      if (event.issues && event.issues.length > 0) {
        console.log(`   Issues: ${event.issues.join(', ')}`);
      }
    });

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    if (error.message.includes('fetch')) {
      console.error('\n💡 Make sure the Next.js dev server is running:');
      console.error('   npm run dev');
    }
  }
}

testVerifyEvents();

