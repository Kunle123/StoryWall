/**
 * Script to add missing columns to timelines table
 */

import { prisma } from '../lib/db/prisma';

async function addMissingColumns() {
  try {
    console.log('Adding missing columns to timelines table...');
    
    // Add is_numbered column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE timelines 
      ADD COLUMN IF NOT EXISTS is_numbered BOOLEAN DEFAULT false;
    `);
    console.log('✅ Added is_numbered column');
    
    // Add number_label column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE timelines 
      ADD COLUMN IF NOT EXISTS number_label VARCHAR(50) DEFAULT 'Day';
    `);
    console.log('✅ Added number_label column');
    
    console.log('✅ All columns added successfully!');
  } catch (error: any) {
    console.error('❌ Error adding columns:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addMissingColumns();

