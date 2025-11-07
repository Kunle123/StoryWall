/**
 * Helper script to extract Google Cloud credentials from JSON file
 * 
 * Usage:
 * 1. Place your downloaded JSON key file in the project root (temporarily)
 * 2. Run: npx tsx scripts/setup-google-credentials.ts path/to/key.json
 * 3. Copy the output to your .env.local or Railway variables
 * 4. Delete the JSON file from project root (it's in .gitignore)
 */

import * as fs from 'fs';
import * as path from 'path';

const keyFilePath = process.argv[2];

if (!keyFilePath) {
  console.error('Usage: npx tsx scripts/setup-google-credentials.ts path/to/key.json');
  process.exit(1);
}

try {
  const fullPath = path.resolve(keyFilePath);
  const keyFile = fs.readFileSync(fullPath, 'utf8');
  const credentials = JSON.parse(keyFile);

  console.log('\n✅ Google Cloud Credentials Extracted\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('1. Project ID:');
  console.log(`   GOOGLE_CLOUD_PROJECT_ID=${credentials.project_id}\n`);
  
  console.log('2. Credentials JSON (for Railway or .env.local):');
  console.log('   GOOGLE_APPLICATION_CREDENTIALS_JSON=' + JSON.stringify(credentials) + '\n');
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📋 Next Steps:\n');
  console.log('For Local Development (.env.local):');
  console.log('   Add these two lines to your .env.local file\n');
  console.log('For Railway (Production):');
  console.log('   1. Go to Railway project → Variables tab');
  console.log('   2. Add both variables above\n');
  console.log('⚠️  Remember to delete the JSON file after copying!\n');
  
} catch (error: any) {
  console.error('Error reading JSON file:', error.message);
  process.exit(1);
}

