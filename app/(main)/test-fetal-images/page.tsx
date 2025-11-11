'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EventWithPrompt {
  title: string;
  description: string;
  imageUrl: string | null;
  prompt: string;
  year: number;
}

export default function TestFetalImagesPage() {
  const [events, setEvents] = useState<EventWithPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [timelineId, setTimelineId] = useState<string | null>(null);

  useEffect(() => {
    // Try to load from JSON file first (from script output)
    async function loadData() {
      try {
        // Try to fetch from the JSON file created by the script
        const jsonResponse = await fetch('/fetal-timeline-data.json');
        if (jsonResponse.ok) {
          const data = await jsonResponse.json();
          setTimelineId(data.timelineId);
          setEvents(data.events.map((e: any) => ({
            title: e.title,
            description: e.description || '',
            imageUrl: e.imageUrl || null,
            prompt: e.promptFromStep4 || e.promptFromStep3 || e.prompt || 'Prompt not available',
            year: e.year,
          })));
          setLoading(false);
          return;
        }
      } catch (error) {
        console.log('JSON file not found, trying API...');
      }

      // Fallback to API
      try {
        const response = await fetch('/api/timelines?q=Fetal Development');
        const timelines = await response.json();
        
        const fetalTimeline = timelines.find((t: any) => 
          t.title?.toLowerCase().includes('fetal development')
        );

        if (fetalTimeline) {
          setTimelineId(fetalTimeline.id);
          
          const eventsResponse = await fetch(`/api/timelines/${fetalTimeline.id}/events`);
          const eventsData = await eventsResponse.json();
          
          setEvents(eventsData.map((e: any) => ({
            title: e.title,
            description: e.description || '',
            imageUrl: e.image_url || e.imageUrl || null,
            prompt: 'Prompt not stored in database - check script output',
            year: new Date(e.date).getFullYear(),
          })));
        }
      } catch (error) {
        console.error('Error fetching timeline:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-4">Loading Fetal Development Timeline...</h1>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-4">Fetal Development Timeline Test</h1>
        <p className="text-muted-foreground">No timeline found. Please run the creation script first.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Fetal Development Timeline - Image & Prompt Test</h1>
        <p className="text-muted-foreground mb-4">
          Timeline ID: {timelineId}
        </p>
        <Badge variant="outline" className="mb-4">
          {events.filter(e => e.imageUrl).length} / {events.length} images generated
        </Badge>
      </div>

      <div className="grid gap-6">
        {events.map((event, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">
                    {index + 1}. {event.title}
                  </CardTitle>
                  <CardDescription className="text-sm mb-2">
                    Year: {event.year}
                  </CardDescription>
                  {event.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {event.description}
                    </p>
                  )}
                </div>
                <Badge variant={event.imageUrl ? "default" : "destructive"}>
                  {event.imageUrl ? "Has Image" : "No Image"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {/* Image */}
                <div>
                  <h3 className="font-semibold mb-2">Generated Image</h3>
                  {event.imageUrl ? (
                    <div className="border rounded-lg overflow-hidden">
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-full h-auto"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-image.png';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="border rounded-lg p-8 text-center text-muted-foreground bg-muted">
                      No image generated
                    </div>
                  )}
                </div>

                {/* Prompt */}
                <div>
                  <h3 className="font-semibold mb-2">Image Prompt</h3>
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <pre className="text-xs whitespace-pre-wrap font-mono">
                      {event.prompt || 'Prompt not available'}
                    </pre>
                  </div>
                  {event.prompt && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Length: {event.prompt.length} characters
                      {event.prompt.includes('PERSON MATCHING') || 
                       event.prompt.includes('hair color') || 
                       event.prompt.includes('skin tone') ? (
                        <span className="text-red-500 ml-2">⚠️ Contains person matching</span>
                      ) : (
                        <span className="text-green-500 ml-2">✅ No person matching</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

