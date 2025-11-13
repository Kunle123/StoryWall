#!/usr/bin/env tsx
/**
 * Delete all Die Hard timelines from database
 * 
 * Usage:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/delete-die-hard-timelines.ts
 *   OR
 *   npx tsx scripts/delete-die-hard-timelines.ts (uses .env.local)
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
// Railway CLI automatically injects DATABASE_URL, so don't override it
if (!process.env.RAILWAY_ENVIRONMENT) {
  // Only load local env files if not running on Railway
  dotenv.config({ path: '.env.local' });
  dotenv.config({ path: '.env' });
}

// Allow DATABASE_URL to be passed via environment or command line
// Railway CLI automatically sets this when using 'railway run'
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in environment variables');
  console.error('Please provide DATABASE_URL:');
  console.error('  DATABASE_URL="postgresql://..." npx tsx scripts/delete-die-hard-timelines.ts');
  process.exit(1);
}

// Create Prisma client with explicit database URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

async function deleteDieHardTimelines() {
  try {
    console.log('🔍 Searching for Die Hard timelines...');
    console.log('📊 Database:', databaseUrl.split('@')[1]?.split('/')[0] || 'unknown');
    
    // Find all Die Hard timelines
    const timelines = await prisma.$queryRawUnsafe<Array<{ id: string; title: string }>>(
      `SELECT id, title FROM timelines WHERE LOWER(title) LIKE '%die hard%'`
    );
    
    if (timelines.length === 0) {
      console.log('✅ No Die Hard timelines found');
      return;
    }
    
    console.log(`\n📋 Found ${timelines.length} Die Hard timeline(s):`);
    timelines.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.title} (${t.id})`);
    });
    
    console.log('\n🗑️  Deleting timelines and their events...');
    
    for (const timeline of timelines) {
      // Delete events first (foreign key constraint)
      const eventsDeleted = await prisma.$executeRawUnsafe(
        `DELETE FROM events WHERE timeline_id = $1`,
        timeline.id
      );
      
      // Delete timeline
      await prisma.$executeRawUnsafe(
        `DELETE FROM timelines WHERE id = $1`,
        timeline.id
      );
      
      console.log(`   ✓ Deleted: "${timeline.title}" (${eventsDeleted} events)`);
    }
    
    console.log(`\n✅ Successfully deleted ${timelines.length} Die Hard timeline(s)`);
    
    // Verify deletion
    const remaining = await prisma.$queryRawUnsafe<Array<{ id: string; title: string }>>(
      `SELECT id, title FROM timelines WHERE LOWER(title) LIKE '%die hard%'`
    );
    
    if (remaining.length === 0) {
      console.log('✅ Verification: All Die Hard timelines removed');
    } else {
      console.log(`⚠️  Warning: ${remaining.length} timeline(s) still remain`);
    }
    
  } catch (error: any) {
    console.error('❌ Error deleting timelines:', error.message);
    if (error.code === 'P2022') {
      console.error('   This might be a schema mismatch. Trying alternative approach...');
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteDieHardTimelines()
  .then(() => {
    console.log('\n✨ Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error);
    process.exit(1);
  });

