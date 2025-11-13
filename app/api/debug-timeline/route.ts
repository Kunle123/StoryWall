import { NextRequest, NextResponse } from 'next/server';
import { getTimelineById } from '@/lib/db/timelines';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }
  
  try {
    console.log('[DEBUG] Fetching timeline with ID:', id);
    
    // Test direct database query
    const directQuery = `SELECT id, title FROM timelines WHERE id = '${id.replace(/'/g, "''")}'`;
    const directRows = await prisma.$queryRawUnsafe(directQuery);
    console.log('[DEBUG] Direct query rows:', directRows);
    
    // Test getTimelineById
    const timeline = await getTimelineById(id);
    console.log('[DEBUG] getTimelineById result:', timeline ? 'FOUND' : 'NOT FOUND');
    
    if (timeline) {
      return NextResponse.json({
        found: true,
        title: timeline.title,
        eventCount: timeline.events?.length || 0,
        id: timeline.id,
        directQueryRows: directRows
      });
    } else {
      return NextResponse.json({
        found: false,
        id: id,
        directQueryRows: directRows
      });
    }
  } catch (error: any) {
    console.error('[DEBUG] Error:', error.message);
    return NextResponse.json({
      error: error.message,
      stack: error.stack?.substring(0, 500)
    }, { status: 500 });
  }
}

