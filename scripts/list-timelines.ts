/**
 * Script to list all timelines in the database
 */

import { prisma } from '../lib/db/prisma';

async function listTimelines() {
  try {
    const timelines = await prisma.$queryRawUnsafe<Array<{
      id: string;
      title: string;
      slug: string;
      creator_id: string;
      created_at: Date;
    }>>(`
      SELECT id, title, slug, creator_id, created_at 
      FROM timelines 
      ORDER BY created_at DESC
      LIMIT 20
    `);
    
    console.log(`Found ${timelines.length} timelines:\n`);
    timelines.forEach((t, idx) => {
      console.log(`${idx + 1}. ${t.title}`);
      console.log(`   ID: ${t.id}`);
      console.log(`   Slug: ${t.slug}`);
      console.log(`   Created: ${t.created_at}`);
      console.log('');
    });
  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

listTimelines();

