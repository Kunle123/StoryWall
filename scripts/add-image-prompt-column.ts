/**
 * Script to add image_prompt column to events table in production
 * Run with: npx tsx scripts/add-image-prompt-column.ts
 * 
 * This will add the column if it doesn't exist
 */

import { prisma } from '@/lib/db/prisma';

async function addImagePromptColumn() {
  try {
    console.log('Adding image_prompt column to events table...');
    
    // Check if column exists first
    const checkColumn = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'events' AND column_name = 'image_prompt'
    `);

    if (checkColumn.length > 0) {
      console.log('✅ Column image_prompt already exists');
      return;
    }

    // Add the column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "events" ADD COLUMN "image_prompt" TEXT;
    `);

    console.log('✅ Successfully added image_prompt column to events table');
  } catch (error: any) {
    console.error('❌ Error adding column:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addImagePromptColumn();

