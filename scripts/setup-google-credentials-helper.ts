/**
 * Helper to set up Google credentials in .env.local
 * 
 * This script will help you properly format the credentials
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setup() {
  console.log('🔧 Google Cloud Credentials Setup Helper\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('This will help you add Google credentials to .env.local\n');
  
  const projectId = await question('Enter your GOOGLE_CLOUD_PROJECT_ID: ');
  
  console.log('\n📋 For GOOGLE_APPLICATION_CREDENTIALS_JSON:');
  console.log('   1. Go to Railway → Variables tab');
  console.log('   2. Find GOOGLE_APPLICATION_CREDENTIALS_JSON');
  console.log('   3. Click to reveal the value');
  console.log('   4. Copy the ENTIRE JSON (it should be very long, 2000+ characters)\n');
  
  const credentialsJson = await question('Paste the FULL JSON here (or press Enter to skip): ');
  
  if (!credentialsJson || credentialsJson.trim().length < 100) {
    console.log('\n⚠️  The JSON seems too short. Make sure you copied the entire JSON from Railway.');
    console.log('   It should start with {"type":"service_account" and be very long.\n');
    rl.close();
    return;
  }
  
  // Verify it's valid JSON
  try {
    const parsed = JSON.parse(credentialsJson.trim());
    console.log('\n✅ JSON is valid!');
    console.log(`   Project ID in JSON: ${parsed.project_id}`);
    console.log(`   Client Email: ${parsed.client_email}\n`);
  } catch (error: any) {
    console.log(`\n❌ Invalid JSON: ${error.message}`);
    console.log('   Please check that you copied the entire JSON correctly.\n');
    rl.close();
    return;
  }
  
  // Read existing .env.local
  const envPath = path.join(__dirname, '..', '.env.local');
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Remove existing Google credentials if present
  envContent = envContent.replace(/^GOOGLE_CLOUD_PROJECT_ID=.*$/gm, '');
  envContent = envContent.replace(/^GOOGLE_APPLICATION_CREDENTIALS_JSON=.*$/gm, '');
  envContent = envContent.trim();
  
  // Add new credentials
  const newLines = [
    envContent,
    '',
    '# Google Cloud Credentials',
    `GOOGLE_CLOUD_PROJECT_ID=${projectId}`,
    `GOOGLE_APPLICATION_CREDENTIALS_JSON='${credentialsJson.trim()}'`,
    '',
  ].join('\n');
  
  // Write back
  fs.writeFileSync(envPath, newLines);
  
  console.log('✅ Credentials added to .env.local!\n');
  console.log('📝 Now you can test with:');
  console.log('   npx tsx scripts/test-imagen-and-view.ts\n');
  
  rl.close();
}

setup().catch(console.error);

