'use client';

import { useState } from 'react';

type GeneratedEvent = {
  title: string;
  year?: number;
  description?: string;
  prompt?: string;
  imageUrl?: string | null;
};

type Step =
  | 'idle'
  | 'generatingDescription'
  | 'generatingStyleReference'
  | 'generatingEvents'
  | 'generatingEventDescriptions'
  | 'generatingImages'
  | 'done';

// ENDPOINTS: adjust if your API routes differ.
// 1) suggest timeline description
const SUGGEST_DESCRIPTION_ENDPOINT = '/api/ai/suggest-timeline-descriptions';
// 2) generate events
const EVENTS_ENDPOINT = '/api/ai/generate-events';
// 3) event descriptions/prompts (requires events + timelineDescription)
const EVENT_DESCRIPTIONS_ENDPOINT = '/api/ai/generate-descriptions-v2';
// 4) images
const IMAGE_ENDPOINT = '/api/ai/generate-images';

export default function AbridgedFlowPage() {
  const [title, setTitle] = useState('');
  const [timelineDescription, setTimelineDescription] = useState('');
  const [styleReferenceUrl, setStyleReferenceUrl] = useState('');
  const [events, setEvents] = useState<GeneratedEvent[]>([]);
  const [step, setStep] = useState<Step>('idle');
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const appendLog = (msg: string) => setLog(prev => [...prev, msg]);

  async function runFlow() {
    setError(null);
    setLog([]);
    setTimelineDescription('');
    setStyleReferenceUrl('');
    setEvents([]);
    setStep('idle');

    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    setLoading(true);
    try {
      // 1) Description suggestion (pick first)
      setStep('generatingDescription');
      appendLog('Generating timeline description (suggestions)...');
      const descRes = await fetch(SUGGEST_DESCRIPTION_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectName: title,
        }),
      });
      if (!descRes.ok) throw new Error(`Description failed (${descRes.status})`);
      const descData = await descRes.json();
      const suggestions: string[] =
        descData?.suggestions ||
        descData?.data?.suggestions ||
        descData?.result?.suggestions ||
        [];
      const generatedDescription = suggestions[0] || '';
      if (!generatedDescription) throw new Error('No description suggestion returned');
      setTimelineDescription(generatedDescription);
      appendLog('Description generated.');

      // 2) Style Reference Image (NEW: generate visual anchor)
      setStep('generatingStyleReference');
      appendLog('Generating style reference image...');
      const styleRefRes = await fetch(IMAGE_ENDPOINT + '?abridged=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-abridged-flow': 'true',
        },
        body: JSON.stringify({
          title: title,
          style: 'Illustration',
          narrativeStyle: 'Narration',
          events: [{
            title: 'Visual Style Reference',
            description: `A pure style reference image capturing the visual aesthetic for: ${generatedDescription}`,
            imagePrompt: `Illustration style: Bright reds & blues on white, golden theatre wings, lean athletic silhouette in practice wear, low-angle 28mm lens. Warm backstage theatrical lighting, centered composition, documentary photography style, soft even lighting, neutral background.`,
          }],
        }),
      });
      if (!styleRefRes.ok) throw new Error(`Style reference failed (${styleRefRes.status})`);
      const styleRefData = await styleRefRes.json();
      const styleUrl = styleRefData?.images?.[0]?.url || styleRefData?.images?.[0] || '';
      if (!styleUrl) throw new Error('No style reference URL returned');
      setStyleReferenceUrl(styleUrl);
      appendLog(`Style reference generated: ${styleUrl.substring(0, 50)}...`);

      // 3) Events
      setStep('generatingEvents');
      appendLog('Generating 10 events...');
      const eventsRes = await fetch(EVENTS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timelineDescription: generatedDescription,
          timelineName: title,
          maxEvents: 10,
          isFactual: true,
        }),
      });
      if (!eventsRes.ok) throw new Error(`Events failed (${eventsRes.status})`);
      const eventsData = await eventsRes.json();
      const generatedEvents: GeneratedEvent[] =
        eventsData?.events ||
        eventsData?.data?.events ||
        eventsData?.result?.events ||
        [];
      setEvents(generatedEvents);
      appendLog(`Events generated: ${generatedEvents.length}`);

      // 4) Event descriptions/prompts
      setStep('generatingEventDescriptions');
      appendLog('Generating event descriptions/prompts...');
      const eventDescRes = await fetch(EVENT_DESCRIPTIONS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: generatedEvents.map(e => ({ title: e.title, year: e.year })),
          timelineDescription: generatedDescription,
          writingStyle: 'narrative', // matches API default
          imageStyle: 'Illustration',
        }),
      });
      if (!eventDescRes.ok)
        throw new Error(`Event descriptions failed (${eventDescRes.status})`);
      const eventDescData = await eventDescRes.json();
      const enrichedEvents: GeneratedEvent[] = generatedEvents.map((e, idx) => ({
        ...e,
        description:
          eventDescData?.descriptions?.[idx] ||
          eventDescData?.data?.descriptions?.[idx] ||
          e.description,
        prompt:
          eventDescData?.imagePrompts?.[idx] ||
          eventDescData?.prompts?.[idx] ||
          eventDescData?.data?.imagePrompts?.[idx] ||
          eventDescData?.data?.prompts?.[idx] ||
          e.prompt,
      }));
      setEvents(enrichedEvents);
      appendLog('Event descriptions/prompts generated.');

      // 5) Images (with style reference)
      setStep('generatingImages');
      appendLog('Generating images with style reference...');
      const imageRes = await fetch(IMAGE_ENDPOINT + '?abridged=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-abridged-flow': 'true',
        },
        body: JSON.stringify({
          title,
          style: 'Illustration',
          narrativeStyle: 'Narration',
          styleReferenceUrl: styleUrl, // NEW: pass style reference
          events: enrichedEvents.map(e => ({
            title: e.title,
            description: e.description,
            imagePrompt: e.prompt,
          })),
        }),
      });
      if (!imageRes.ok) throw new Error(`Images failed (${imageRes.status})`);
      const imageData = await imageRes.json();
      const outputs: string[] =
        imageData?.images ||
        imageData?.data?.images ||
        imageData?.result?.images ||
        [];
      const finalEvents = enrichedEvents.map((e, idx) => ({
        ...e,
        imageUrl: outputs[idx] || null,
      }));
      setEvents(finalEvents);
      appendLog('Images generated.');

      setStep('done');
    } catch (err: any) {
      setError(err?.message || 'Unexpected error');
      appendLog(`Error: ${err?.message || 'Unexpected error'}`);
      setStep('idle');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-2xl font-semibold">Abridged Flow (Title → Description → Events → Prompts → Images)</h1>
      <p className="text-sm text-gray-600">
        Uses illustration image style and narration narrative style. No auth required. Adjust endpoints in the code if your routes differ.
      </p>

      <div className="space-y-3">
        <label className="block text-sm font-medium">Timeline Title</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g., King Charles III recent milestones"
        />
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
          onClick={runFlow}
          disabled={loading}
        >
          {loading ? 'Running...' : 'Run abridged flow'}
        </button>
      </div>

      {error && <div className="text-red-600 text-sm">Error: {error}</div>}

      <div className="space-y-2">
        <div className="text-sm font-semibold">Step: {step}</div>
        <pre className="bg-gray-100 text-xs p-3 rounded max-h-48 overflow-auto">
{log.join('\n')}
        </pre>
      </div>

      {timelineDescription && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Timeline Description</h2>
          <p className="text-sm whitespace-pre-wrap">{timelineDescription}</p>
        </section>
      )}

      {styleReferenceUrl && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Style Reference Image</h2>
          <p className="text-xs text-gray-600">This image defines the visual style for all event images (composition, lighting, colors)</p>
          <img
            src={styleReferenceUrl}
            alt="Style Reference"
            className="w-full max-w-md h-auto rounded border"
          />
        </section>
      )}

      {events.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Events (10)</h2>
          <div className="space-y-3">
            {events.map((ev, idx) => (
              <div key={idx} className="border rounded p-3 space-y-1">
                <div className="font-semibold">{ev.title}</div>
                {ev.description && (
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {ev.description}
                  </div>
                )}
                {ev.prompt && (
                  <div className="text-xs text-gray-600 whitespace-pre-wrap">
                    <strong>Prompt:</strong> {ev.prompt}
                  </div>
                )}
                {ev.imageUrl && (
                  <div className="mt-2">
                    <img
                      src={ev.imageUrl}
                      alt={ev.title}
                      className="w-full h-auto rounded border"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

