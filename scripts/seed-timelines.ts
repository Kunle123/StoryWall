#!/usr/bin/env ts-node

/**
 * Script to seed timelines from a JSON file
 * 
 * Usage:
 *   npx ts-node scripts/seed-timelines.ts <seed-file.json>
 * 
 * Or with environment variable:
 *   SEED_FILE=seed-data.json npx ts-node scripts/seed-timelines.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const seedFile = process.env.SEED_FILE || process.argv[2];

if (!seedFile) {
  console.error('Usage: npx ts-node scripts/seed-timelines.ts <seed-file.json>');
  console.error('   Or: SEED_FILE=seed-data.json npx ts-node scripts/seed-timelines.ts');
  process.exit(1);
}

const filePath = path.resolve(seedFile);

if (!fs.existsSync(filePath)) {
  console.error(`Error: Seed file not found: ${filePath}`);
  process.exit(1);
}

async function seedFromFile() {
  try {
    const seedData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const adminKey = process.env.ADMIN_SEED_KEY || 'dev-seed-key'; // TODO: Use proper admin auth
    
    console.log(`[Seed] Sending seed data to ${appUrl}/api/admin/seed`);
    console.log(`[Seed] Processing ${seedData.length} users with ${seedData.reduce((sum: number, entry: any) => sum + entry.timelines.length, 0)} total timelines...`);
    
    const response = await fetch(`${appUrl}/api/admin/seed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminKey, // TODO: Replace with proper auth
      },
      body: JSON.stringify(seedData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    
    console.log('\n[Seed] Seeding completed!');
    console.log('Summary:');
    console.log(`  Users created: ${result.summary.usersCreated}`);
    console.log(`  Users skipped (existing): ${result.summary.usersSkipped}`);
    console.log(`  Timelines created: ${result.summary.timelinesCreated}`);
    console.log(`  Timelines failed: ${result.summary.timelinesFailed}`);
    console.log(`  Events generated: ${result.summary.eventsGenerated}`);
    console.log(`  Images generated: ${result.summary.imagesGenerated}`);
    
    if (result.summary.errors.length > 0) {
      console.log('\nErrors:');
      result.summary.errors.forEach((error: string) => {
        console.log(`  - ${error}`);
      });
    }
  } catch (error: any) {
    console.error('[Seed] Error:', error.message);
    process.exit(1);
  }
}

seedFromFile();

