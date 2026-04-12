/**
 * Optimized Timeline Enrichment Prompt (Step 3)
 *
 * Image prompts use the editorial architecture in `image-prompt-architecture.ts`
 * (visual purpose, shot type, image mode, likeness, contrast with previous beat)
 * — not “facts + style adjectives” only.
 */
import { buildEnrichmentImagePromptInstructions } from '@/lib/prompts/image-prompt-architecture';

export interface EnrichmentPromptVariables {
  timelineName: string;
  timelineDescription: string;
  events: Array<{
    eventId: string;
    year?: number;
    title: string;
    facts?: string;
  }>;
  eventCount: number;
  themeColor?: string;
  canUseCelebrityLikeness?: boolean;
  hasFactualDetails?: boolean;
  sourceRestrictions?: string[];
  /** e.g. Neutral, Professional, Narrative — controls description voice */
  writingStyle?: string;
}

/**
 * Voice rules: independent observer / wire-service facts — not editorial or dramatic storytelling.
 * Matches UI labels (Neutral, Narrative, …) case-insensitively.
 */
export function buildEventDescriptionVoiceBlock(writingStyle?: string): string {
  const ws = (writingStyle || 'neutral').toLowerCase().trim();

  const base = `
**EVENT DESCRIPTIONS — VOICE (MANDATORY):**
Write **event descriptions** as an **independent observer** recording documented facts — like a neutral news wire, encyclopedia, or chronology. **Do not** write as a columnist, advocate, or reviewer editorializing the topic.

- **Third person only.** No "we", "you", or first-person.
- State **who, what, when, where**, and **documented outcomes** (what was reported, decided, signed, measured, or announced). Do not invent dialogue or unattributed inner thoughts.
- **No loaded or promotional language** — avoid words like: tragically, heroically, shockingly, remarkably, devastating, triumph, brutal, outrageous, game-changer, landmark (unless quoting a named source or official title).
- **No moral judgment or taking sides.** Do not tell the reader what to think. If views conflict, attribute them ("According to X…", "Y reported that…").
- **No rhetorical questions** or calls to emotion directed at the reader.
- Prefer **plain, precise verbs** over hype. One or two sentences of context on *documented* impact is OK; avoid "this reminds us that…" framing.
`;

  const variants: Record<string, string> = {
    neutral: `
**Style preset (Neutral):** Maximum neutrality. Plain, factual sentences only.`,
    narrative: `
**Style preset (Narrative):** Clear chronological wording is fine; **still** obey every rule above — no editorial adjectives, moral framing, or drama for effect.`,
    professional: `
**Style preset (Professional):** Concise, formal-neutral. Short sentences. No flourish.`,
    academic: `
**Style preset (Academic):** Formal and cautious. Where evidence is disputed, attribute or hedge ("reportedly", "according to…"). No speculation presented as fact.`,
    casual: `
**Style preset (Casual):** Plain, simple English. **Still** neutral — no slang that implies judgment.`,
    poetic: `
**Style preset (Poetic):** Figurative language is allowed **only** in descriptions here; do **not** let metaphor replace facts or invent details.`,
  };

  const tail = variants[ws] || variants.neutral;
  return `${base}${tail}`;
}

/** Lower temperature reduces editorial flair for most presets (not Poetic). */
export function suggestedEnrichmentTemperature(writingStyle?: string): number {
  const ws = (writingStyle || 'neutral').toLowerCase();
  if (ws === 'poetic') return 0.65;
  if (ws === 'narrative') return 0.5;
  return 0.35;
}

/**
 * Build optimized enrichment prompt
 */
