/**
 * Script to delete all timelines from the database
 */

import { prisma } from '../lib/db/prisma';

async function deleteAllTimelines() {
  try {
    console.log('Fetching all timelines...');
    
    const timelines = await prisma.$queryRawUnsafe<Array<{ id: string; title: string }>>(`
      SELECT id, title FROM timelines
    `);
    
    console.log(`Found ${timelines.length} timeline(s) to delete\n`);
    
    for (const timeline of timelines) {
      console.log(`Deleting: "${timeline.title}" (${timeline.id})...`);
      
      // Delete associated data in order (due to foreign key constraints)
      // Comments on events
      await prisma.$executeRawUnsafe(`
        DELETE FROM comments WHERE event_id IN (
          SELECT id FROM events WHERE timeline_id = $1
        )
      `, timeline.id);
      
      // Comments on timeline
      await prisma.$executeRawUnsafe(`
        DELETE FROM comments WHERE timeline_id = $1
      `, timeline.id);
      
      // Likes on events
      await prisma.$executeRawUnsafe(`
        DELETE FROM likes WHERE event_id IN (
          SELECT id FROM events WHERE timeline_id = $1
        )
      `, timeline.id);
      
      // Likes on timeline
      await prisma.$executeRawUnsafe(`
        DELETE FROM likes WHERE timeline_id = $1
      `, timeline.id);
      
      // Events
      await prisma.$executeRawUnsafe(`
        DELETE FROM events WHERE timeline_id = $1
      `, timeline.id);
      
      // Categories
      await prisma.$executeRawUnsafe(`
        DELETE FROM categories WHERE timeline_id = $1
      `, timeline.id);
      
      // Collaborators
      await prisma.$executeRawUnsafe(`
        DELETE FROM collaborators WHERE timeline_id = $1
      `, timeline.id);
      
      // Timeline itself
      await prisma.$executeRawUnsafe(`
        DELETE FROM timelines WHERE id = $1
      `, timeline.id);
      
      console.log(`✅ Deleted: "${timeline.title}"\n`);
    }
    
    console.log(`✅ All timelines deleted successfully!`);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllTimelines();

