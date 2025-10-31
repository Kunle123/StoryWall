import 'dotenv/config';
import { prisma } from '../lib/db/prisma';

async function testConnection() {
  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Check if tables exist by trying to query them
    const userCount = await prisma.user.count();
    console.log(`✅ Users table exists (${userCount} users)`);
    
    const timelineCount = await prisma.timeline.count();
    console.log(`✅ Timelines table exists (${timelineCount} timelines)`);
    
    const eventCount = await prisma.event.count();
    console.log(`✅ Events table exists (${eventCount} events)`);
    
    await prisma.$disconnect();
    console.log('\n✅ All database tables are set up correctly!');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
}

testConnection();

