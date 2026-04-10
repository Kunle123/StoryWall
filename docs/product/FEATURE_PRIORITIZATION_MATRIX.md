# Feature prioritization matrix (information × virality × complexity)

Use this table to compare initiatives and to build a **bubble chart**: plot **Information** on one axis, **Virality** on the other, and set **bubble size** from **Complexity** (1–5 — larger = more effort/risk).

**Scoring (subjective — adjust as a team):** We use **numeric scores only**, not Low / Medium / High labels, so axes stay comparable across updates and tools (Sheets, Manus, etc.).

| Column | Values |
|--------|--------|
| **Information** | **1–10** (higher = stronger impact on factual quality, deliberation, or narrative correctness of stories) |
| **Virality** | **1–10** (higher = stronger lift to sharing, distribution, or platform spread) |
| **Complexity** | **1–5** (bubble size: **1** = smallest · **5** = largest effort/risk) |
| **Status** | **Implemented** = live in `main` / production path · **Partial** = shipped slice, docs-only, or materially incomplete vs intent · **Prioritised** = actively chosen next / high attention (process or product) · **Not implemented** = not built, or GTM-only with no product artifact yet |

**Description** explains what each initiative is for. **Ref** points to [GitHub issues](https://github.com/Kunle123/StoryWall/issues), strategy docs, code paths, or shorthand (**Core** = core shipped paths). **Status** reflects the repo + app as of the last update below—revisit after each release.

Canonical **CSV** (same as bubble / Sheets source) is in the [Copy-paste CSV](#copy-paste-csv-for-sheets--excel-bubble-chart) section below.

---

## Matrix

| # | Feature | Description | Information | Virality | Complexity | Status | Ref |
|---|---------|-------------|-------------|----------|------------|--------|-----|
| 1 | **Conversational skeleton API** | Server route that returns a skeleton only: dated milestone titles (and optional sources) from user context—no full event LLM pass yet. Powers chat-driven planning before enrichment. | 8 | 5 | 3 | Implemented | [#37](https://github.com/Kunle123/StoryWall/issues/37) |
| 2 | **Editor chat page** | In-app chat UI to propose beats with the model; today list-style output. Missing: checklist edits, generate-from-skeleton handoff. | 7 | 5 | 2 | Partial | [#39](https://github.com/Kunle123/StoryWall/issues/39) |
| 3 | **Generate-from-skeleton** | Once a skeleton exists, skip the heavy generate-events step and pipe milestones straight into descriptions + images to save cost and avoid duplicate generation. | 9 | 6 | 5 | Not implemented | [#38](https://github.com/Kunle123/StoryWall/issues/38) |
| 4 | **Skeleton checklist UI** | CRUD + reorder for skeleton rows before committing—so creators curate beats without regenerating from scratch. | 8 | 3 | 3 | Not implemented | [#39](https://github.com/Kunle123/StoryWall/issues/39) |
| 5 | **Multi-turn chat planner** | Backend that supports back-and-forth refinement of scope, timeframe, and beat list before any generation—beyond single-shot skeleton. | 9 | 6 | 5 | Not implemented | [#40](https://github.com/Kunle123/StoryWall/issues/40) |
| 6 | **Single narrative tone** | Pick one default writing preset for the conversational flow so tone is consistent without extra toggles. | 7 | 5 | 3 | Not implemented | [#41](https://github.com/Kunle123/StoryWall/issues/41) |
| 7 | **Prompt: obj. verifiability** | Replace legacy 20–30% controversy-style caps with verifiable-headline rules everywhere (timeline-modules, generate-events). | 8 | 2 | 3 | Partial | Strategy · see `PROMPT_RUBRIC_ALIGNMENT.md` |
| 8 | **Prompt: beat linkage & pacing** | Prompts require one meaningful shift per beat, causal ordering where facts allow, and specific titles; enrichment may add a short bridge to the prior beat. | 8 | 5 | 3 | Implemented | [GTM memo](./GTM-one-page-memo.md) · prompts codebase |
| 9 | **Default beat count 8–12** | Prompts + API/editor default maxEvents = 12 with ~8–12 target and ceiling-not-quota copy; helper text explains readability aim. | 8 | 8 | 2 | Implemented | [GTM memo](./GTM-one-page-memo.md) |
| 10 | **Classic editor** | Primary wizard create flow: premise → AI events → details → images—the main shipped editor experience. | 8 | 5 | 4 | Implemented | Core · `components/timeline-editor` |
| 11 | **AI generate events** | `/api/ai/generate-events`: produces dated titles from a description (factual vs creative branches, progression detection, recency). | 8 | 6 | 4 | Implemented | Core · `app/api/ai/generate-events` |
| 12 | **AI descriptions + images** | Step 3 enrichment: neutral descriptions, imagePrompt per beat, anchorStyle; Vertex/Imagen integration. | 9 | 9 | 5 | Implemented | Core · `generate-descriptions-v2` · `enrichment-optimized` |
| 13 | **Discover / Explore** | Discovery surface: feeds, spotlight, inline expandable timelines for browsing without full navigation. | 5 | 9 | 4 | Implemented | [#7](https://github.com/Kunle123/StoryWall/issues/7) [#26](https://github.com/Kunle123/StoryWall/issues/26) |
| 14 | **How it works + examples** | Onboarding copy (tabs, how-it-works) plus flagship examples and optional demo assets on Discover. | 5 | 8 | 3 | Prioritised | [#16](https://github.com/Kunle123/StoryWall/issues/16) |
| 15 | **Timeline story pages** | Public slug pages for stories: readable layout, Open Graph, share metadata. | 5 | 8 | 4 | Implemented | Core · app router public timelines |
| 16 | **Share flows** | Export/share UX: thread generator, short-form hooks, copy link, overflow menus. | 2 | 9 | 3 | Implemented | Core |
| 17 | **Comments** | Discussion attached to public (or eligible) timelines—engagement loop. | 4 | 5 | 3 | Implemented | Core |
| 18 | **Statistics timeline mode** | Data-forward timeline variant: emphasis on stats, charts, or quantitative beats vs purely narrative cards. | 5 | 5 | 4 | Implemented | Core |
| 19 | **Visual house style** | Brand-consistent UI grammar: dials, cards, crops, motion—so StoryWall is recognizable at a glance. | 2 | 8 | 5 | Prioritised | [GTM memo](./GTM-one-page-memo.md) |
| 20 | **Homepage / wedge copy** | Marketing homepage copy emphasizing context-first storytelling vs hot-take feeds (wedge positioning). | 4 | 8 | 2 | Implemented | [#15](https://github.com/Kunle123/StoryWall/issues/15) · Discover **How** + `/` metadata; remix row 28 not shipped |
| 21 | **Funnel analytics (GA)** | Google Analytics (or configured ID) for funnel steps and key events—measure acquisition and activation. | 4 | 7 | 3 | Implemented | [#17](https://github.com/Kunle123/StoryWall/issues/17) · `lib/analytics` |
| 22 | **In-app feedback capture** | Feedback entry points (header, discover, etc.) to capture qualitative product input. | 4 | 4 | 2 | Implemented | [#18](https://github.com/Kunle123/StoryWall/issues/18) |
| 23 | **User research / moderated tests** | Process: moderated sessions, not a shipped UI—track program and learnings in issues. | 8 | 4 | 3 | Prioritised | [#19](https://github.com/Kunle123/StoryWall/issues/19) |
| 24 | **Founder-led distribution** | GTM ops playbook: reply/join conversations with context-card style posts—distribution without new product surface. | 4 | 8 | 2 | Prioritised | [#20](https://github.com/Kunle123/StoryWall/issues/20) · [GTM memo](./GTM-one-page-memo.md) |
| 25 | **Free tier messaging** | Clear free-tier limits and expectations across marketing and product (no full monetisation build). | 2 | 5 | 2 | Partial | [#21](https://github.com/Kunle123/StoryWall/issues/21) |
| 26 | **Private beta gates checklist** | Launch checklist before private beta (quality, legal, support)—living doc, not automated CI. | 4 | 4 | 2 | Prioritised | [#14](https://github.com/Kunle123/StoryWall/issues/14) · [`LAUNCH_GATES_CHECKLIST.md`](./LAUNCH_GATES_CHECKLIST.md) §1 |
| 27 | **Technical SEO** | Sitemap, canonical URLs, OG tags, Search Console hygiene; ongoing re-scrape after metadata changes. | 2 | 8 | 3 | Implemented | [#25](https://github.com/Kunle123/StoryWall/issues/25) · [`SHARING_AND_SEO.md`](../SHARING_AND_SEO.md) |
| 28 | **Remix / create-your-own** | Fork a public story into your own editable timeline—viral loop for creation. | 5 | 9 | 5 | Not implemented | [#23](https://github.com/Kunle123/StoryWall/issues/23) |
| 29 | **Token grants on publish** | Economics experiment: grant API credits or tokens when publishing to reward shipping stories. | 2 | 5 | 3 | Not implemented | [#4](https://github.com/Kunle123/StoryWall/issues/4) |
| 30 | **Leaderboard** | Public ranking of creators or stories (scope TBD)—engagement and competition. | 2 | 7 | 3 | Not implemented | [#5](https://github.com/Kunle123/StoryWall/issues/5) |
| 31 | **Collection pages** | Curated group pages listing multiple related timelines (topics, series, editors). | 5 | 8 | 4 | Not implemented | [#6](https://github.com/Kunle123/StoryWall/issues/6) |
| 32 | **Optional publish rubric** | Optional score at publish time against the perfect-story rubric—coaching without blocking ship. | 8 | 5 | 4 | Partial | [#8](https://github.com/Kunle123/StoryWall/issues/8) · `STORYWALL_PERFECT_STORY_RUBRIC.md` |
| 33 | **Admin API hardening** | Secure admin routes: auth, rate limits, input validation, audit—reduce abuse and data leaks. | 2 | 1 | 3 | Partial | [#9](https://github.com/Kunle123/StoryWall/issues/9) |
| 34 | **Seed data + discoverability** | Seed scripts and admin tools so Discover has exemplar content and tests aren't empty. | 4 | 7 | 3 | Prioritised | [#10](https://github.com/Kunle123/StoryWall/issues/10) |
| 35 | **Redis / KV cache** | Edge or server cache (Redis/KV) for hot reads—latency and cost at scale. | 1 | 1 | 4 | Not implemented | [#11](https://github.com/Kunle123/StoryWall/issues/11) |
| 36 | **Legal / compliance pass** | Terms, privacy, age, content policies appropriate for beta and distribution channels. | 4 | 2 | 3 | Prioritised | [#12](https://github.com/Kunle123/StoryWall/issues/12) |
| 37 | **Twitter API cleanup** | Reduce debt on X/Twitter share integrations (tokens, APIs, error handling). | 2 | 4 | 3 | Partial | [#13](https://github.com/Kunle123/StoryWall/issues/13) |
| 38 | **Budget guardrails doc** | Documented ceilings for AI spend and tokens per user/session—ops and finance clarity. | 1 | 1 | 1 | Partial | [#22](https://github.com/Kunle123/StoryWall/issues/22) |
| 39 | **Week 4 small beta** | Structured beta program (e.g. week 4) with captured user stories and outcomes. | 8 | 8 | 3 | Prioritised | [#24](https://github.com/Kunle123/StoryWall/issues/24) |
| 40 | **Community / creator beta** | Invite-only cohort with norms (context storytelling, craft vs product balance)—GTM + community, minimal product. | 8 | 9 | 3 | Prioritised | [GTM memo](./GTM-one-page-memo.md) |
| 41 | **Embeds** | oEmbed, iframe, or script so third-party sites embed a read-only timeline. | 5 | 9 | 5 | Not implemented | [GTM memo](./GTM-one-page-memo.md) |
| 42 | **Collaboration / team plans** | Shared workspaces, roles, and team billing for org use. | 2 | 5 | 5 | Not implemented | [GTM memo](./GTM-one-page-memo.md) |
| 43 | **Locality-aligned image generation** | Improve prompts and/or pipeline so illustrations match the story's real-world context: correct country/region, institution-appropriate architecture, geography that matches named places, and plausible diversity for the locale. Generic mechanism so any timeline's images align with requested information and locale, not one-off fixes. | 8 | 5 | 4 | Not implemented | `lib/prompts/enrichment-optimized` · `imagePrompt` |
| 44 | **Optional per-beat reference images** | Allow an optional direct image URL (or upload) per event to condition generation on a real landmark, car/livery, trophy, instrument, etc. Failure handling: treat refs as optional with fallback to text-only. Perf: extra validate + download + prepare per ref (network-bound); parallelize/cap concurrency; reuse prepared blob if same URL repeats. | 8 | 3 | 4 | Not implemented | `app/api/ai/generate-images` |

---

## Copy-paste CSV (for Sheets / Excel bubble chart)

Import this block as the **source of truth** for the bubble chart (matches independent Manus / Sheets edits when you paste updates here).

```csv
ID,Feature,Description,Information,Virality,Complexity,Status,Ref
1,"Conversational skeleton API","Server route that returns a skeleton only: dated milestone titles (and optional sources) from user context—no full event LLM pass yet. Powers chat-driven planning before enrichment.",8,5,3,"Implemented","#37"
2,"Editor chat page","In-app chat UI to propose beats with the model; today list-style output. Missing: checklist edits, generate-from-skeleton handoff.",7,5,2,"Partial","#39"
3,"Generate-from-skeleton","Once a skeleton exists, skip the heavy generate-events step and pipe milestones straight into descriptions + images to save cost and avoid duplicate generation.",9,6,5,"Not implemented","#38"
4,"Skeleton checklist UI","CRUD + reorder for skeleton rows before committing—so creators curate beats without regenerating from scratch.",8,3,3,"Not implemented","#39"
5,"Multi-turn chat planner","Backend that supports back-and-forth refinement of scope, timeframe, and beat list before any generation—beyond single-shot skeleton.",9,6,5,"Not implemented","#40"
6,"Single narrative tone","Pick one default writing preset for the conversational flow so tone is consistent without extra toggles.",7,5,3,"Not implemented","#41"
7,"Prompt: obj. verifiability","Replace legacy 20–30% controversy-style caps with verifiable-headline rules everywhere (timeline-modules, generate-events).",8,2,3,"Partial","Strategy"
8,"Prompt: beat linkage & pacing","Prompts require one meaningful shift per beat, causal ordering where facts allow, and specific titles; enrichment may add a short bridge to the prior beat.",8,5,3,"Implemented","GTM memo"
9,"Default beat count 8–12","Prompts + API/editor default maxEvents = 12 with ~8–12 target and ceiling-not-quota copy; helper text explains readability aim.",8,8,2,"Implemented","GTM memo"
10,"Classic editor","Primary wizard create flow: premise → AI events → details → images—the main shipped editor experience.",8,5,4,"Implemented","Core"
11,"AI generate events","/api/ai/generate-events: produces dated titles from a description (factual vs creative branches, progression detection, recency).",8,6,4,"Implemented","Core"
12,"AI descriptions + images","Step 3 enrichment: neutral descriptions, imagePrompt per beat, anchorStyle; Vertex/Imagen integration.",9,9,5,"Implemented","Core"
13,"Discover / Explore","Discovery surface: feeds, spotlight, inline expandable timelines for browsing without full navigation.",5,9,4,"Implemented","#7 #26"
14,"How it works + examples","Onboarding copy (tabs, how-it-works) plus flagship examples and optional demo assets on Discover.",5,8,3,"Prioritised","#16"
15,"Timeline story pages","Public slug pages for stories: readable layout, Open Graph, share metadata.",5,8,4,"Implemented","Core"
16,"Share flows","Export/share UX: thread generator, short-form hooks, copy link, overflow menus.",2,9,3,"Implemented","Core"
17,"Comments","Discussion attached to public (or eligible) timelines—engagement loop.",4,5,3,"Implemented","Core"
18,"Statistics timeline mode","Data-forward timeline variant: emphasis on stats, charts, or quantitative beats vs purely narrative cards.",5,5,4,"Implemented","Core"
19,"Visual house style","Brand-consistent UI grammar: dials, cards, crops, motion—so StoryWall is recognizable at a glance.",2,8,5,"Prioritised","GTM memo"
20,"Homepage / wedge copy","Marketing homepage copy emphasizing context-first storytelling vs hot-take feeds (wedge positioning).",4,8,2,"Implemented","#15"
21,"Funnel analytics (GA)","Google Analytics (or configured ID) for funnel steps and key events—measure acquisition and activation.",4,7,3,"Implemented","#17"
22,"In-app feedback capture","Feedback entry points (header, discover, etc.) to capture qualitative product input.",4,4,2,"Implemented","#18"
23,"User research / moderated tests","Process: moderated sessions, not a shipped UI—track program and learnings in issues.",8,4,3,"Prioritised","#19"
24,"Founder-led distribution","GTM ops playbook: reply/join conversations with context-card style posts—distribution without new product surface.",4,8,2,"Prioritised","#20"
25,"Free tier messaging","Clear free-tier limits and expectations across marketing and product (no full monetisation build).",2,5,2,"Partial","#21"
26,"Private beta gates checklist","Launch checklist before private beta (quality, legal, support)—living doc, not automated CI.",4,4,2,"Prioritised","#14"
27,"Technical SEO","Sitemap, canonical URLs, OG tags, Search Console hygiene; ongoing re-scrape after metadata changes.",2,8,3,"Implemented","#25"
28,"Remix / create-your-own","Fork a public story into your own editable timeline—viral loop for creation.",5,9,5,"Not implemented","#23"
29,"Token grants on publish","Economics experiment: grant API credits or tokens when publishing to reward shipping stories.",2,5,3,"Not implemented","#4"
30,"Leaderboard","Public ranking of creators or stories (scope TBD)—engagement and competition.",2,7,3,"Not implemented","#5"
31,"Collection pages","Curated group pages listing multiple related timelines (topics, series, editors).",5,8,4,"Not implemented","#6"
32,"Optional publish rubric","Optional score at publish time against the perfect-story rubric—coaching without blocking ship.",8,5,4,"Partial","#8"
33,"Admin API hardening","Secure admin routes: auth, rate limits, input validation, audit—reduce abuse and data leaks.",2,1,3,"Partial","#9"
34,"Seed data + discoverability","Seed scripts and admin tools so Discover has exemplar content and tests aren't empty.",4,7,3,"Prioritised","#10"
35,"Redis / KV cache","Edge or server cache (Redis/KV) for hot reads—latency and cost at scale.",1,1,4,"Not implemented","#11"
36,"Legal / compliance pass","Terms, privacy, age, content policies appropriate for beta and distribution channels.",4,2,3,"Prioritised","#12"
37,"Twitter API cleanup","Reduce debt on X/Twitter share integrations (tokens, APIs, error handling).",2,4,3,"Partial","#13"
38,"Budget guardrails doc","Documented ceilings for AI spend and tokens per user/session—ops and finance clarity.",1,1,1,"Partial","#22"
39,"Week 4 small beta","Structured beta program (e.g. week 4) with captured user stories and outcomes.",8,8,3,"Prioritised","#24"
40,"Community / creator beta","Invite-only cohort with norms (context storytelling, craft vs product balance)—GTM + community, minimal product.",8,9,3,"Prioritised","GTM memo"
41,"Embeds","oEmbed, iframe, or script so third-party sites embed a read-only timeline.",5,9,5,"Not implemented","GTM memo"
42,"Collaboration / team plans","Shared workspaces, roles, and team billing for org use.",2,5,5,"Not implemented","GTM memo"
43,"Locality-aligned image generation","Improve prompts and/or pipeline so illustrations match the story's real-world context: correct country/region, institution-appropriate architecture, geography that matches named places, and plausible diversity for the locale. Generic mechanism so any timeline's images align with requested information and locale, not one-off fixes.",8,5,4,"Not implemented","enrichment-optimized"
44,"Optional per-beat reference images","Allow an optional direct image URL (or upload) per event to condition generation on a real landmark, car/livery, trophy, instrument, etc. Failure handling: treat refs as optional with fallback to text-only. Perf: extra validate + download + prepare per ref (network-bound); parallelize/cap concurrency; reuse prepared blob if same URL repeats.",8,3,4,"Not implemented","generate-images"
```

### Bubble chart in Google Sheets (quick path)

1. Import the CSV above. Columns: `ID`, `Feature`, `Description`, `Information`, `Virality`, `Complexity`, `Status`, `Ref`.
2. Insert → Chart → **Bubble chart** · X = **Information**, Y = **Virality**, **Size** = **Complexity** (or Complexity² for stronger contrast).

### Axis swap

You can swap axes (e.g. Virality on X, Information on Y); bubble size should stay **Complexity** so effort stays visually obvious.

---

## Maintenance

- Re-score after shipping or when scope changes.
- When you update the bubble chart in Manus/Sheets, **paste the revised CSV** into the block above and align the **Matrix** table (or edit the table and regenerate CSV).
- When creating a GitHub issue for a row, add its number to **Ref** and link it here, then set the project’s **Matrix #** field (see `scripts/gh-board-set-matrix.sh` in [`BOARD_PRIORITY.md`](./BOARD_PRIORITY.md)).

*Last updated: 2026-03-28 — Scoring is numeric (not L/M/H); CSV + **Prioritised** / Ref aligned with Manus export.*
