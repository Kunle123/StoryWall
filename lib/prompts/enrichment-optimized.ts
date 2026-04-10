/**
 * Optimized Timeline Enrichment Prompt (Step 3)
 * 
 * This replaces the verbose two-file system with a single, streamlined prompt
 * that generates anchor style, descriptions, and image prompts in one call.
 * 
 * Key optimizations:
 * - De-duplicated redundant instructions
 * - Sequential workflow (anchor first, then reference it)
 * - Embedded one-shot example
 * - Clear role-based instructions
 * - Reduced token count for faster processing
 */

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

  // Build celebrity likeness instruction
  const celebrityInstruction = canUseCelebrityLikeness
    ? `\n\n**Celebrity Likeness:** This timeline is newsworthy. You MAY use celebrity likenesses when appropriate.`
    : `\n\n**Celebrity Restriction:** Avoid celebrity references unless clearly newsworthy.`;

  return `**Role:** You are an expert in visual storytelling and prompt engineering. Your task is to generate a complete enrichment package for a timeline by creating a global visual style, descriptive text for each event, and corresponding image generation prompts.

**Primary Objective:** Generate a single, valid JSON object that strictly adheres to the schema below. Do not include any text outside of the JSON response.

---

**CRITICAL INSTRUCTIONS:**

1.  **Global Anchor Style:** First, define a single, comprehensive \`anchorStyle\` (5-7 sentences) that establishes a consistent visual theme for the *entire* timeline. This style must be general and should not reference any specific events. It must cover:
    - Visual Palette (colors, saturation, contrast, lighting)${themeColorInstruction}
    - Setting & Atmosphere (era, location, environment)
    - Character Archetype (if applicable - describe general appearance/clothing/posture)
    - Emotional Tone (primary emotion and mood)
    - Cinematography (shot type, angles, lens style)

2.  **Event Descriptions:** For each event, write a 2-4 sentence \`description\`. This text must:
    - Explain **what** the event is and **why** it is significant
    - Where natural, one sentence may state **how this beat advances the overall story arc** (using only documented facts—no invention)
    - **Sequential reading:** Events are listed in chronological order. Where sources support a causal or sequential tie to the **immediately preceding** event, you may add **at most one short bridging clause** (e.g. "Following …", "After …", "In response to …")—do **not** rehash the prior card in full; avoid vague filler ("Tensions continued") with no factual content
    - Focus on the event's meaning, impact, and historical/educational context
    - **DO NOT** describe a visual scene - explain the event itself
    - Incorporate key themes from the timeline description

3.  **Image Prompts:** For each event, create a literal, concrete \`imagePrompt\` that:
    - Describes a visual scene representing that event
    - Begins with "ANCHOR: [60-80 char preview of your anchorStyle]. [scene description]"
    - Is literal, recognizable, and concrete - NO poetry or metaphors
    - Incorporates the timeline's themes and settings
    - When depicting a specific named person, **MUST** explicitly state their race/ethnicity and gender
      * Examples: "a Black man", "a White woman", "an Asian musician", "a Latino leader"
      * This is REQUIRED for accurate visual representation

4.  **Hashtags:** Provide 5-10 relevant, lowercase hashtags (without # symbol) covering:
    - Subject-specific tags (e.g., 'formula1', 'renaissance', 'coldwar')
    - Category tags (e.g., 'sport', 'art', 'history', 'technology')
    - Topic tags (e.g., 'racing', 'painting', 'politics')

---

**⚠️ ANTI-HALLUCINATION POLICY:**
- NEVER make up, invent, or fabricate facts, dates, or details
- ONLY use information from the provided events and your verified knowledge
- If unsure about a fact, omit it rather than inventing it
- Stick to what is known and documented${celebrityInstruction}${factualDetailsSection}

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
  "hashtags": ["dystopianfuture", "cyberpunk", "scifi", "neonoircinema", "techthriller", "futuristic", "technology"],
  "items": [
    {
      "eventId": "event_1",
      "description": "The global network outage of 2077, known as 'The Great Silence,' severed all digital communications worldwide. This event marked the end of the interconnected era and forced humanity to rediscover analog methods of survival and governance.",
      "imagePrompt": "ANCHOR: Muted earth tones, deep shadows, neon-lit cityscapes, suspenseful tone. A panoramic view of a massive dark city at night, with all lights and screens extinguished except for the faint glow of fires in the streets below."
    }
  ]
}
\`\`\`

---

**Output Schema (JSON):**
{
  "anchorStyle": "string (5-7 sentences)",
  "hashtags": ["string (5-10 lowercase tags)"],
  "items": [
    {
      "eventId": "string (must match event ID from input)",
      "description": "string (2-4 sentences explaining the event)",
      "imagePrompt": "string (literal visual scene with ANCHOR prefix)"
    }
  ]
}

---

**BEGIN JSON OUTPUT:**`;
}
