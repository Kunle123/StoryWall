/**
 * Factual event generation: beats must work for chronology + on-site illustration.
 * Used by generate-events (main + batch), timeline-modules BASE, and related prompts.
 */

export const FACTUAL_EVENT_IMAGEABILITY_BLOCK = `
STORYWALL — DISCRETE, IMAGEABLE BEATS (product-critical):
- Each event must be a **documentable occurrence** a reader could verify: a dated **action, vote, filing, speech, rally, debate, election, court ruling, indictment, swearing-in, reported incident, or named official step**—not a freestanding row of **polling interpretation**, **“signals” among groups**, **donor-composition analysis**, **national impact** as abstract narrative, **exit-poll storytelling**, or **mood-of-the-electorate** unless you tie it to a **specific dated moment** (e.g. election night at a named place, a published report’s release date, a scheduled FEC event).
- **Do not** pad with speculative or analytical “beats” that are really **commentary** (e.g. “Victory energizes young voters,” “Support from X signals Y”) as if they were calendar events—**merge** that substance into a **concrete** beat (results night, named rally, endorsement with a date) or **omit** if no discrete fact exists.
- **News / politics:** Prefer: announcements, debates, primaries, scandals with a dated trigger, endorsements, **legislation introduced or signed** (real timing), hearings, results, transitions. Avoid invented future ceremonial dates.
- **Quality over filler:** One strong, datable row beats multiple overlapping “narrative” rows that restate the same arc.
`;
