# Prompt & creation-flow alignment with the perfect-story rubric

This document records how **API prompts** and the **editor UI** line up with [`STORYWALL_PERFECT_STORY_RUBRIC.md`](./STORYWALL_PERFECT_STORY_RUBRIC.md) (six dimensions × 1–5, max 30).

## Where prompts live

| Area | Primary files |
|------|----------------|
| Event titles (beats) | `app/api/ai/generate-events/route.ts` (system + user prompts; Responses API + Chat Completions) |
| Modular factual user prompt | `lib/prompts/timeline-modules.ts` (`BASE_TIMELINE_PROMPT`, topic modules, `buildTimelinePrompt`) |
| Descriptions + image prompts + anchor | `lib/prompts/enrichment-optimized.ts` (`buildEnrichmentPrompt`, `buildEventDescriptionVoiceBlock`) |
| Route wrapper | `app/api/ai/generate-descriptions-v2/route.ts` (batching, newsworthiness, progression) |
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
| **Change made** | `BASE_TIMELINE_PROMPT` + factual blocks now include a **StoryWall narrative arc** line: prefer a readable arc when the topic supports it, avoid padding. |

### 3. Beat selection and pacing

| Status | Notes |
|--------|--------|
| **Aligned** | Strong **uniqueness** rules; “quality over quantity”; progression stages. |
| **Tension** | User-facing **max events** defaults (e.g. 20) and some branches say “MUST generate N events,” which can **fight** the rubric’s **6–12** ideal. The prompts also say not to fabricate to reach N—those instructions are in tension. **Mitigation:** narrative-arc + uniqueness language; product default / UX is a separate knob. |

### 4. Visual contribution

| Status | Notes |
|--------|--------|
| **Aligned** | Enrichment builds **anchorStyle**, literal **imagePrompt** per event, theme coherence. |
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

| Dimension | Prompt alignment (before follow-up edits) |
|-----------|-------------------------------------------|
| Premise | User + title rules; not a full “visitor test” |
| Arc | Progression + fiction strong; general factual improved via arc snippet |
| Beats | Uniqueness strong; count pressure from maxEvents |
| Visuals | Strong in enrichment |
| Payoff | OK via significance; voice may limit punch |
| Share | Editor UX + rubric doc; not in generation prompts |

**Bottom line:** The stack was already **strong on chronology, uniqueness, and visual prompts**. It was **not fully explicit** on **story-shaped factual arcs** or **share-ready tone**—addressed in part by prompt snippets + ongoing UX. Use this doc when changing `generate-events`, `timeline-modules`, or `enrichment-optimized.ts`.
