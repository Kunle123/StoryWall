import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Configure Cloudinary
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

interface ChartEvent {
  id: string;
  title: string;
  description?: string;
  date?: string;
  number?: number;
  data: Record<string, number>;
}

function bufferToStream(buffer: Buffer): Readable {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
}

/**
 * Generate a chart image using QuickChart.io (free chart generation service)
 * This is a temporary solution until we implement server-side Chart.js
 */
async function generateChartImage(
  metrics: string[],
  data: Record<string, number>,
  chartType: string,
  themeColor: string,
  title: string
): Promise<Buffer> {
  // Prepare data for the chart
  const labels = metrics;
  const values = metrics.map(metric => data[metric] || 0);

  // Generate chart URL based on chart type
  let chartUrl = '';
  const baseUrl = 'https://quickchart.io/chart';

  if (chartType === 'bar') {
    chartUrl = `${baseUrl}?c=${encodeURIComponent(JSON.stringify({
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: title,
          data: values,
          backgroundColor: themeColor || '#3B82F6',
        }],
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: title,
          },
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    }))}`;
  } else if (chartType === 'line') {
    chartUrl = `${baseUrl}?c=${encodeURIComponent(JSON.stringify({
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: title,
          data: values,
          borderColor: themeColor || '#3B82F6',
          backgroundColor: themeColor ? `${themeColor}33` : '#3B82F633',
          fill: true,
        }],
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: title,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    }))}`;
  } else if (chartType === 'pie' || chartType === 'doughnut') {
    chartUrl = `${baseUrl}?c=${encodeURIComponent(JSON.stringify({
      type: chartType,
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: [
            themeColor || '#3B82F6',
            '#A855F7',
            '#10B981',
            '#F97316',
            '#EF4444',
            '#EC4899',
            '#14B8A6',
            '#EAB308',
          ].slice(0, metrics.length),
        }],
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: title,
          },
        },
      },
    }))}`;
  } else {
    // Default to bar chart
    chartUrl = `${baseUrl}?c=${encodeURIComponent(JSON.stringify({
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: title,
          data: values,
          backgroundColor: themeColor || '#3B82F6',
        }],
      },
    }))}`;
  }

  // Fetch the chart image
  const response = await fetch(chartUrl);
  if (!response.ok) {
    throw new Error(`Failed to generate chart: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Upload chart image buffer to Cloudinary
 */
async function uploadChartToCloudinary(buffer: Buffer): Promise<string> {
  if (!process.env.CLOUDINARY_CLOUD_NAME || 
      !process.env.CLOUDINARY_API_KEY || 
      !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary is not configured');
  }

  return new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'storywall/charts',
        resource_type: 'image',
        transformation: [
          { quality: 'auto' },
          { fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve(result.secure_url);
        } else {
          reject(new Error('Upload failed - no result'));
        }
      }
    );

    bufferToStream(buffer).pipe(uploadStream);
  });
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { events, metrics, chartType = 'bar', themeColor = '#3B82F6', timelineName } = body;

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'Events array is required' },
        { status: 400 }
      );
    }

    if (!metrics || !Array.isArray(metrics) || metrics.length === 0) {
      return NextResponse.json(
        { error: 'Metrics array is required' },
        { status: 400 }
      );
    }

    // Check if streaming is requested
    const stream = request.headers.get('accept')?.includes('text/event-stream');

    if (stream) {
      // Stream chart generation progress
      const readableStream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          
          try {
            for (let i = 0; i < events.length; i++) {
              const event = events[i];
              
              try {
                // Generate chart image
                const chartBuffer = await generateChartImage(
                  metrics,
                  event.data,
                  chartType,
                  themeColor,
                  event.title || timelineName || 'Chart'
                );

                // Upload to Cloudinary
                const chartUrl = await uploadChartToCloudinary(chartBuffer);

                // Send progress update
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({
                    type: 'chart',
                    index: i,
                    eventId: event.id,
                    chartUrl,
                    completed: i + 1,
                    total: events.length,
                  })}\n\n`)
                );
              } catch (error: any) {
                console.error(`[ChartGen] Error generating chart for event ${event.id}:`, error);
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({
                    type: 'error',
                    index: i,
                    eventId: event.id,
                    message: error.message || 'Failed to generate chart',
                  })}\n\n`)
                );
              }
            }

            // Send completion
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'complete',
                completed: events.length,
                total: events.length,
              })}\n\n`)
            );
            controller.close();
          } catch (error: any) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'error',
                message: error.message || 'Chart generation failed',
              })}\n\n`)
            );
            controller.close();
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Non-streaming: Generate all charts and return
      const chartResults = await Promise.all(
        events.map(async (event: ChartEvent, index: number) => {
          try {
            const chartBuffer = await generateChartImage(
              metrics,
              event.data,
              chartType,
              themeColor,
              event.title || timelineName || 'Chart'
            );

            const chartUrl = await uploadChartToCloudinary(chartBuffer);

            return {
              index,
              eventId: event.id,
              chartUrl,
            };
          } catch (error: any) {
            console.error(`[ChartGen] Error generating chart for event ${event.id}:`, error);
            return {
              index,
              eventId: event.id,
              chartUrl: null,
              error: error.message,
            };
          }
        })
      );

      const chartUrls = chartResults.map(r => r.chartUrl);
      const successfulCount = chartUrls.filter(url => url !== null).length;

      return NextResponse.json({
        charts: chartUrls,
        successful: successfulCount,
        total: events.length,
      });
    }
  } catch (error: any) {
    console.error('[ChartGen] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate charts' },
      { status: 500 }
    );
  }
}

