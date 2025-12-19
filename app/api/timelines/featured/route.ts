import { NextRequest, NextResponse } from 'next/server';
import { getFeaturedTimelines } from '@/lib/db/timelines';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const timelines = await getFeaturedTimelines(limit);
    
    return NextResponse.json(timelines || []);
  } catch (error: any) {
    console.error('Error fetching featured timelines:', error);
    return NextResponse.json([], { status: 200 }); // Return empty array instead of error
  }
}

