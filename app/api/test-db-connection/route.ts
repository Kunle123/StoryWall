import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    // Check what DATABASE_URL the server sees (masked for security)
    const dbUrl = process.env.DATABASE_URL || 'NOT SET';
    const maskedUrl = dbUrl.includes('@') 
      ? dbUrl.split('@')[1] || dbUrl 
      : dbUrl.substring(0, 20) + '...';
    
    // Try to query the database
    const timelineCount = await prisma.timeline.count();
    const recentTimelines = await prisma.timeline.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, createdAt: true }
    });
    
    return NextResponse.json({
      databaseUrl: maskedUrl,
      timelineCount,
      recentTimelines,
      message: 'Database connection successful'
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack?.substring(0, 500),
      databaseUrl: process.env.DATABASE_URL ? 'SET (but error occurred)' : 'NOT SET'
    }, { status: 500 });
  }
}

