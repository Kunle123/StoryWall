/**
 * Editorial image prompt architecture for Storywall timelines.
 * Used by enrichment (Step 3) instructions and image generation assembly.
 */

export const BEAT_IMAGE_MODES = [
  'scene',
  'symbolic_object',
  'crowd_reaction',
  'system_environment',
  'media_framing',
  'workspace',
  'performance',
  'victory_moment',
] as const;

export type BeatImageMode = (typeof BEAT_IMAGE_MODES)[number];

/** Short mode-specific guidance the LLM should apply under IMAGE TYPE */
export const IMAGE_MODE_GUIDANCE: Record<string, string> = {
  scene:
    'Show a specific moment in a real place; environment and action carry the story.',
  symbolic_object:
    'Focus on one meaningful object or small cluster of objects standing in for the wider event. Avoid full crowd scenes; use environmental detail to imply the larger story.',
  crowd_reaction:
    'Collective response is the subject, not a posed leader portrait. Faces, gestures, phones, screens, and body language show the emotional turn.',
  system_environment:
    'Institutions, infrastructure, offices, maps, or large systems—scale and context matter.',
  media_framing:
    'Show mediation through screens, headlines, cameras, or public framing. Make the gap between reality and representation visible.',
  workspace:
    'Studio, office, lab, or workshop—tools, surfaces, and spatial density communicate creative or professional work.',
  performance:
    'Stage or public performance; energy of the moment and setting over paperwork.',
  victory_moment:
    'Ceremony, podium, or culmination—stronger centering is acceptable when the beat demands an iconic read.',
};

/** Appended for Illustration / editorial paths in the image API (replaces “storybook” language). */
export const STORYWALL_EDITORIAL_STYLE =
  'Storywall house style: editorial illustration, not propaganda poster; clear focal hierarchy; rich texture; strong sense of place; visually readable at small size; consistent linework and treatment across the series; documentary realism with restrained stylization — not decorative storybook prettiness';

/**
 * Layer 1 — prepended once per image API call (not repeated in Step 3 per-beat JSON).
 * ~80–120 words: house rules + exclusions so enrichment can omit duplicated boilerplate.
 */
export const STORYWALL_GLOBAL_IMAGE_BLOCK = `STORYWALL GLOBAL (same for every image in this timeline):
Single-image editorial illustration for a visual timeline. Editorial, documentary-feeling, rich texture, restrained stylization, readable at small size; clear focal hierarchy; strong sense of place; not a propaganda poster or decorative storybook look.
No text, logos, labels, captions, watermarks, or UI. No collage, split-screen, multi-panel, infographic layout, or image grid. No invented readable headlines or documents. Avoid anachronistic props for the stated period and place. Prefer natural asymmetry, depth, and scene tension unless the beat is ceremonial or iconic.
Do not invent specific campaign banners, bill names, legislation titles, joint-branding, or ceremonial details unless grounded in the event. Prefer documentary restraint over vivid fiction.`;

/** Layer 3 — optional continuity; sent once per request alongside global + anchor + beat brief. */
export const DEFAULT_IMAGE_SERIES_CONTINUITY =
  'Keep the same illustration treatment across the series, but vary composition, shot scale, and mood by beat so each frame feels distinct.';

/** Use layered global block + continuity for typical Storywall illustration timelines. */
export function shouldLayerStorywallGlobal(imageStyle: string, anchorStyle?: string | null): boolean {
  if (anchorStyle?.trim()) return true;
  return /illustration|watercolor|sketch|cartoon|minimalist|vintage|artistic|hand-?drawn|ink|linework/i.test(
    imageStyle || ''
  );
}

/** When a named person should be recognizable (omitLikenessReference false). */
export const LIKENESS_REQUIRED_BLOCK = `LIKENESS REQUIRED:
Depict a recognizable likeness of the named subject, consistent with verified public appearance for this period. Preserve key facial structure, hairstyle, age band, and typical presentation where documented. When the subject is a real public figure, the image prompt MUST explicitly state their race/ethnicity and gender (e.g. "a Black man", "a White woman") — do not rely on name alone. Do not substitute a generic lookalike.`;

/** When faces are not the point (omitLikenessReference true). */
export const LIKENESS_NOT_REQUIRED_BLOCK = `LIKENESS NOT REQUIRED:
Do not prioritize exact facial resemblance. Prioritize scene accuracy, objects, architecture, crowd silhouette, mood, and the narrative point of the beat. No central portrait of a specific identifiable public figure as the primary subject.`;

export const HARD_EXCLUSIONS_IMAGE = `DO NOT INCLUDE:
- text, labels, captions, logos, watermarks, UI chrome
- split-screen or multi-panel layout
- generic stock-photo posing or symmetrical “campaign poster” staging unless the beat is truly ceremonial/iconic
- extra people or props that distract from this beat’s main point
- anachronistic technology, fashion, or architecture for the stated year/place
- invented dialogue, invented documents, or invented headlines shown as readable text`;

/**
 * Core instructions for Step 3 enrichment: **compact** per-beat `imagePrompt` only.
 * Full house style + exclusions are **not** repeated per event — the image API prepends {@link STORYWALL_GLOBAL_IMAGE_BLOCK} once per generation call.
 */
