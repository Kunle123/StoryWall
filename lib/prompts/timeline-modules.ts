/**
 * Modular Timeline Generation System
 * 
 * This system provides a base prompt and specialized modules that can be
 * dynamically combined based on the timeline topic to create targeted,
 * relevant prompts without overwhelming the LLM with irrelevant instructions.
 */

export interface TimelinePromptModule {
  name: string;
  trigger: (timelineName: string, timelineDescription: string) => boolean;
  content: string;
}

/**
 * Base prompt - applies to ALL timeline generation tasks
 */
export const BASE_TIMELINE_PROMPT = `**Objective:** Generate a balanced, factual, and chronologically accurate timeline for the topic described below.

**Core Instructions:**

1.  **Analyze the Topic (thesis first):** Carefully review the timeline **name** and **description** and any specified timeframes. Infer a **single clear thesis**—the exact story the reader should get—not only a broad subject label. If the name is generic (e.g. a whole policy domain over a decade), choose beats that support **one intentional through-line** when sources allow, such as: how a system moved from **free movement to selective migration**; how policy shifted from **integration toward deterrence**; how **asylum and legal migration** were tightened over the period; or another spine that matches the description. If the user already states a spine in the description, follow it. **Breadth risk:** covering many unrelated arcs at once (e.g. enforcement + family + trade + asylum + multiple reform waves in one pass) weakens reader flow—prefer **one** interpretive line unless the description explicitly asks for an exhaustive multi-track survey.

2.  **Conduct Comprehensive Research:** You are required to use web search to gather information. Prioritize recency and accuracy by consulting multiple reputable sources. Do not rely solely on your training data.

3.  **Ensure Balanced Representation:** Include developments that **serve the timeline's thesis**—actions, key decisions, and milestones that advance **one** coherent story. Avoid adding parallel tracks that feel interchangeable unless the description demands breadth. While controversies can be included, they should not dominate unless the topic is inherently about a controversy. As a general guideline, limit controversial events to approximately 20-30% of the total timeline.

4.  **Maintain Temporal Distribution:** If a timespan is mentioned or can be inferred, spread meaningful beats across the period when **distinct** developments exist in those years. Avoid clustering **every** beat in one year unless the topic is specific to that year. **Late-stage pacing:** do **not** stack several beats in the **same year** (or days apart) that are really the same reform wave or theme split artificially—**merge** into one stronger beat or drop the weaker one so the ending feels **earned** and the reader finishes on a **clear** conclusion rather than three similar late notes.

5.  **Prioritize Unique Events:** Each event must be distinct. Do not repeat the same event or create multiple entries for different aspects of a single incident. Quality over quantity is paramount.

6.  **Generate UP TO {maxEvents} events (ceiling—not a quota), but ONLY unique, distinct events.** For most topics, **aim for roughly 8–12 strong beats** that complete **one** on-site explainer arc—substantial but not bloated. Do **not** pad toward {maxEvents} with marginal incidents. Do NOT fabricate events to reach any count—if you can only find 6 unique events, return 6. **Product fit:** this output is the **canonical full StoryWall** (depth and chronology rewarded). A **shorter social version** (often ~6–8 beats) would be a **separate** compression; do not optimize this list for pasting wholesale into X/Threads.

7.  **StoryWall narrative arc (when not a single-subject progression):** Order events so the sequence reads as a **recognizable spine** where the topic allows: **context** (why it matters) → developments → major turning point(s) → consequence or present framing—**backstory behind a current or focused issue** when that matches the description. The middle should carry the strongest causal chain; the ending should not feel **stacked** with redundant late beats. Prefer fewer strong beats over filler to hit the maximum count.

8.  **Beat linkage & pacing:** Treat each event as **one meaningful shift**—a single distinct development, not several unrelated facts bundled into one beat. Order events so that, where sources support it, the sequence reads as **linked steps** (e.g. cause → consequence, escalation, reaction, or new constraint)—not an interchangeable list of facts. **Titles** should be specific enough to show *what changed* (who/what/when), not vague labels like "Tensions rise" without substance. **Each late-stage beat** must add a **new** development for the reader—not a near-duplicate of the previous card. If two adjacent beats would not change a reader's understanding, merge or omit one.

9.  **Timeline name alignment:** When the name is broad, still choose event titles so the **sequence** reflects a deliberate thesis (as in instruction 1). Ideal names read like a promise to the reader (e.g. how X shifted from A to B over [years]); if the given name stays broad, the **beat order and specificity** must still make the implied story obvious.

10. **Adhere to Output Format:** You must return only valid JSON, starting with \`{\` and ending with \`}\`. Do not include any explanatory text or comments outside of the JSON structure.`;

