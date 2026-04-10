/**
 * `image_references[].name` from the model is often a photo caption ("X at the 2009 BAFTAs"),
 * which breaks Wikimedia search and strict filename matching. Derive a short person-style
 * label from Commons upload URLs (filename before `_at_the_` / `_at_`) or from caption text.
 */
export function getPersonLookupNameForImageRef(ref: { name: string; url: string }): string {
  const rawName = (ref.name || "").trim();

  try {
    const u = new URL(ref.url);
    if (u.hostname.includes("upload.wikimedia.org") || u.hostname.includes("commons.wikimedia.org")) {
      const seg = u.pathname.split("/").pop();
      if (seg) {
        const last = decodeURIComponent(seg).replace(/\.(jpe?g|png|webp|gif)$/i, "");
        if (last.length >= 2) {
          const beforeVenue = last.split(/_at_the_/i)[0]?.split(/_at_/i)[0];
          if (beforeVenue && beforeVenue.length >= 2) {
            const fromFile = beforeVenue.replace(/_/g, " ").trim();
            if (fromFile.length >= 2) return fromFile;
          }
          const spaced = last.replace(/_/g, " ");
          const m = spaced.match(/^(.+?)\s+at\s+(the\s+)?/i);
          if (m && m[1].trim().length >= 2) return m[1].trim();
        }
      }
    }
  } catch {
    // ignore malformed URL
  }

  const caption = rawName.match(/^(.+?)\s+at\s+(the\s+)?/i);
  if (caption && caption[1].trim().length >= 2) return caption[1].trim();

  return rawName || "Unknown";
}
