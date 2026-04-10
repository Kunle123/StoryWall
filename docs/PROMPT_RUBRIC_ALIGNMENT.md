# Prompt & creation-flow alignment with the perfect-story rubric

This document records how **API prompts** and the **editor UI** line up with [`STORYWALL_PERFECT_STORY_RUBRIC.md`](./STORYWALL_PERFECT_STORY_RUBRIC.md) (six dimensions × 1–5, max 30).

## Where prompts live

| Area | Primary files |
|------|----------------|
| Event titles (beats) | `app/api/ai/generate-events/route.ts` (system + user prompts; Responses API + Chat Completions) |
| Modular factual user prompt | `lib/prompts/timeline-modules.ts` (`BASE_TIMELINE_PROMPT`, topic modules, `buildTimelinePrompt`) |
| Descriptions + image prompts + anchor | `lib/prompts/enrichment-optimized.ts` (`buildEnrichmentPrompt`, `buildEventDescriptionVoiceBlock`) |
| Route wrapper | `app/api/ai/generate-descriptions-v2/route.ts` (batching, newsworthiness, progression) |
| Chat skeleton milestones | `lib/prompts/chat-skeleton.ts` (`SKELETON_SYSTEM_PROMPT`, `buildSkeletonUserPrompt`) |
| Editor coaching | `components/timeline-editor/CreationFlowCallout.tsx` |

---

## Rubric dimension × current behavior

### 1. Premise clarity

| Status | Notes |
|--------|--------|
| **Partially aligned** | Prompts stress **specific** titles tied to the timeline description and theme; anti-generic title rules are strong. |
| **Gap** | The model is not explicitly asked to optimize for a **visitor’s one-sentence takeaway**—that still depends on what the user typed in step 1. **CreationFlowCallout** and homepage copy now reinforce that on the human side. |

### 2. Narrative arc

| Status | Notes |
|--------|--------|
| **Strong for** | **Progression** topics (fetal dev, construction, etc.): dedicated instructions. **Fictional** path: “coherent story,” “build upon each other.” |
| **Weaker for** | General **factual** timelines: prompts emphasize milestones, recency, distribution across years, and uniqueness—but historically did not always ask for **story-shaped** ordering (setup → turn → payoff). |
| **Change made** | `BASE_TIMELINE_PROMPT` + factual blocks include a **StoryWall narrative arc** line and a **beat linkage & pacing** block (one beat = one shift; sequential logic; specific titles). `generate-events` mirrors this for the main factual and creative paths. |

### 3. Beat selection and pacing

| Status | Notes |
|--------|--------|
| **Aligned** | Strong **uniqueness** rules; “quality over quantity”; progression stages. **Beat linkage** is explicit in `BASE_TIMELINE_PROMPT`, `generate-events`, **enrichment** (optional one-clause bridge to the prior beat when facts support it; **concrete detail** per description where possible), and **chat-skeleton** (ordered milestones with forward pull). **Target length:** prompts center **~8–12 strong beats** with `maxEvents` as **ceiling not quota**; editor/API default **`maxEvents` = 12** (see [`GTM-one-page-memo.md`](./product/GTM-one-page-memo.md) editorial rules). |
| **Residual** | GTM also suggests **6–8** beats for “fast social context”—achieved by the creator **lowering max events** in the editor, not a separate preset yet. **12–15 when warranted** is still user-driven via a higher cap. |

### 3b. GTM editorial & writing rules (memo crosswalk)

| Memo rule | Prompt / product coverage |
|-----------|---------------------------|
| **6–12 beats**, 8–12 standard explainers; **each beat earns its place** | `generate-events` + `timeline-modules`: target beat count + beat linkage; combine/remove redundant beats. Default cap **12**. |
| **Momentum into next card**; **cause → consequence** | Beat linkage blocks; enrichment **sequential reading** bridge (optional, factual). |
| **One clear point; concrete detail; forward-pull** | Titles: specific; descriptions: **concrete documented detail** + significance; voice: neutral/factual (not hype). |
| **Avoid vague transitions, stacked facts without linkage** | Explicit in titles + descriptions + image prompt rules. |
| **Factual, cumulative, clean** | Anti-hallucination + wire-service voice; chronological order. |

### 4. Visual contribution

| Status | Notes |
|--------|--------|
| **Aligned** | Enrichment builds **anchorStyle**, literal **imagePrompt** per event, theme coherence; image prompts include **one focal moment per beat** and arc-appropriate framing (GTM **pacing / layout** is partly product UI; **recognizable house style** is still partial—see matrix row 19). |
| **Gap** | Event-generation step does not score “visuals”—that is **by design** (step 5). |

### 5. Emotional or intellectual payoff

| Status | Notes |
|--------|--------|
| **Partial** | Enrichment asks for **significance**, **impact**, context in descriptions. |
| **Tension** | **Voice rules** (`buildEventDescriptionVoiceBlock`) push **neutral wire-service** tone—good for accuracy, but can **dampen** memorable payoffs or shareable phrasing unless the **Narrative** preset is interpreted loosely. Worth revisiting if flagship stories feel “flat.” |

### 6. Shareability

| Status | Notes |
|--------|--------|
| **Not in prompts** | Correct for factual/news generation—**shareability** is a **human/judgment** layer (and **CreationFlowCallout** step 6). Optional future: internal scoring or featured-curation only. |

---

## enrichment / voice vs rubric

- **Pro accuracy:** Strict neutrality reduces hallucination and editorial bias.
- **Con vs rubric “payoff” & “share”:** May produce text that is **clear but not memorable**. If you need more “delight” for showcases, consider a **Flagship** or **Story** voice variant that still forbids fabrication but allows **mild** framing of documented impact (not loaded slang).

---

## Summary

| Dimension | Prompt alignment (high level) |
|-----------|-------------------------------------------|
| Premise | User + title rules; not a full “visitor test” |
| Arc | Progression + fiction strong; general factual: arc + beat-linkage prompts |
| Beats | Uniqueness + beat linkage; default cap 12 + ~8–12 target (GTM-aligned); user can raise for 12–15 cases |
| Visuals | Strong in enrichment |
| Payoff | OK via significance; voice may limit punch |
| Share | Editor UX + rubric doc; not in generation prompts |

**Bottom line:** The stack is **strong on chronology, uniqueness, visual prompts, and beat linkage/pacing** (see matrix row 8 in [`product/FEATURE_PRIORITIZATION_MATRIX.md`](./product/FEATURE_PRIORITIZATION_MATRIX.md)). **Share-ready tone** remains mostly a human/editor layer. Use this doc when changing `generate-events`, `timeline-modules`, `enrichment-optimized.ts`, or `chat-skeleton.ts`.
