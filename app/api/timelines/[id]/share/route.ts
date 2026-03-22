import { NextRequest, NextResponse } from 'next/server';
import { getTimelineById, getTimelineBySlug, incrementTimelineShareCount } from '@/lib/db/timelines';

function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/** POST — increment share counter (native share or copy link on timeline). Public, idempotent-friendly. */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const timeline = isUUID(id) ? await getTimelineById(id) : await getTimelineBySlug(id);
    if (!timeline) {
      return NextResponse.json({ error: 'Timeline not found' }, { status: 404 });
    }
    await incrementTimelineShareCount(timeline.id);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[POST /api/timelines/[id]/share]', error);
    return NextResponse.json({ error: error.message || 'Failed to record share' }, { status: 500 });
  }
}
