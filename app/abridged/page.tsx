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

// Illustration sub-styles with visual example thumbnails
// Each sub-style includes a specific visual modifier to ensure consistency
const ILLUSTRATION_STYLES = [
  { 
    id: 'Watercolor illustration', 
    name: 'Watercolor', 
    description: 'Soft, flowing watercolor with visible brush strokes',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48ZmlsdGVyIGlkPSJ3YXRlcmNvbG9yIj48ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSIyIi8+PGZlQ29tcG9uZW50VHJhbnNmZXI+PGZlRnVuY1IgdHlwZT0iZGlzY3JldGUiIHRhYmxlVmFsdWVzPSIwIDAuNSAxIi8+PC9mZUNvbXBvbmVudFRyYW5zZmVyPjwvZmlsdGVyPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y4ZjlmYSIvPjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjIwIiBmaWxsPSIjOTNjNWZkIiBvcGFjaXR5PSIwLjciIGZpbHRlcj0idXJsKCN3YXRlcmNvbG9yKSIvPjxjaXJjbGUgY3g9IjcwIiBjeT0iNTAiIHI9IjI1IiBmaWxsPSIjZmNhNWExIiBvcGFjaXR5PSIwLjYiIGZpbHRlcj0idXJsKCN3YXRlcmNvbG9yKSIvPjxjaXJjbGUgY3g9IjQ1IiBjeT0iNzAiIHI9IjE4IiBmaWxsPSIjZmZkNmE1IiBvcGFjaXR5PSIwLjgiIGZpbHRlcj0idXJsKCN3YXRlcmNvbG9yKSIvPjwvc3ZnPg=='
  },
  { 
    id: 'Line art illustration', 
    name: 'Line Art', 
    description: 'Clean pen and ink line drawings with minimal shading',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZmZmZmZiIvPjxwYXRoIGQ9Ik0yMCA1MCBRIDQwIDIwLCA2MCA1MCBUIDEwMCA1MCIgc3Ryb2tlPSIjMjEyMTIxIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz48Y2lyY2xlIGN4PSIzMCIgY3k9IjYwIiByPSIxNSIgc3Ryb2tlPSIjMjEyMTIxIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz48cG9seWdvbiBwb2ludHM9IjYwLDI1IDc1LDM1IDcwLDUwIDgwLDYwIDY1LDY1IDYwLDgwIDU1LDY1IDQwLDYwIDUwLDUwIDQ1LDM1IiBzdHJva2U9IiMyMTIxMjEiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPjwvc3ZnPg=='
  },
  { 
    id: 'Comic book illustration', 
    name: 'Comic Book', 
    description: 'Bold outlines with halftone dots and vibrant colors',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZG90cyIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjgiIGhlaWdodD0iOCI+PGNpcmNsZSBjeD0iNCIgY3k9IjQiIHI9IjEuNSIgZmlsbD0iIzAwMCIgb3BhY2l0eT0iMC4yIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZmZGUwMCIvPjxwb2x5Z29uIHBvaW50cz0iMjAsMzAgNTAsMTUgODAsMzAgNzAsNzAgMzAsNzAiIGZpbGw9IiNmZjAwMDAiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIzIi8+PHJlY3QgeD0iMjAiIHk9IjMwIiB3aWR0aD0iNTAiIGhlaWdodD0iNDAiIGZpbGw9InVybCgjZG90cykiLz48dGV4dCB4PSI1MCIgeT0iNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCBCbGFjaywgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMwMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPiohPC90ZXh0Pjwvc3ZnPg=='
  },
  { 
    id: 'Vintage poster illustration', 
    name: 'Vintage Poster', 
    description: 'Retro 1940s-50s propaganda poster style',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9InZpbnRhZ2UiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZmY2YjM1O3N0b3Atb3BhY2l0eToxIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZjBhYjAwO3N0b3Atb3BhY2l0eToxIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmZmY4ZTEiLz48cmVjdCB4PSIxMCIgeT0iMTAiIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgZmlsbD0idXJsKCN2aW50YWdlKSIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iMzUiIHI9IjEyIiBmaWxsPSIjZmZmIi8+PHBvbHlnb24gcG9pbnRzPSI1MCw0NSA0MCw3NSA2MCw3NSIgZmlsbD0iI2ZmZiIvPjxyZWN0IHg9IjM1IiB5PSI1MCIgd2lkdGg9IjMwIiBoZWlnaHQ9IjgiIGZpbGw9IiNmZmYiLz48dGV4dCB4PSI1MCIgeT0iOTAiIGZvbnQtZmFtaWx5PSJBcmlhbCBCbGFjaywgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMyOTE0MDUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPjE5NDU8L3RleHQ+PC9zdmc+'
  },
  { 
    id: 'Minimalist flat illustration', 
    name: 'Minimalist', 
    description: 'Simple geometric shapes with flat colors',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YwZjBmMCIvPjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjE1IiBmaWxsPSIjMDA3YWZmIi8+PHJlY3QgeD0iNTUiIHk9IjE1IiB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIGZpbGw9IiNmZjRhNGEiLz48cG9seWdvbiBwb2ludHM9IjUwLDY1IDM1LDg1IDY1LDg1IiBmaWxsPSIjZmZiZDQ0Ii8+PC9zdmc+'
  },
  { 
    id: 'Digital painting illustration', 
    name: 'Digital Painting', 
    description: 'Modern digital art with painterly textures',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImRpZ2l0YWwiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM2NjY3YWI7c3RvcC1vcGFjaXR5OjEiLz48c3RvcCBvZmZzZXQ9IjUwJSIgc3R5bGU9InN0b3AtY29sb3I6I2QwNTI4ZDtzdG9wLW9wYWNpdHk6MSIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6I2ZmOGMyNjtzdG9wLW9wYWNpdHk6MSIvPjwvbGluZWFyR3JhZGllbnQ+PGZpbHRlciBpZD0iYnJ1c2giPjxmZVR1cmJ1bGVuY2UgdHlwZT0iZnJhY3RhbE5vaXNlIiBiYXNlRnJlcXVlbmN5PSIwLjgiIG51bU9jdGF2ZXM9IjQiLz48ZmVDb2xvck1hdHJpeCB0eXBlPSJzYXR1cmF0ZSIgdmFsdWVzPSIwLjMiLz48L2ZpbHRlcj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9InVybCgjZGlnaXRhbCkiLz48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZmZiIgb3BhY2l0eT0iMC4yIiBmaWx0ZXI9InVybCgjYnJ1c2gpIi8+PGVsbGlwc2UgY3g9IjUwIiBjeT0iNTAiIHJ4PSIzMCIgcnk9IjQwIiBmaWxsPSIjZmZmIiBvcGFjaXR5PSIwLjMiLz48L3N2Zz4='
  },
  { 
    id: 'Anime style illustration', 
    name: 'Anime', 
    description: 'Japanese anime/manga art style',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZmZjRlNiIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjI1IiBmaWxsPSIjZmZkYmU0IiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMiIvPjxlbGxpcHNlIGN4PSI0MCIgY3k9IjM4IiByeD0iNiIgcnk9IjEwIiBmaWxsPSIjMDAwIi8+PGVsbGlwc2UgY3g9IjYwIiBjeT0iMzgiIHJ4PSI2IiByeT0iMTAiIGZpbGw9IiMwMDAiLz48ZWxsaXBzZSBjeD0iNDIiIGN5PSIzNiIgcng9IjIiIHJ5PSIzIiBmaWxsPSIjZmZmIi8+PGVsbGlwc2UgY3g9IjYyIiBjeT0iMzYiIHJ4PSIyIiByeT0iMyIgZmlsbD0iI2ZmZiIvPjxwYXRoIGQ9Ik00MCA0OCBRIDUwIDUyLCA2MCA0OCIgc3Ryb2tlPSIjZmY2OWI0IiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz48cGF0aCBkPSJNMjUgMzAgUSAyMCAyMCwgMzAgMTUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIzIiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTc1IDMwIFEgODAgMjAsIDcwIDE1IiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMyIgZmlsbD0ibm9uZSIvPjwvc3ZnPg=='
  },
  { 
    id: 'Woodcut print illustration', 
    name: 'Woodcut', 
    description: 'Traditional woodblock print with bold black lines',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0id29vZCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQiIGhlaWdodD0iNCIgcGF0dGVyblRyYW5zZm9ybT0icm90YXRlKDQ1KSI+PGxpbmUgeDE9IjAiIHkxPSIwIiB4Mj0iMCIgeTI9IjQiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y1ZTZkMyIvPjxwYXRoIGQ9Ik0yMCA1MCBRIDUwIDIwLCA4MCA1MCBRIDUwIDgwLCAyMCA1MCBaIiBmaWxsPSJ1cmwoI3dvb2QpIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iNCIvPjxwYXRoIGQ9Ik0zNSA0NSBMIDQwIDM1IEwgNDUgNDUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIzIiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTU1IDQ1IEwgNjAgMzUgTCA2NSA0NSIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjMiIGZpbGw9Im5vbmUiLz48cGF0aCBkPSJNNDAgNTUgUSA1MCA2MCwgNjAgNTUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIzIiBmaWxsPSJub25lIi8+PC9zdmc+'
  },
  { 
    id: 'Soft pastel illustration', 
    name: 'Soft Pastel', 
    description: 'Dreamy pastel chalk art with soft edges',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48ZmlsdGVyIGlkPSJwYXN0ZWwiPjxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249IjMiLz48L2ZpbHRlcj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmZmY1ZjgiLz48ZWxsaXBzZSBjeD0iMzAiIGN5PSIzNSIgcng9IjI1IiByeT0iMjAiIGZpbGw9IiNmZmNkZDIiIG9wYWNpdHk9IjAuOCIgZmlsdGVyPSJ1cmwoI3Bhc3RlbCkiLz48ZWxsaXBzZSBjeD0iNjUiIGN5PSI0NSIgcng9IjMwIiByeT0iMjUiIGZpbGw9IiNjN2QyZmUiIG9wYWNpdHk9IjAuNyIgZmlsdGVyPSJ1cmwoI3Bhc3RlbCkiLz48ZWxsaXBzZSBjeD0iNDUiIGN5PSI3MCIgcng9IjI4IiByeT0iMjAiIGZpbGw9IiNmZmU0YzQiIG9wYWNpdHk9IjAuNyIgZmlsdGVyPSJ1cmwoI3Bhc3RlbCkiLz48L3N2Zz4='
  },
  { 
    id: 'Ink wash illustration', 
    name: 'Ink Wash', 
    description: 'Traditional East Asian ink wash painting',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cmFkaWFsR3JhZGllbnQgaWQ9Imlua3dhc2giPjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMwMDA7c3RvcC1vcGFjaXR5OjAuOSIvPjxzdG9wIG9mZnNldD0iNzAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMDAwO3N0b3Atb3BhY2l0eTowLjMiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMwMDA7c3RvcC1vcGFjaXR5OjAiLz48L3JhZGlhbEdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YyZjBkZiIvPjxwYXRoIGQ9Ik0yMCA4MCBRIDMwIDIwLCA1MCAzMCBRIDcwIDQwLCA4MCAyMCIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjMiIGZpbGw9Im5vbmUiIG9wYWNpdHk9IjAuNyIvPjxjaXJjbGUgY3g9IjY1IiBjeT0iNjAiIHI9IjI1IiBmaWxsPSJ1cmwoI2lua3dhc2gpIi8+PGNpcmNsZSBjeD0iMzUiIGN5PSI1NSIgcj0iMTUiIGZpbGw9InVybCgjaW5rd2FzaCkiLz48L3N2Zz4='
  },
];

