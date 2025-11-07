/**
 * Check Google Cloud credentials format in .env.local
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

console.log('🔍 Checking Google Cloud Credentials Format\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (!projectId) {
  console.error('❌ GOOGLE_CLOUD_PROJECT_ID not found\n');
} else {
  console.log(`✅ GOOGLE_CLOUD_PROJECT_ID: ${projectId}\n`);
}

if (!credentialsJson) {
  console.error('❌ GOOGLE_APPLICATION_CREDENTIALS_JSON not found\n');
  process.exit(1);
}

console.log('📋 GOOGLE_APPLICATION_CREDENTIALS_JSON:');
console.log(`   Length: ${credentialsJson.length} characters`);
console.log(`   First 100 chars: ${credentialsJson.substring(0, 100)}...\n`);

// Check format
let jsonString = credentialsJson.trim();
const originalLength = jsonString.length;

// Check if wrapped in quotes
if (jsonString.startsWith('"') && jsonString.endsWith('"')) {
  console.log('⚠️  JSON is wrapped in double quotes - this might cause issues');
  jsonString = jsonString.slice(1, -1);
} else if (jsonString.startsWith("'") && jsonString.endsWith("'")) {
  console.log('✅ JSON is wrapped in single quotes - this is OK');
  jsonString = jsonString.slice(1, -1);
} else {
  console.log('✅ JSON is not wrapped in quotes - this is OK');
}

console.log(`   After removing quotes: ${jsonString.length} characters\n`);

// Try to parse
try {
  const parsed = JSON.parse(jsonString);
  console.log('✅ JSON is valid!\n');
  console.log('📊 Parsed JSON structure:');
  console.log(`   type: ${parsed.type}`);
  console.log(`   project_id: ${parsed.project_id}`);
  console.log(`   client_email: ${parsed.client_email?.substring(0, 50)}...\n`);
  console.log('✅ Credentials format is correct!\n');
} catch (error: any) {
  console.error('❌ JSON parsing failed:\n');
  console.error(`   Error: ${error.message}\n`);
  console.log('💡 Fix suggestion:');
  console.log('   In .env.local, the JSON should be formatted as:');
  console.log('   GOOGLE_APPLICATION_CREDENTIALS_JSON=\'{"type":"service_account",...}\'');
  console.log('   (Use single quotes around the JSON, or no quotes at all)\n');
  process.exit(1);
}

