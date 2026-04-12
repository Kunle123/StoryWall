/**
 * When to inject likeness references vs text-only SDXL (avoids uncanny photo/illustration hybrid).
 */

/** Styles where strong reference / IP-Adapter likeness is appropriate */
export function isPhotorealisticImageStyle(imageStyle: string): boolean {
  const s = (imageStyle || '').toLowerCase();
  return (
    s.includes('photoreal') ||
    s.includes('realistic') ||
    s === 'realistic' ||
    s === 'photorealistic'
  );
}

/** Strip trailing year and parentheticals for name matching (e.g. "Alison Hammond 2023" → "alison hammond"). */
export function corePersonNameForMatch(name: string): string {
  let t = name.toLowerCase().trim();
  t = t.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  t = t.replace(/\b(19|20)\d{2}\b/g, '').trim();
  t = t.replace(/\s+/g, ' ');
  return t;
}

/** Year embedded in likeness ref label or file-style name */
export function extractYearFromLikenessRefName(name: string): number | null {
  const m = name.match(/\b(19|20)\d{2}\b/);
  if (!m) return null;
  const y = parseInt(m[0], 10);
  return Number.isFinite(y) ? y : null;
}

/**
 * Score 0–100+. Full core name in event text = 100; first+last = 80; weak = 0.
 */
export function scoreRefAgainstEventText(eventTextLower: string, refName: string): number {
  const core = corePersonNameForMatch(refName);
  if (!core || core.length < 3) return 0;
  if (eventTextLower.includes(core)) return 100;
  const parts = core.split(/\s+/).filter((p) => p.length > 1);
  if (parts.length >= 2) {
    const first = parts[0];
    const last = parts[parts.length - 1];
    if (eventTextLower.includes(first) && eventTextLower.includes(last)) return 80;
  }
  return 0;
}

/** Minimum score to treat a reference as legitimately matched (avoid spurious 0-score “matches”). */
export const MIN_REFERENCE_MATCH_SCORE = 45;

/**
 * For editorial/illustration timelines, avoid applying a single dated photo across very different event years.
 */
export function shouldSuppressLikenessRefForTemporalMismatch(
  eventYear: number | undefined,
  refName: string,
  opts: { illustrationFamily: boolean; maxYearDrift?: number }
): boolean {
  if (!opts.illustrationFamily) return false;
  if (eventYear == null || Number.isNaN(eventYear)) return false;
  const refY = extractYearFromLikenessRefName(refName);
  if (refY == null) return false;
  const maxDrift = opts.maxYearDrift ?? 6;
  return Math.abs(eventYear - refY) > maxDrift;
}

/** Negatives to reduce DSLR / portrait-photo creep when the user asked for illustration */
export const ILLUSTRATION_ANTI_PHOTO_NEGATIVE =
  'photorealistic skin, skin pores, hyperrealistic face, DSLR, shallow depth of field, studio portrait lighting, beauty dish, ring light catchlights, 85mm portrait lens, 8k photo, raw photo, smartphone selfie look, wax skin, subsurface scattering skin';
