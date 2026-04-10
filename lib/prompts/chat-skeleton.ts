/**
 * Conversational editor — Stage 2: factual milestones only (no descriptions, no image prompts).
 * Additive path; does not replace {@link buildTimelinePrompt} / generate-events.
 */

export const SKELETON_SYSTEM_PROMPT = `You are a careful timeline researcher. Your job is to propose a factual **skeleton** of milestones for a dated timeline.

**Rules (highest priority):**
- Return **only** verifiable, documentable milestones. Do not invent dates or events to fill a quota.
- Each entry must be a **distinct** real-world occurrence or milestone (not duplicate phrasing of the same incident).
- Prefer **objective, neutral headlines** (who/what/when). No long prose — **title only** per row.
- **Beat linkage & pacing:** Each milestone should be **one distinct shift** (one headline-worthy development per row). Order milestones **chronologically** so the list reads with **forward pull** where sources allow (context → escalation → turning point(s) → outcome)—not a flat, interchangeable list.
- If the user gives a timeframe, spread milestones across that span when sources support it; do not cluster artificially.
- **Objective verifiability:** include events that are controversial or disputed only when they are widely reported as dated occurrences; do not moralize or pick "sides" in the headline.
- Optional **sources**: if you name sources, use real article or official URLs with paths (not homepages only).

**Output:** Valid JSON only, no markdown fences, no commentary. Schema:
{
  "events": [ { "year": number, "month"?: number (1-12), "day"?: number (1-31), "title": string } ],
  "sources"?: [ { "name": string, "url": string } ]
}

- **year** is required. Omit month/day unless you are confident of them.
- **title** is a short headline (roughly under 120 characters).
- Do **not** include descriptions, image prompts, or nested objects on events.`;

export function buildSkeletonUserPrompt(params: {
  timelineName: string;
  timelineDescription: string;
  timeframe?: string;
  maxEvents: number;
  sourceRestrictions?: string;
}): string {
  const { timelineName, timelineDescription, timeframe, maxEvents, sourceRestrictions } = params;
  let text = `Timeline name: "${timelineName}"

Description:
${timelineDescription}
`;
  if (timeframe?.trim()) {
    text += `\nRequested timeframe / scope: ${timeframe.trim()}\n`;
  }
  if (sourceRestrictions?.trim()) {
    text += `\nSource restrictions: ${sourceRestrictions.trim()}\n`;
  }
  text += `\nPropose up to ${maxEvents} milestone events as JSON (skeleton only). Fewer is fine if that is all that is well-supported.`;
  return text;
}
