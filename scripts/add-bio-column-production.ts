/**
 * Script to add bio column to users table in production
 * Run with: npx tsx scripts/add-bio-column-production.ts
 * 
 * This will add the column if it doesn't exist
 */

import { prisma } from '@/lib/db/prisma';

async function addBioColumn() {
  try {
    console.log('Checking if bio column exists in users table...');
    
    // Check if column exists first
    const checkColumn = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'bio'
    `);

    if (checkColumn.length > 0) {
      console.log('✅ Column bio already exists in users table');
      return;
    }

    console.log('Adding bio column to users table...');
    
    // Add the column using the same SQL as the migration
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bio" TEXT;
    `);

    console.log('✅ Successfully added bio column to users table');
  } catch (error: any) {
    console.error('❌ Error adding column:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addBioColumn();