export function buildEnrichmentImagePromptInstructions(canUseCelebrityLikeness: boolean): string {
  const modeList = BEAT_IMAGE_MODES.join(' | ');

  const likenessPolicy = canUseCelebrityLikeness
    ? `**Likeness:** Set \`omitLikenessReference\` \`false\` when a recognizable public figure must appear; one likeness line in the brief. Set \`true\` for place/object/crowd/system beats with no central portrait.`
    : `**Likeness:** Prefer no central portrait of a named public figure unless the beat requires it; \`omitLikenessReference\` \`true\` unless likeness is essential, then \`false\` with one concrete likeness line (race/ethnicity/gender + period look).`;

  return `
3. **Image prompts (\`imagePrompt\`) — compact beat brief (mandatory)**

**Production split:** Do **not** paste the long Storywall style manifest, repeated exclusion lists, or the full mode cheat-sheet into every item. The server prepends a fixed **global** block at image generation time. You output **only this beat’s drawable content** (target **60–120 words**, max ~900 characters).

**Also output** at the JSON root: \`imageSeriesContinuity\` — **one short sentence** (optional override of default continuity). Example: "Shift from wide institutional shots to tighter, more personal frames as the arc progresses." If nothing special, use: \`"Keep the same illustration treatment across the series, but vary composition and mood by beat."\`

**Each \`imagePrompt\` must follow this shape** (plain text; newlines OK). Start with the opening line exactly:

Single-image editorial illustration for a visual timeline.

Then fill:
- **Event:** (title) ((year or N/A))
- **Show:** (what the viewer must understand — **prefer concrete drawable nouns**: place, light, objects, action — not vague abstractions alone)
- **Mode:** (one of: ${modeList})
- **Shot:** (one of: wide | medium | close-up | over-the-shoulder | low-angle | top-down)
- **Primary subject:** (who/what dominates the frame)
- **Include:** (2–4 comma-separated concrete details: props, wardrobe, architecture, weather, technology)
- **Mood:** (short)
- **Contrast from previous beat:** (event 2+: e.g. tighter/wider, colder/warmer, public/private; event 1: \`N/A — opening beat.\`)
- **Period/place:** (one line — era + location when known)
- **Likeness:** One line — either \`Required — [name]; [race/ethnicity/gender]; period-appropriate look\` OR \`Not required — prioritize setting, objects, crowd silhouette.\`

**Do not include in \`imagePrompt\`:** \`ANCHOR:\` lines; **STYLE** / **DO NOT INCLUDE** sections; repeated "must not merely decorate" prose; long lists of modes (the mode enum above is enough).

${likenessPolicy}

**Named places & objects:** Prefer specific venues/props when documented; omit uncertain livery or model year rather than invent.

**Factual discipline:** **Show** and **Include** must be **visibly drawable** from the event title/description/facts — not abstract political analysis. Do not invent banners, slogans on signs, children’s activities, joint campaign branding, named bills, griddles/picnic props, or ceremonial specifics unless stated in the source event. For analytical or “impact” beats (polls, donors, demographics), translate into a **generic real-world scene** (e.g. volunteers at folding tables, election night HQ, subway canvassing) — never literal charts of statistics or invented crowd behaviors.

**Pacing:** Each frame illustrates **this** beat only — not the previous event. Use **Contrast from previous beat** for visual rhythm only.`;
}

/** Composition rules for the diffusion model (replaces default “balanced / centered”). */
export const COMPOSITION_GUIDANCE_FOR_MODELS =
  'Use the composition that best communicates the event: prefer asymmetry, depth, and natural scene tension unless the beat is ceremonial or iconic. Centered framing mainly for ceremonial or iconic moments; asymmetrical for tension, conflict, momentum, or uncertainty; close-up for intimate or controversial beats; wide for public scale or system context. Avoid symmetrical poster layouts unless the beat requires it. The viewer should grasp within one second what changed in this beat.';

export function periodAccuracyClause(year?: number): string {
  if (year == null || Number.isNaN(year)) {
    return 'Use historically and geographically plausible clothing, objects, architecture, lighting, and technology for the stated period and location. Avoid anachronistic props and generic fantasy detail.';
  }
  return `Use historically and geographically plausible clothing, objects, architecture, lighting, and technology appropriate to around ${year} and the documented location. Avoid anachronistic props and generic fantasy detail.`;
}

/**
 * Light cleanup before sending prompts to image models: quotes, blank lines, duplicate lines, length cap.
 */
export function sanitizeImagePromptAssembly(s: string, maxLen: number = 1200): string {
  if (!s || typeof s !== 'string') return '';
  let t = s.trim();
  t = t.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
  t = t.replace(/\n{4,}/g, '\n\n');
  const lines = t.split('\n');
  const out: string[] = [];
  let lastNonEmpty = '';
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && trimmed === lastNonEmpty) continue;
    out.push(line);
    if (trimmed) lastNonEmpty = trimmed;
  }
  t = out.join('\n');
  t = t.replace(/[ \t]{2,}/g, ' ');
  if (t.length > maxLen) t = t.slice(0, maxLen).trim();
  return t;
}

/** True if Step 3 produced a sectioned or compact editorial brief */
export function isStructuredEditorialImagePrompt(prompt: string): boolean {
  return (
    /VISUAL PURPOSE/i.test(prompt) ||
    /Single-image editorial illustration for a visual timeline/i.test(prompt) ||
    /Contrast from previous beat/i.test(prompt)
  );
}