/**
 * Module 1: Controversy & Media
 * Use for topics centered on public controversies, media incidents, or political scandals
 */
export const CONTROVERSY_MEDIA_MODULE: TimelinePromptModule = {
  name: 'Controversy & Media',
  trigger: (timelineName: string, timelineDescription: string) => {
    const combined = `${timelineName} ${timelineDescription}`.toLowerCase();
    const controversyKeywords = [
      'controversy', 'scandal', 'incident', 'criticism', 'protest',
      'complaint', 'backlash', 'outrage', 'condescending', 'dismissive',
      'working class', 'working-class', 'controversial', 'criticized'
    ];
    return controversyKeywords.some(keyword => combined.includes(keyword));
  },
  content: `
**Controversy & Media Instructions:**

-   **Detailed Incident Search:** You must perform multiple, targeted web searches to identify all specific incidents, controversial quotes, and key dates. Use a variety of search terms, including names, years, and keywords related to the controversy.
-   **Separate Events for Each Incident:** Each distinct controversial moment, quote, or incident should be a separate event in the timeline. Do not consolidate multiple unique incidents into a single generic event.
-   **Focus on Recency:** For ongoing newsworthy topics, you must search for developments within the last 24-48 hours.
-   **Multiple Search Queries:** Make at least 5-10 different searches with varying terms (e.g., "[topic] controversy [year]", "[person] [keyword]", "[topic] criticism").`
};

/**
 * Module 2: Biography
 * Use for timelines about the life or career of an individual
 */
export const BIOGRAPHY_MODULE: TimelinePromptModule = {
  name: 'Biography',
  trigger: (timelineName: string, timelineDescription: string) => {
    const combined = `${timelineName} ${timelineDescription}`.toLowerCase();
    
    // Check for biographical indicators
    const biographyKeywords = [
      'life of', 'career of', 'biography', 'biographical',
      'president', 'prime minister', 'minister', 'leader',
      'actor', 'actress', 'singer', 'musician', 'artist',
      'scientist', 'inventor', 'entrepreneur', 'founder',
      'rise of', 'fall of', 'reign of', 'tenure of'
    ];
    
    // Check if it's about a person (contains common name patterns)
    const hasPersonName = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/.test(timelineName);
    
    return biographyKeywords.some(keyword => combined.includes(keyword)) || hasPersonName;
  },
  content: `
**Biographical Instructions:**

-   **Holistic Life View:** Cover a broad range of life events, including early life, education, career milestones, major achievements, significant decisions, and personal life events if they are publicly documented and relevant.
-   **Prioritize Actions and Accomplishments:** Focus on what the individual did, created, or influenced. Include:
    * Career appointments and positions held
    * Policy decisions and legislation (for political figures)
    * Creative works, performances, or projects (for artists/entertainers)
    * Discoveries, inventions, or innovations (for scientists/inventors)
    * Business ventures and companies founded (for entrepreneurs)
    * International relations and diplomatic events (for world leaders)
-   **Balance Controversy:** While public perception and criticism are part of the story, they should be balanced with the subject's substantive contributions. Limit controversy/scandal events to 20-30% of the timeline.`
};

/**
 * Module 3: Organization & Product
 * Use for timelines about companies, organizations, products, or brands
 */
