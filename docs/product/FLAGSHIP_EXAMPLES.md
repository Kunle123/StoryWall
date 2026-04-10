# Flagship example StoryWalls (ops checklist)

**Feature matrix [row 14](./FEATURE_PRIORITIZATION_MATRIX.md)** — *How it works + examples* (Prioritised).

Tracks **[#16](https://github.com/Kunle123/StoryWall/issues/16)** — three polished public examples on the home discover feed (spotlight can show up to six; **three** is the flagship bar).

## Quality bar

- Use `docs/PERFECT_STORYWALL.md` / story rubric: clear premise, chronological arc, tight beats, meaningful images.
- Aim for **~22+/30** rubric-style quality for “flagship” examples.

## How examples appear on home

1. Publish (or pick) **three** strong **public** timelines.
2. Mark them featured in the database (most recently featured sorts first):

   ```bash
   npx tsx scripts/feature-a-timeline.ts <timelineId>
   ```

   Run once per timeline. See script header for “clear all featured” if you need to reset.

3. Confirm **`/discover`** shows them in the **Featured creator** spotlight block (Explore tab).

## How it works (product)

Long-form onboarding lives on discover → **How it works** tab (`DiscoverHome`).

## Founder demo video

1. Record Loom / YouTube (short walkthrough).
2. Set in production env:

   ```bash
   NEXT_PUBLIC_FOUNDER_DEMO_URL=https://…
   ```

3. The **Watch demo** block appears at the bottom of the **How it works** tab when this variable is set.
