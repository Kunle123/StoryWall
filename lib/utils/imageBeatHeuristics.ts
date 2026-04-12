/**
 * Post–Step 3 guardrails for image generation when event titles look like pure analysis
 * (not a substitute for fixing event lists at generate-events).
 */

const ANALYTICAL_TITLE_HINTS =
  /\b(signals?\s+(national|wider)?|national\s+impact|exit\s+poll|polls?\s+(showed?|numbers?|surge)|polling\s+numbers?|donor\s+composition|fundraising|outpacing|leads?\s+in|emphasizes\s+|affordability\s+and|progressive\s+policies|first\s+100\s+days|celebrity\s+appeal|policy\s+initiatives|energiz(es|ed)?\s+(young|voters|turnout)|turnout\s+jump|demographic|momentum\s+among|support\s+from\s+.+\s+signals|emerging\s+trend|victory\s+energizes)\b/i;

/**
 * Title (or description snippet) reads like analysis / polling narrative rather than a dated occurrence.
 */
export function looksLikeAnalyticalOnlyBeat(text: string | undefined | null): boolean {
  if (!text || typeof text !== 'string') return false;
  const t = text.trim();
  if (t.length < 12) return false;
  return ANALYTICAL_TITLE_HINTS.test(t);
}

/**
 * Appended to the image model prompt when the beat looks analytical—reduces invented “documentary” detail.
 */
export function getImageGuardrailClause(title: string, description?: string | null): string {
  const d = description?.trim();
  if (!looksLikeAnalyticalOnlyBeat(title) && !(d && looksLikeAnalyticalOnlyBeat(d))) {
    return '';
  }
  return ` EDITORIAL GUARDRAIL (analytical beat): Prefer symbolic_object, media_framing, system_environment, or generic civic/workspace/crowd-silhouette imagery—do not invent banners, children, bill titles, or ceremony specifics. Avoid chart-as-hero composition.`;
}
