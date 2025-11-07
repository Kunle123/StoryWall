/**
 * Fix Google credentials format in .env.local
 * Wraps the JSON in single quotes if needed
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

const envPath = path.join(__dirname, '..', '.env.local');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found');
  process.exit(1);
}

console.log('🔧 Fixing Google Credentials Format\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Read the file
let envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

let fixed = false;
const newLines = lines.map((line, index) => {
  // Find the GOOGLE_APPLICATION_CREDENTIALS_JSON line
  if (line.startsWith('GOOGLE_APPLICATION_CREDENTIALS_JSON=')) {
    const value = line.substring('GOOGLE_APPLICATION_CREDENTIALS_JSON='.length);
    
    // Check if it's already wrapped in quotes
    if ((value.startsWith("'") && value.endsWith("'")) || 
        (value.startsWith('"') && value.endsWith('"'))) {
      console.log(`✅ Line ${index + 1} already has quotes\n`);
      return line;
    }
    
    // Check if it's just a single character (incomplete)
    if (value.trim().length < 10) {
      console.log(`⚠️  Line ${index + 1} appears incomplete (only ${value.length} characters)`);
      console.log(`   Value: ${JSON.stringify(value)}\n`);
      console.log('   You need to paste the FULL JSON from Railway.\n');
      return line;
    }
    
    // Wrap in single quotes
    const fixedLine = `GOOGLE_APPLICATION_CREDENTIALS_JSON='${value.trim()}'`;
    console.log(`✅ Fixed line ${index + 1}:`);
    console.log(`   Before: ${line.substring(0, 80)}...`);
    console.log(`   After:  ${fixedLine.substring(0, 80)}...\n`);
    fixed = true;
    return fixedLine;
  }
  
  return line;
});

if (fixed) {
  // Write back
  fs.writeFileSync(envPath, newLines.join('\n'));
  console.log('✅ .env.local file updated!\n');
  console.log('📝 Now test with:');
  console.log('   npx tsx scripts/check-google-credentials.ts\n');
} else {
  console.log('ℹ️  No changes needed, or the JSON appears incomplete.\n');
  console.log('💡 If the JSON is incomplete, you need to:');
  console.log('   1. Go to Railway → Variables');
  console.log('   2. Copy the FULL value of GOOGLE_APPLICATION_CREDENTIALS_JSON');
  console.log('   3. Replace the value in .env.local\n');
}