export function buildEnrichmentPrompt(variables: EnrichmentPromptVariables): string {
  const {
    timelineName,
    timelineDescription,
    events,
    eventCount,
    themeColor,
    canUseCelebrityLikeness = false,
    hasFactualDetails = false,
    sourceRestrictions = [],
    writingStyle,
  } = variables;

  const voiceBlock = buildEventDescriptionVoiceBlock(writingStyle);

  // Build source restrictions text
  const sourceRestrictionsText = sourceRestrictions.length > 0
    ? `\n\n**Source Restrictions:** Only use information from: ${sourceRestrictions.map((s, i) => `${i + 1}. ${s}`).join(', ')}`
    : '';

  // Build factual details section if applicable
  const factualDetailsSection = hasFactualDetails
    ? `\n\n**FACTUAL MODE ACTIVE:**
- Use ONLY the factual details provided below for each event
- Describe physical, observable characteristics
- NO metaphors, NO poetic language - be precise and clinical
- Resolve conflicts in favor of provided facts

**Factual Details:**
${events.map((e, i) => `${i + 1}. ${e.year ? `${e.year}: ` : ''}${e.title}${e.facts ? `\n   Facts: ${e.facts}` : ''}`).join('\n')}
`
    : '';

  // Build theme color instruction
  const themeColorInstruction = themeColor
    ? `\n- Incorporate ${themeColor} as a subtle accent color in the anchor style`
    : '';

  const imagePromptBlock = buildEnrichmentImagePromptInstructions(canUseCelebrityLikeness);

  return `**Role:** You are an expert in visual storytelling and prompt engineering. Your task is to generate a complete enrichment package for a timeline by creating a global visual style, descriptive text for each event, and corresponding image generation prompts.

**Primary Objective:** Generate a single, valid JSON object that strictly adheres to the schema below (including optional root-level \`imageSeriesContinuity\`). Do not include any text outside of the JSON response.

---

**CRITICAL INSTRUCTIONS:**

1.  **Global Anchor Style (\`anchorStyle\`):** Define the **series-wide** visual language (5–7 sentences): palette, era feel, lighting bias, typical lens/distance *habits* — **not** a repeat of per-beat shot choices. This is sent once at image generation time together with a fixed global rules block; do not paste the full exclusion list into each \`imagePrompt\`. Do not reference any specific event by name. Cover:
    - Visual Palette (colors, saturation, contrast, lighting)${themeColorInstruction}
    - Setting & Atmosphere (era, location, environment)
    - Character Archetype (if applicable — general clothing/posture types, not named people)
    - Emotional Tone (primary mood band for the series)
    - Cinematography habits (lens feel, typical distance — per-beat shot type still varies in each \`imagePrompt\`)

2.  **Event Descriptions:** For each event, write a 2-4 sentence \`description\`. This text must:
    - Explain **what** the event is and **why** it is significant
    - Include **at least one concrete documented detail** per beat when facts allow (specific actor, place, date, decision, or measured outcome)—not vague summary alone (aligns with editorial “one clear point + one concrete detail” per card)
    - Where natural, one sentence may state **how this beat advances the overall story arc** (using only documented facts—no invention)
    - **Sequential reading:** Events are listed in chronological order. Where sources support a causal or sequential tie to the **immediately preceding** event, you may add **at most one short bridging clause** (e.g. "Following …", "After …", "In response to …")—do **not** rehash the prior card in full; avoid vague filler ("Tensions continued") with no factual content
    - **Same-era / late beats:** When consecutive events sit in the **same year** or the same reform wave, each description must add **new** documented facts—do not paraphrase the previous card with only minor wording changes (avoids a "stacked" ending on the page)
    - Focus on the event's meaning, impact, and historical/educational context
    - **DO NOT** describe a visual scene - explain the event itself
    - Incorporate key themes from the timeline description

${imagePromptBlock}

4.  **Hashtags:** Provide 5-10 relevant, lowercase hashtags (without # symbol) covering:
    - Subject-specific tags (e.g., 'formula1', 'renaissance', 'coldwar')
    - Category tags (e.g., 'sport', 'art', 'history', 'technology')
    - Topic tags (e.g., 'racing', 'painting', 'politics')

---

**⚠️ ANTI-HALLUCINATION POLICY:**
- NEVER make up, invent, or fabricate facts, dates, or details
- ONLY use information from the provided events and your verified knowledge
- If unsure about a fact, omit it rather than inventing it
- Stick to what is known and documented
- **Image prompts:** Do not invent scene specifics (banners, bills, children, branded props, ceremony details) not implied by the event; prefer restrained, documentable visuals
- For **locations and objects** (buildings, race cars, trophies): tie details to **named** and **time-bound** facts only; never invent wrong venue architecture, car generation, or team livery${factualDetailsSection}

---

**Timeline & Event Data:**

*   **Timeline Name:** "${timelineName}"
*   **Timeline Description:** ${timelineDescription}${sourceRestrictionsText}
*   **Events to Process (${eventCount}):**
${events.map((e, i) => `    ${i + 1}. **Event ID:** ${e.eventId} | **Year:** ${e.year || 'N/A'} | **Title:** "${e.title}"`).join('\n')}

---

**Example of Final JSON Output:**

\`\`\`json
{
  "anchorStyle": "The visual palette is dominated by muted earth tones and deep shadows, with a single vibrant accent color appearing in moments of crisis. The atmosphere is heavy and oppressive, set in rain-slicked, neon-lit cityscapes of the near future. Characters are depicted as solitary figures, often shown from a distance to emphasize their isolation. The emotional tone is one of suspense and existential dread, with a glimmer of hope in the final scenes. Cinematography uses wide-angle lenses and low-angle shots to create a sense of scale and power imbalance.",
  "imageSeriesContinuity": "Keep the same illustration treatment across the series, but vary composition and mood by beat.",
  "hashtags": ["dystopianfuture", "cyberpunk", "scifi", "neonoircinema", "techthriller", "futuristic", "technology"],
  "items": [
    {
      "eventId": "event_1",
      "description": "The global network outage of 2077, known as 'The Great Silence,' severed all digital communications worldwide. This event marked the end of the interconnected era and forced humanity to rediscover analog methods of survival and governance.",
      "imagePrompt": "Single-image editorial illustration for a visual timeline.\\n\\nEvent: The Great Silence (2077)\\nShow: A vast city gone dark — every screen and light dead at once; only embers of human activity below.\\nMode: system_environment\\nShot: wide\\nPrimary subject: darkened skyline and blank building glass\\nInclude: extinguished billboards, distant street fires, tiny human silhouettes\\nMood: dread, rupture\\nContrast from previous beat: N/A — opening beat.\\nPeriod/place: near-future megacity night\\nLikeness: Not required — prioritize scale and infrastructure.",
      "omitLikenessReference": true
    }
  ]
}
\`\`\`

---

**Output Schema (JSON):**
{
  "anchorStyle": "string (5-7 sentences — series-wide visual language only)",
  "imageSeriesContinuity": "string (one sentence — optional rhythm note for the image pipeline)",
  "hashtags": ["string (5-10 lowercase tags)"],
  "items": [
    {
      "eventId": "string (must match event ID from input)",
      "description": "string (2-4 sentences explaining the event)",
      "imagePrompt": "string: compact beat brief only (see section 3) — no repeated global style/exclusion blocks",
      "omitLikenessReference": "boolean — true if no face/likeness ref should be used for this beat (place/prop/crowd/exterior-only); false otherwise"
    }
  ]
}

---

**BEGIN JSON OUTPUT:**`;
}
