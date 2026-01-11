import { NextRequest } from 'next/server';
import { progressStore } from '@/lib/utils/progressStore';
import crypto from 'crypto';

// Streaming version of the image generation endpoint
// Sends each completed image as soon as it's ready using Server-Sent Events (SSE)

export async function POST(request: NextRequest) {
  const jobId = crypto.randomUUID();
  
  try {
    const body = await request.json();
    
    // Create a streaming response
    const encoder = new TextEncoder();
    const customReadable = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: any) => {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        // Register progress callback
        progressStore.register(jobId, (imageUrl, index, eventTitle, completed, total) => {
          sendEvent('image', {
            index,
            imageUrl,
            eventTitle,
            completed,
            total,
          });
        });

        try {
          // Send initial status
          sendEvent('status', { message: 'Starting image generation...', total: body.events.length });

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
          const images: string[] = result?.images || result?.data?.images || result?.result?.images || [];

          sendEvent('complete', { images, message: 'All images generated!' });
        } catch (error: any) {
          console.error('[StreamingAPI] Error:', error);
          sendEvent('error', { message: error.message || 'Image generation failed' });
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
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    progressStore.unregister(jobId);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to process request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