export default function AbridgedFlowPage() {
  const [title, setTitle] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Watercolor illustration'); // Default to Watercolor illustration
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
      appendLog(`Starting flow with "${selectedStyle}" style...`);
      
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
          imageStyle: selectedStyle,
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
          style: selectedStyle,
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
        Tests: Title → Illustration Sub-Style → Description → Events → Prompts → Images (with Google Imagen 4 Fast for face references)
      </p>
      <p className="text-xs text-gray-500 mt-1">
        Choose from 10 illustration sub-styles to ensure visual consistency across all timeline images
      </p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Timeline Title</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g., Tom Holland career highlights"
          />
        </div>

        {/* Style Selector */}
        <div>
          <label className="block text-sm font-medium mb-3">Choose Illustration Sub-Style</label>
          <div className="grid grid-cols-5 gap-3">
            {ILLUSTRATION_STYLES.map(style => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                disabled={loading}
                className={`
                  flex flex-col items-center justify-start p-2 rounded-lg border-2 transition-all overflow-hidden
                  ${selectedStyle === style.id
                    ? 'border-blue-600 bg-blue-50 shadow-md ring-2 ring-blue-300'
                    : 'border-gray-200 bg-white hover:border-gray-400 hover:shadow'
                  }
                  ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                title={style.description}
              >
                <div className="w-full h-20 mb-2 rounded overflow-hidden bg-gray-50">
                  <img 
                    src={style.thumbnail} 
                    alt={style.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className={`text-xs font-medium text-center ${
                  selectedStyle === style.id ? 'text-blue-700' : 'text-gray-700'
                }`}>
                  {style.name}
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Selected: <span className="font-semibold">{ILLUSTRATION_STYLES.find(s => s.id === selectedStyle)?.name}</span> - {ILLUSTRATION_STYLES.find(s => s.id === selectedStyle)?.description}
          </p>
          <p className="text-xs text-gray-400 mt-1 italic">
            All timeline images will use the same illustration sub-style for consistency
          </p>
        </div>

        <button
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg disabled:opacity-60 hover:bg-blue-700 transition font-medium"
          onClick={runFlow}
          disabled={loading}
        >
          {loading ? '⏳ Running...' : '▶️ Run Flow with ' + ILLUSTRATION_STYLES.find(s => s.id === selectedStyle)?.name}
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