export const ORGANIZATION_PRODUCT_MODULE: TimelinePromptModule = {
  name: 'Organization & Product',
  trigger: (timelineName: string, timelineDescription: string) => {
    const combined = `${timelineName} ${timelineDescription}`.toLowerCase();
    const orgKeywords = [
      'company', 'corporation', 'organization', 'business',
      'product', 'brand', 'startup', 'enterprise',
      'founded', 'founding', 'launch', 'launched',
      'inc', 'ltd', 'llc', 'corp', 'co.'
    ];
    return orgKeywords.some(keyword => combined.includes(keyword));
  },
  content: `
**Organization & Product Instructions:**

-   **Key Business Milestones:** Include events such as:
    * Founding dates and initial funding rounds
    * Product launches and major updates
    * Acquisitions, mergers, and partnerships
    * Market expansions and new headquarters
    * Leadership changes and key appointments
    * Major regulatory events or legal battles
-   **Innovation and Impact:** Highlight key innovations, technological breakthroughs, and the product's or organization's impact on its industry or the wider culture.
-   **Balance Success and Struggle:** Include both achievements and challenges (financial difficulties, recalls, lawsuits) to provide a complete picture.`
};

/**
 * Module 4: Historical & Technical
 * Use for timelines about historical events, scientific discoveries, or technology evolution
 */
export const HISTORICAL_TECHNICAL_MODULE: TimelinePromptModule = {
  name: 'Historical & Technical',
  trigger: (timelineName: string, timelineDescription: string) => {
    const combined = `${timelineName} ${timelineDescription}`.toLowerCase();
    const techHistoricalKeywords = [
      'history of', 'evolution of', 'development of',
      'invention of', 'discovery of', 'creation of',
      'technology', 'scientific', 'breakthrough',
      'innovation', 'advancement', 'progress',
      'war', 'revolution', 'movement', 'era', 'age',
      'ancient', 'medieval', 'modern', 'origins of'
    ];
    return techHistoricalKeywords.some(keyword => combined.includes(keyword));
  },
  content: `
**Historical & Technical Instructions:**

-   **Trace the Evolution:** Focus on the key stages of development, from early concepts to major breakthroughs and widespread adoption.
-   **Identify Key Influences:** Include the inventors, pioneers, and key figures who drove the development forward. Also, mention any precursor technologies or prerequisite discoveries.
-   **Contextualize the Milestones:** For each major milestone, consider the broader historical or scientific context. What was happening in the world that made this development possible or significant?
-   **Technical Accuracy:** Use precise technical terminology and accurate dates. Verify patent dates, publication dates, and first public demonstrations.`
};

/**
 * All available modules
 */
export const ALL_MODULES: TimelinePromptModule[] = [
  CONTROVERSY_MEDIA_MODULE,
  BIOGRAPHY_MODULE,
  ORGANIZATION_PRODUCT_MODULE,
  HISTORICAL_TECHNICAL_MODULE,
];

/**
 * Dynamically construct a timeline generation prompt by selecting
 * relevant modules based on the timeline topic
 */
export function buildTimelinePrompt(
  timelineName: string,
  timelineDescription: string,
  maxEvents: number,
  sourceRestrictions?: string
): string {
  // Start with base prompt
  let prompt = `Timeline Name: "${timelineName}"\n\nDescription: ${timelineDescription}${sourceRestrictions || ''}\n\n`;
  prompt += BASE_TIMELINE_PROMPT.replace('{maxEvents}', String(maxEvents));
  
  // Select applicable modules
  const applicableModules = ALL_MODULES.filter(module => 
    module.trigger(timelineName, timelineDescription)
  );
  
  // Append module content
  if (applicableModules.length > 0) {
    prompt += '\n\n**Additional Topic-Specific Instructions:**\n';
    applicableModules.forEach(module => {
      prompt += module.content;
    });
  }
  
  // Add closing instructions
  prompt += `\n\n**JSON Output Schema:**
Return as JSON with these keys:
- "isProgression": boolean (true if the timeline describes a sequential process/progression, false otherwise)
- "progressionSubject": string (only if isProgression is true)
- "events": array of event objects, each with: year (required, number), title (required, string). Do NOT include descriptions.
- "sources": array (optional) of objects with { name: string, url: string }
- "image_references": array (optional) of objects with { name: string, url: string }

Example: { "isProgression": false, "events": [{ "year": 2020, "title": "Event title" }], "sources": [...], "image_references": [...] }`;
  
  return prompt;
}

/**
 * Get list of modules that would be applied to a given timeline
 * (useful for debugging/logging)
 */
export function getApplicableModules(
  timelineName: string,
  timelineDescription: string
): string[] {
  return ALL_MODULES
    .filter(module => module.trigger(timelineName, timelineDescription))
    .map(module => module.name);
}
