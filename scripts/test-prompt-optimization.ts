/**
 * Test script for prompt optimization system
 * Run with: npx tsx scripts/test-prompt-optimization.ts
 */

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function testPromptOptimization() {
  console.log('🧪 Testing Prompt Optimization System\n');
  console.log('='.repeat(80));

  // Step 1: Test event generation with default prompts
  console.log('\n📝 Step 1: Testing event generation with default prompts...');
  const testResponse = await fetch(`${API_BASE}/api/debug/test-prompts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      step: 'events',
      timelineName: 'Good Morning Britain Controversies',
      timelineDescription: 'Notable incidents where Good Morning Britain hosts made dismissive or condescending comments about working-class people',
      maxEvents: 10,
      isFactual: true,
    }),
  });

  if (!testResponse.ok) {
    const error = await testResponse.json();
    console.error('❌ Test failed:', error);
    return;
  }

  const testData = await testResponse.json();
  console.log(`✅ Generated ${testData.data?.events?.length || 0} events`);
  console.log(`📊 Events:`, testData.data?.events?.slice(0, 3).map((e: any) => `${e.year}: ${e.title}`).join(', '));

  // Extract prompts from debug log (simplified - in real use, parse the log)
  const debugLog = testData.debugLog || '';
  const systemPromptMatch = debugLog.match(/SYSTEM PROMPT:\s*([\s\S]*?)(?=USER PROMPT:|$)/);
  const userPromptMatch = debugLog.match(/USER PROMPT:\s*([\s\S]*?)(?=\[|$)/);

  if (!systemPromptMatch || !userPromptMatch) {
    console.log('\n⚠️  Could not extract prompts from debug log. Using simplified prompts for optimization.');
  }

  const systemPrompt = systemPromptMatch?.[1]?.trim() || 'Generate accurate historical events based on the provided timeline description.';
  const userPrompt = userPromptMatch?.[1]?.trim() || `Timeline Name: "Good Morning Britain Controversies"\n\nDescription: Notable incidents where Good Morning Britain hosts made dismissive or condescending comments about working-class people\n\nGenerate up to 10 events.`;

  // Step 2: Optimize prompts
  console.log('\n🔧 Step 2: Analyzing outputs and optimizing prompts...');
  const optimizeResponse = await fetch(`${API_BASE}/api/debug/optimize-prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      step: 'events',
      currentSystemPrompt: systemPrompt,
      currentUserPrompt: userPrompt,
      outputs: testData.data?.events || [],
      debugLog: debugLog.substring(0, 10000), // Limit size
      optimizationGoal: 'Generate more diverse events across different years, focus on specific incidents rather than complaint statistics',
    }),
  });

  if (!optimizeResponse.ok) {
    const error = await optimizeResponse.json();
    console.error('❌ Optimization failed:', error);
    return;
  }

  const optimized = await optimizeResponse.json();
  console.log('✅ Optimization complete!');
  console.log(`📋 Issues found: ${optimized.analysis?.issues?.length || 0}`);
  console.log(`💡 Improvements suggested: ${optimized.analysis?.improvements?.length || 0}`);
  console.log(`🆔 Saved prompt ID: ${optimized.promptId}`);

  if (optimized.analysis?.improvements?.length > 0) {
    console.log('\n💡 Key improvements:');
    optimized.analysis.improvements.slice(0, 3).forEach((imp: string, i: number) => {
      console.log(`   ${i + 1}. ${imp}`);
    });
  }

  // Step 3: Test with optimized prompts
  console.log('\n🔄 Step 3: Testing with optimized prompts...');
  const retestResponse = await fetch(`${API_BASE}/api/debug/test-prompts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      step: 'events',
      timelineName: 'Good Morning Britain Controversies',
      timelineDescription: 'Notable incidents where Good Morning Britain hosts made dismissive or condescending comments about working-class people',
      maxEvents: 10,
      isFactual: true,
      promptId: optimized.promptId,
    }),
  });

  if (!retestResponse.ok) {
    const error = await retestResponse.json();
    console.error('❌ Retest failed:', error);
    return;
  }

  const retestData = await retestResponse.json();
  console.log(`✅ Generated ${retestData.data?.events?.length || 0} events with optimized prompts`);
  console.log(`📊 Events:`, retestData.data?.events?.slice(0, 3).map((e: any) => `${e.year}: ${e.title}`).join(', '));

  // Step 4: Compare results
  console.log('\n📊 Step 4: Comparison');
  console.log('='.repeat(80));
  console.log(`Original: ${testData.data?.events?.length || 0} events`);
  console.log(`Optimized: ${retestData.data?.events?.length || 0} events`);
  
  const originalYears = new Set((testData.data?.events || []).map((e: any) => e.year));
  const optimizedYears = new Set((retestData.data?.events || []).map((e: any) => e.year));
  console.log(`Original year diversity: ${originalYears.size} unique years`);
  console.log(`Optimized year diversity: ${optimizedYears.size} unique years`);

  console.log('\n✅ Test complete!');
  console.log(`\n📝 Full debug logs saved in responses above.`);
  console.log(`🆔 Prompt ID for future use: ${optimized.promptId}`);
}

// Run the test
testPromptOptimization().catch(console.error);

