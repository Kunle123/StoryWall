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

      // 2) Events
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

      // 3) Event descriptions/prompts
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

      // 4) Images (with face reference from Wikimedia)
      setStep('generatingImages');
      appendLog('Generating images with face likeness...');
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

  // Progress calculation
  const steps = ['idle', 'generatingDescription', 'generatingEvents', 'generatingEventDescriptions', 'generatingImages', 'done'];
  const currentStepIndex = steps.indexOf(step);
  const progressPercentage = step === 'idle' ? 0 : Math.round((currentStepIndex / (steps.length - 1)) * 100);

  const stepLabels: Record<Step, string> = {
    idle: 'Ready',
    generatingDescription: '1. Generating Description',
    generatingEvents: '2. Generating Events',
    generatingEventDescriptions: '3. Generating Descriptions & Prompts',
    generatingImages: '4. Generating Images',
    done: '✓ Complete',
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-2xl font-semibold">Abridged Flow Test Page</h1>
      <p className="text-sm text-gray-600">
        Tests: Title → Description → Events → Prompts → Images (with Google Imagen 4 Fast for face references)
      </p>

      <div className="space-y-3">
        <label className="block text-sm font-medium">Timeline Title</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g., Tom Holland career highlights"
        />
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60 hover:bg-blue-700 transition"
          onClick={runFlow}
          disabled={loading}
        >
          {loading ? '⏳ Running...' : '▶️ Run Flow'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Progress Bar */}
      {loading && (
        <div className="space-y-3 bg-blue-50 border border-blue-200 p-4 rounded">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-blue-900">{stepLabels[step]}</span>
            <span className="text-blue-700">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          {/* Step Indicators */}
          <div className="flex justify-between text-xs text-gray-600 mt-2">
            {steps.slice(1, -1).map((s, idx) => (
              <div 
                key={s}
                className={`flex flex-col items-center ${
                  currentStepIndex > idx + 1 
                    ? 'text-green-600 font-semibold' 
                    : currentStepIndex === idx + 1 
                    ? 'text-blue-600 font-semibold' 
                    : 'text-gray-400'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${
                  currentStepIndex > idx + 1 
                    ? 'bg-green-100 border-2 border-green-600' 
                    : currentStepIndex === idx + 1 
                    ? 'bg-blue-100 border-2 border-blue-600 animate-pulse' 
                    : 'bg-gray-100 border-2 border-gray-300'
                }`}>
                  {currentStepIndex > idx + 1 ? '✓' : idx + 1}
                </div>
                <span className="text-center w-16">{['Desc', 'Events', 'Prompts', 'Images'][idx]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log Output */}
      {log.length > 0 && (
        <details className="space-y-2">
          <summary className="text-sm font-semibold cursor-pointer hover:text-blue-600">
            📋 Detailed Log ({log.length} entries)
          </summary>
          <pre className="bg-gray-100 text-xs p-3 rounded max-h-64 overflow-auto border">
{log.join('\n')}
          </pre>
        </details>
      )}

      {/* Results */}
      {timelineDescription && (
        <section className="space-y-2 bg-green-50 border border-green-200 p-4 rounded">
          <h2 className="text-lg font-semibold text-green-900 flex items-center gap-2">
            ✓ Timeline Description
          </h2>
          <p className="text-sm whitespace-pre-wrap text-gray-700">{timelineDescription}</p>
        </section>
      )}

      {events.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            {step === 'done' ? '✓' : '⏳'} Events & Images 
            <span className="text-sm font-normal text-gray-600">
              ({events.filter(e => e.imageUrl).length}/{events.length} images)
            </span>
          </h2>
          <div className="space-y-3">
            {events.map((ev, idx) => (
              <div 
                key={idx} 
                className={`border rounded p-4 space-y-2 transition ${
                  ev.imageUrl 
                    ? 'bg-green-50 border-green-200' 
                    : ev.description 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xs font-mono text-gray-500 mt-1">#{idx + 1}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{ev.title}</div>
                    {ev.year && <div className="text-xs text-gray-500">{ev.year}</div>}
                  </div>
                  {ev.imageUrl && (
                    <span className="text-green-600 text-xl">✓</span>
                  )}
                  {!ev.imageUrl && ev.description && (
                    <span className="text-blue-600 text-xl animate-pulse">⏳</span>
                  )}
                </div>
                
                {ev.description && (
                  <div className="text-sm text-gray-700 whitespace-pre-wrap pl-8">
                    {ev.description}
                  </div>
                )}
                
                {ev.prompt && (
                  <details className="pl-8">
                    <summary className="text-xs text-gray-600 cursor-pointer hover:text-blue-600">
                      View Image Prompt
                    </summary>
                    <div className="text-xs text-gray-600 whitespace-pre-wrap mt-1 bg-white p-2 rounded border">
                      {ev.prompt}
                    </div>
                  </details>
                )}
                
                {ev.imageUrl && (
                  <div className="mt-2 pl-8">
                    <img
                      src={ev.imageUrl}
                      alt={ev.title}
                      className="w-full h-auto rounded border shadow-sm hover:shadow-md transition"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Completion Summary */}
      {step === 'done' && (
        <div className="bg-green-100 border-2 border-green-500 p-4 rounded text-center">
          <div className="text-2xl mb-2">🎉</div>
          <div className="font-semibold text-green-900">Flow Complete!</div>
          <div className="text-sm text-green-700 mt-1">
            Generated {events.filter(e => e.imageUrl).length} images using Google Imagen 4 Fast
          </div>
        </div>
      )}
    </main>
  );
}

