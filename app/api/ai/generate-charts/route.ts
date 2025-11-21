import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { ChartConfiguration } from 'chart.js';
import { toTitleCase } from '@/lib/utils/titleCase';

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
  dataUnavailable?: boolean;
}

function bufferToStream(buffer: Buffer): Readable {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
}

/**
 * Get color for a metric based on common conventions
 */
function getMetricColor(metric: string): string {
  const metricLower = metric.toLowerCase();
  
  // UK Political Parties
  if (metricLower.includes('conservative') || metricLower.includes('tory')) {
    return '#0087DC'; // Conservative blue
  }
  if (metricLower.includes('labour')) {
    return '#E4003B'; // Labour red
  }
  if (metricLower.includes('liberal democrat') || metricLower.includes('lib dem')) {
    return '#FDBB30'; // Lib Dem yellow
  }
  if (metricLower.includes('green')) {
    return '#6AB023'; // Green Party green
  }
  if (metricLower.includes('reform') || metricLower.includes('ukip')) {
    return '#6D2E5B'; // Reform/UKIP purple
  }
  if (metricLower.includes('scottish national') || metricLower.includes('snp')) {
    return '#FDF38E'; // SNP yellow
  }
  if (metricLower.includes('plaid cymru')) {
    return '#3F8428'; // Plaid Cymru green
  }
  
  // Default color palette for other metrics
  const defaultColors = [
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Green
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F97316', // Orange
  ];
  
  // Use a simple hash to consistently assign colors
  let hash = 0;
  for (let i = 0; i < metric.length; i++) {
    hash = metric.charCodeAt(i) + ((hash << 5) - hash);
  }
  return defaultColors[Math.abs(hash) % defaultColors.length];
}

/**
 * Generate a chart image natively using Chart.js and node-canvas
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

  // Create color palette based on theme color
  const generateColorPalette = (baseColor: string, count: number): string[] => {
    const colors = [
      baseColor || '#3B82F6',
      '#A855F7',
      '#10B981',
      '#F97316',
      '#EF4444',
      '#EC4899',
      '#14B8A6',
      '#EAB308',
    ];
    return colors.slice(0, count);
  };

  // Chart dimensions
  const width = 800;
  const height = 600;

  // Create Chart.js configuration
  let chartConfig: ChartConfiguration;

  if (chartType === 'bar') {
    // Generate individual colors for each bar based on metric names
    const backgroundColors = labels.map(metric => getMetricColor(metric));
    const borderColors = backgroundColors.map(color => color);
    
    chartConfig = {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: title,
          data: values,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: toTitleCase(title),
            font: {
              size: 18,
              weight: 'bold',
              family: 'Arial, sans-serif',
            },
            padding: 20,
            color: '#000000',
          },
          legend: {
            display: false,
          },
        },
        scales: {
          x: {
            ticks: {
              font: {
                size: 12,
                family: 'Arial, sans-serif',
              },
              color: '#000000',
            },
            grid: {
              color: '#E5E7EB',
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
              font: {
                size: 12,
                family: 'Arial, sans-serif',
              },
              color: '#000000',
            },
            grid: {
              color: '#E5E7EB',
            },
          },
        },
      },
    };
  } else if (chartType === 'line') {
    chartConfig = {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: title,
          data: values,
          borderColor: themeColor || '#3B82F6',
          backgroundColor: themeColor ? `${themeColor}33` : '#3B82F633',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: toTitleCase(title),
            font: {
              size: 18,
              weight: 'bold',
            },
            padding: 20,
          },
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
            },
          },
        },
      },
    };
  } else if (chartType === 'pie' || chartType === 'doughnut') {
    const colorPalette = generateColorPalette(themeColor, metrics.length);
    chartConfig = {
      type: chartType as 'pie' | 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colorPalette,
          borderColor: '#ffffff',
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: toTitleCase(title),
            font: {
              size: 18,
              weight: 'bold',
            },
            padding: 20,
          },
          legend: {
            display: true,
            position: 'right',
            labels: {
              padding: 15,
              font: {
                size: 12,
              },
            },
          },
        },
      },
    };
  } else {
    // Default to bar chart
    chartConfig = {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: title,
          data: values,
          backgroundColor: themeColor || '#3B82F6',
          borderColor: themeColor || '#3B82F6',
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: toTitleCase(title),
            font: {
              size: 18,
              weight: 'bold',
            },
            padding: 20,
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
    };
  }

  // Create Chart.js Node Canvas instance with font configuration
  const chartJSNodeCanvas = new ChartJSNodeCanvas({
    width,
    height,
    backgroundColour: 'white',
    plugins: {
      globalVariableLegacy: ['chartjs-adapter-date-fns'],
    },
    // Configure fonts - use system fonts that are available
    chartCallback: (ChartJS) => {
      ChartJS.defaults.font.family = 'Arial, sans-serif';
      ChartJS.defaults.font.size = 12;
    },
  });

  // Render chart to buffer
  const buffer = await chartJSNodeCanvas.renderToBuffer(chartConfig);
  return buffer;
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
            // Filter out events without data
            const eventsWithData = events.filter((event: ChartEvent) => !event.dataUnavailable);
            
            for (let i = 0; i < eventsWithData.length; i++) {
              const event = eventsWithData[i];
              
              try {
                // Generate chart image
                const chartTitle = toTitleCase(event.title || timelineName || 'Chart');
                const chartBuffer = await generateChartImage(
                  metrics,
                  event.data,
                  chartType,
                  themeColor,
                  chartTitle
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
                    total: eventsWithData.length,
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
            const eventsWithData = events.filter((event: ChartEvent) => !event.dataUnavailable);
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'complete',
                completed: eventsWithData.length,
                total: eventsWithData.length,
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
      // Filter out events without data
      const eventsWithData = events.filter((event: ChartEvent) => !event.dataUnavailable);
      
      const chartResults = await Promise.all(
        eventsWithData.map(async (event: ChartEvent, index: number) => {
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
        total: eventsWithData.length,
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

