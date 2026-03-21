import { NextRequest, NextResponse } from 'next/server';
import { progressStore } from '@/lib/utils/progressStore';
import crypto from 'crypto';

// Streaming version of the image generation endpoint
// Sends each completed image as soon as it's ready using Server-Sent Events (SSE)
//
// Uses in-memory progressStore — same-process as POST /api/ai/generate-images only.
// See lib/utils/progressStore.ts for multi-replica limitations.

export async function POST(request: NextRequest) {
  const jobId = crypto.randomUUID();

  try {
    const body = await request.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const events = body.events;
    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'Events array is required and must be non-empty' },
        { status: 400 }
      );
    }

    // Create a streaming response
    const encoder = new TextEncoder();
    const customReadable = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: Record<string, unknown>) => {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        // Register progress callback
        progressStore.register(jobId, update => {
          sendEvent('image', {
            index: update.index,
            imageUrl: update.imageUrl,
            eventTitle: update.eventTitle,
            error: update.error,
            completed: update.completed,
            total: update.total,
          });
        });

        try {
          // Send initial status
          sendEvent('status', {
            message: 'Starting image generation...',
            total: events.length,
          });

          // Call the regular image generation endpoint with jobId for progress tracking
          const url = new URL('/api/ai/generate-images', request.url);
          url.searchParams.set('abridged', 'true');
          url.searchParams.set('jobId', jobId);

          const response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-abridged-flow': 'true',
            },
            body: JSON.stringify(body),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Image generation failed (${response.status}): ${errorText}`);
          }

          const result = await response.json();
          const images: string[] =
            result?.images || result?.data?.images || result?.result?.images || [];

          sendEvent('complete', { images, message: 'All images generated!' });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Image generation failed';
          console.error('[StreamingAPI] Error:', error);
          sendEvent('error', { message });
        } finally {
          // Cleanup
          progressStore.unregister(jobId);
          controller.close();
        }
      },
    });

    return new Response(customReadable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: unknown) {
    progressStore.unregister(jobId);
    const message = error instanceof Error ? error.message : 'Failed to process request';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
