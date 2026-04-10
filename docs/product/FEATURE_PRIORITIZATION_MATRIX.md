# Feature prioritization matrix (information × virality × complexity)

Use this table to compare initiatives and to build a **bubble chart**: plot **Information** on one axis, **Virality** on the other, and set **bubble size** from **Complexity (1–5)** (larger number = bigger bubble = more effort/risk).

**Scale (subjective — adjust as a team):**

| Column | Values |
|--------|--------|
| **Information** | **H** = clearly improves factual quality, deliberation, or narrative correctness of stories · **M** = indirect or partial · **L** = little or no impact on story information quality |
| **Virality** | **H** = strong lift to sharing, distribution, or platform spread · **M** = moderate · **L** = low |
| **Complexity** | **S** = small change (days) · **M** = medium (roughly 1–3 weeks) · **L** = large (multi-week / systemic) |
| **Cpx (1–5)** | **1** = smallest bubble · **5** = largest (maps to S=2, M=3, L=5; tweak as you like) |
| **Status** | **Implemented** = live in `main` / production path · **Partial** = shipped slice, docs/checklist only, or materially incomplete vs intent · **Not implemented** = not built, or process/GTM only with no product artifact yet |

**Description** explains what each initiative is for. **Issues** lists [Kunle123/StoryWall](https://github.com/Kunle123/StoryWall/issues) tickets when they exist; **—** means no tracked issue yet (strategy, prompt-only, or core product without a single umbrella ticket). **Reference** points to code, docs, or nuance not captured in the issue title. **Status** reflects the repo + app as of the last update below—revisit after each release.

---

## Matrix

| # | Feature / initiative | Description | Information | Virality | Complexity | Cpx (1–5) | Status | Issues | Reference |
|---|----------------------|-------------|-------------|----------|------------|-----------|--------|--------|-----------|
| 1 | **Conversational skeleton API** (`/api/ai/timeline-skeleton`) | Server route that returns a **skeleton only**: dated milestone titles (and optional sources) from user context—no full event LLM pass yet. Powers chat-driven planning before enrichment. | H | M | M | 3 | Implemented | [#37](https://github.com/Kunle123/StoryWall/issues/37) | `app/api/ai/timeline-skeleton` · `lib/prompts/chat-skeleton.ts` |
| 2 | **`/editor/chat` beta page** (propose milestones) | In-app **chat UI** to propose beats with the model; today **list-style** output. Missing: checklist edits, generate-from-skeleton handoff. | H | M | S | 2 | Partial | [#39](https://github.com/Kunle123/StoryWall/issues/39) | Feature-flagged editor entry; see row 3–4 for follow-ons |
| 3 | **Generate-from-skeleton handoff** (skip event LLM → descriptions/images) | Once a skeleton exists, **skip** the heavy `generate-events` step and pipe milestones straight into **descriptions + images** to save cost and avoid duplicate generation. | H | M | L | 5 | Not implemented | [#38](https://github.com/Kunle123/StoryWall/issues/38) | Depends on stable skeleton schema + UI handoff |
| 4 | **Skeleton checklist** (add/remove/edit beats in UI) | **CRUD + reorder** for skeleton rows before committing—so creators curate beats without regenerating from scratch. | H | L | M | 3 | Not implemented | [#39](https://github.com/Kunle123/StoryWall/issues/39) | Overlaps chat page scope; may split into sub-issues later |
| 5 | **Multi-turn chat planner API** | Backend that supports **back-and-forth refinement** of scope, timeframe, and beat list before any generation—beyond single-shot skeleton. | H | M | L | 5 | Not implemented | [#40](https://github.com/Kunle123/StoryWall/issues/40) | Distinct from one-shot `timeline-skeleton` |
| 6 | **Single default narrative tone** (conversational path) | Pick **one default writing preset** for the conversational flow so tone is consistent without extra toggles. | H | M | M | 3 | Not implemented | [#41](https://github.com/Kunle123/StoryWall/issues/41) | Editor presets exist elsewhere; this row is conv-path default |
| 7 | **Prompt: objective verifiability** (replace controversy % caps in base prompts) | Replace legacy **“20–30% controversy”**-style caps with **verifiable-headline** rules everywhere (`timeline-modules`, `generate-events`). | H | L | M | 3 | Partial | — | `chat-skeleton` stricter; base prompts still mixed—see `PROMPT_RUBRIC_ALIGNMENT.md` |
| 8 | **Prompt: beat linkage & pacing** (one beat = one shift; forward-pull) | Prompts require **one meaningful shift per beat**, **causal ordering** where facts allow, and **specific titles**; enrichment may add a **short bridge** to the prior beat. | H | M | M | 3 | Implemented | — | `BASE_TIMELINE_PROMPT` · `generate-events` · `enrichment-optimized` · `chat-skeleton` |
| 9 | **Default / recommended beat count** (8–12 UX + guardrails vs 19) | **Prompts + API/editor default `maxEvents` = 12** with **~8–12** target and ceiling-not-quota copy; helper text explains readability aim. **6–8 fast social** still via user lowering the cap; no separate preset. | H | H | S | 2 | Partial | — | Matches GTM memo default ranges; “19 too long” addressed by default + prompts, not hard block |
| 10 | **Classic editor** (multi-step: premise → events → details → images) | Primary **wizard** create flow: premise → AI events → details → images—the main shipped editor experience. | H | M | L | 4 | Implemented | — | Core product paths under `components/timeline-editor` |
| 11 | **AI generate events** (`generate-events`) | **`/api/ai/generate-events`**: produces dated **titles** from a description (factual vs creative branches, progression detection, recency). | H | M | L | 4 | Implemented | — | `app/api/ai/generate-events/route.ts` |
| 12 | **AI descriptions + images** (`generate-descriptions-v2`, Imagen) | **Step 3 enrichment**: neutral descriptions, **imagePrompt** per beat, **anchorStyle**; Vertex/Imagen integration. | H | H | L | 5 | Implemented | — | `app/api/ai/generate-descriptions-v2` · `lib/prompts/enrichment-optimized.ts` |
| 13 | **Discover / Explore** (feed, spotlight, expandable inline timeline) | **Discovery surface**: feeds, spotlight, **inline expandable** timelines for browsing without full navigation. | M | H | L | 4 | Implemented | [#7](https://github.com/Kunle123/StoryWall/issues/7) [#26](https://github.com/Kunle123/StoryWall/issues/26) | Ongoing UX polish may file new issues |
| 14 | **How it works + flagship examples** on Discover | **Onboarding copy** (tabs, how-it-works) plus **flagship examples** and optional demo assets on Discover. | M | H | M | 3 | Partial | [#16](https://github.com/Kunle123/StoryWall/issues/16) | Partially shipped; flagship set / video tracked on #16 |
| 15 | **Timeline & story public pages** (readable, OG, share) | **Public slug pages** for stories: readable layout, **Open Graph**, share metadata. | M | H | L | 4 | Implemented | — | App router public timeline routes + metadata |
| 16 | **Share flows** (Twitter thread, TikTok, copy link, menus) | **Export/share UX**: thread generator, short-form hooks, copy link, overflow menus. | L | H | M | 3 | Implemented | — | Share components + menus |
| 17 | **Comments on timelines** | **Discussion** attached to public (or eligible) timelines—engagement loop. | M | M | M | 3 | Implemented | — | Comments API + UI |
| 18 | **Statistics timeline mode** | **Data-forward** timeline variant: emphasis on **stats, charts, or quantitative beats** vs purely narrative cards. | M | M | L | 4 | Implemented | — | Mode flag + UI branch |
| 19 | **Visual house style** (consistent grammar: dial, cards, crop rules) | **Brand-consistent UI grammar**: dials, cards, crops, motion—so StoryWall is recognizable at a glance. | L | H | L | 5 | Partial | — | Shared components; GTM “one glance” bar not fully closed |
| 20 | **Homepage / wedge copy** (context-first positioning) | **Marketing homepage** copy emphasizing **context-first** storytelling vs hot-take feeds (wedge positioning). | M | H | S | 2 | Partial | [#15](https://github.com/Kunle123/StoryWall/issues/15) | Discover **How** tab + `/` metadata updated 2026-04-10 for **read → share → remix** loop (matrix row 28); remix not shipped — copy is honest |
| 21 | **Funnel analytics (GA)** | **Google Analytics** (or configured ID) for funnel steps and key events—measure acquisition and activation. | M | H | M | 3 | Implemented | [#17](https://github.com/Kunle123/StoryWall/issues/17) | `lib/analytics` |
| 22 | **In-app feedback capture** | **Feedback entry points** (header, discover, etc.) to capture qualitative product input. | M | M | S | 2 | Implemented | [#18](https://github.com/Kunle123/StoryWall/issues/18) | May link to external form or inbox |
| 23 | **User research / moderated tests** | **Process**: moderated sessions, not a shipped UI—track program and learnings in issues. | H | M | M | 3 | Not implemented | [#19](https://github.com/Kunle123/StoryWall/issues/19) | Not a codebase feature by itself |
| 24 | **Founder-led distribution** (“context reply” playbook) | **GTM ops playbook**: reply/join conversations with **context-card** style posts—distribution without new product surface. | M | H | S | 2 | Partial | — | [GTM memo](./GTM-one-page-memo.md) |
| 25 | **Free tier messaging** (no monetisation sprint) | **Clear free-tier limits** and expectations across marketing and product (no full monetisation build). | L | M | S | 2 | Partial | [#21](https://github.com/Kunle123/StoryWall/issues/21) | Copy scattered until consolidated |
| 26 | **Private beta gates checklist** | **Launch checklist** before private beta (quality, legal, support)—living doc, not automated CI. | M | M | S | 2 | Partial | — | [`LAUNCH_GATES_CHECKLIST.md`](./LAUNCH_GATES_CHECKLIST.md) |
| 27 | **Technical SEO** (sitemap, GSC, OG hygiene) | **Sitemap**, canonical URLs, **OG** tags, Search Console hygiene; ongoing re-scrape after metadata changes. | L | H | M | 3 | Implemented | [#25](https://github.com/Kunle123/StoryWall/issues/25) | Closed; ops: [`SHARING_AND_SEO.md`](../SHARING_AND_SEO.md) |
| 28 | **Remix / create-your-own from a story** | **Fork** a public story into your own editable timeline—viral loop for creation. | M | H | L | 5 | Not implemented | [#23](https://github.com/Kunle123/StoryWall/issues/23) | |
| 29 | **Token grants on publish** | **Economics experiment**: grant API credits or tokens when publishing to reward shipping stories. | L | M | M | 3 | Not implemented | [#4](https://github.com/Kunle123/StoryWall/issues/4) | |
| 30 | **Leaderboard** | **Public ranking** of creators or stories (scope TBD)—engagement and competition. | L | H | M | 3 | Not implemented | [#5](https://github.com/Kunle123/StoryWall/issues/5) | |
| 31 | **Collection pages** | **Curated group pages** listing multiple related timelines (topics, series, editors). | M | H | L | 4 | Not implemented | [#6](https://github.com/Kunle123/StoryWall/issues/6) | |
| 32 | **Optional publish score / rubric** | **Optional score** at publish time against the perfect-story **rubric**—coaching without blocking ship. | H | M | L | 4 | Partial | [#8](https://github.com/Kunle123/StoryWall/issues/8) | Docs: `STORYWALL_PERFECT_STORY_RUBRIC.md`; in-product score not shipped |
| 33 | **Admin API hardening** | **Secure admin routes**: auth, rate limits, input validation, audit—reduce abuse and data leaks. | L | L | M | 3 | Partial | [#9](https://github.com/Kunle123/StoryWall/issues/9) | Admin exists; hardening scope open |
| 34 | **Seed data + discoverability** | **Seed scripts** and admin tools so **Discover** has exemplar content and tests aren’t empty. | M | H | M | 3 | Partial | [#10](https://github.com/Kunle123/StoryWall/issues/10) | “Done” as product surface still open |
| 35 | **Redis / KV cache** | **Edge or server cache** (Redis/KV) for hot reads—latency and cost at scale. | L | L | L | 4 | Not implemented | [#11](https://github.com/Kunle123/StoryWall/issues/11) | |
| 36 | **Legal / compliance pass** | **Terms, privacy, age, content** policies appropriate for beta and distribution channels. | M | L | M | 3 | Partial | [#12](https://github.com/Kunle123/StoryWall/issues/12) | Ongoing with counsel |
| 37 | **Twitter API cleanup** | **Reduce debt** on X/Twitter share integrations (tokens, APIs, error handling). | L | M | M | 3 | Partial | [#13](https://github.com/Kunle123/StoryWall/issues/13) | Share flows work; cleanup ticket open |
| 38 | **Budget guardrails doc** | **Documented ceilings** for AI spend and tokens per user/session—ops and finance clarity. | L | L | S | 1 | Partial | [#22](https://github.com/Kunle123/StoryWall/issues/22) | Strategy/docs |
| 39 | **Week 4 small beta + user stories** | **Structured beta program** (e.g. week 4) with captured **user stories** and outcomes. | H | H | M | 3 | Not implemented | [#24](https://github.com/Kunle123/StoryWall/issues/24) | Program tracking |
| 40 | **Community / creator beta** (context storytelling, 70/30 craft vs product) | **Invite-only cohort** with norms (context storytelling, craft vs product balance)—GTM + community, minimal product. | H | H | M | 3 | Not implemented | — | GTM plan; no umbrella issue yet |
| 41 | **Embeds** (timeline on external sites) | **oEmbed, iframe, or script** so third-party sites embed a read-only timeline. | M | H | L | 5 | Not implemented | — | Future; see GTM memo |
| 42 | **Collaboration / team plans** | **Shared workspaces**, roles, and **team billing** for org use. | L | M | L | 5 | Not implemented | — | Future; GTM memo |
| 43 | **Locality-aligned image generation** (geo + institutions + representation) | **Backlog — not implemented.** Improve prompts and/or pipeline so **illustrations match the story’s real-world context**: correct **country/region** (e.g. UK immigration debates → people and settings that read as **UK**, not US stock defaults); **institution-appropriate architecture** (e.g. **UK High Court** vs generic US courthouse); **geography** that matches named places (e.g. **Strait of Dover** vs fjord-like coastlines). **Representation:** when topics involve immigrants or diverse populations, depict **plausible diversity in that locality** (e.g. UK context → not “Black people only” as a stand-in for diversity). Goal: **generic mechanism** so any timeline’s images align with **requested information and locale**, not one-off fixes. | H | M | M | 4 | Not implemented | — | Targets `enrichment-optimized` / `imagePrompt`; may touch `generate-images` routing, anchor style, or reference retrieval |
| 44 | **Optional per-beat reference images** (venues, vehicles, objects — not faces) | **Backlog — not implemented.** Allow an **optional direct image URL** (or upload) per event to **condition** generation on a **real landmark, car/livery, trophy, instrument**, etc.—analogous to face refs but for **place/object accuracy** (e.g. Royal Albert Hall vs generic hall; F1 car **season/team livery**). **Failure handling:** treat refs as **optional** with **fallback to text-only** when validation/download fails so net **hard failures** need not increase vs today (new failure *modes* exist; graceful degradation avoids trading one error for another). **Perf:** extra **validate + download + prepare** per ref (network-bound); parallelize/cap concurrency; reuse prepared blob if same URL repeats. **Priority rules** when both person-ref and object-ref exist TBD. | H | L | L | 4 | Not implemented | — | `app/api/ai/generate-images` · prompt-only accuracy today (`enrichment-optimized` named-place/object rules); product discussion: optional refs + fallback |

---

## Copy-paste CSV (for Sheets / Excel bubble chart)

`Description` and `Issues` are included for filtering and joining to GitHub. **Issues** uses issue numbers only; multiple issues are separated by `|`. Empty **Issues** means no umbrella ticket.

```csv
ID,Feature,Description,Information,Virality,Complexity,Cpx,Status,Issues
1,Conversational skeleton API,Server route: skeleton-only dated milestone titles from user context; powers chat planning before enrichment.,H,M,M,3,Implemented,37
2,Editor chat page,In-app chat UI to propose beats; list-style today; checklist and handoff missing.,H,M,S,2,Partial,39
3,Generate-from-skeleton handoff,Skip generate-events and pipe skeleton into descriptions plus images.,H,M,L,5,Not implemented,38
4,Skeleton checklist UI,CRUD and reorder skeleton rows before committing.,H,L,M,3,Not implemented,39
5,Multi-turn planner API,Back-and-forth refinement of scope and beats before generation.,H,M,L,5,Not implemented,40
6,Single narrative tone,One default writing preset for conversational path.,H,M,M,3,Not implemented,41
7,Prompt objective verifiability,Replace legacy controversy caps with verifiable-headline rules in all base prompts.,H,L,M,3,Partial,
8,Prompt beat linkage and pacing,One shift per beat; causal ordering; optional bridge in enrichment.,H,M,M,3,Implemented,
9,Default beat count 8-12,Default maxEvents 12 prompts target 8-12 ceiling not quota.,H,H,S,2,Partial,
10,Classic editor,Wizard: premise to events to details to images.,H,M,L,4,Implemented,
11,AI generate events,API produces dated titles; factual and creative branches.,H,M,L,4,Implemented,
12,AI descriptions and images,Enrichment: descriptions; imagePrompt; anchorStyle; Imagen.,H,H,L,5,Implemented,
13,Discover Explore,Feeds; spotlight; inline expandable timelines.,M,H,L,4,Implemented,7|26
14,How it works and flagship examples,Onboarding copy and curated examples on Discover.,M,H,M,3,Partial,16
15,Timeline story pages,Public slug pages; readable layout; OG metadata.,M,H,L,4,Implemented,
16,Share flows,Thread; short-form; copy link; menus.,L,H,M,3,Implemented,
17,Comments,Discussion on public timelines.,M,M,M,3,Implemented,
18,Statistics timeline mode,Data-forward variant; stats and charts emphasis.,M,M,L,4,Implemented,
19,Visual house style,Unified UI grammar: dials; cards; crops.,L,H,L,5,Partial,
20,Homepage wedge copy,Context-first marketing homepage.,M,H,S,2,Partial,15
21,Funnel analytics,Google Analytics for funnel and key events.,M,H,M,3,Implemented,17
22,Feedback capture,In-product feedback entry points.,M,M,S,2,Implemented,18
23,User research,Moderated tests program; process not shipped UI.,H,M,M,3,Not implemented,19
24,Founder distribution,GTM playbook for context-style replies.,M,H,S,2,Partial,
25,Free tier messaging,Clear free-tier limits across surfaces.,L,M,S,2,Partial,21
26,Private beta gates checklist,Launch checklist before private beta.,M,M,S,2,Partial,
27,Technical SEO,Sitemap; canonical; OG; GSC hygiene.,L,H,M,3,Implemented,25
28,Remix from story,Fork public story into editable timeline.,M,H,L,5,Not implemented,23
29,Token grants on publish,Grant credits or tokens when publishing.,L,M,M,3,Not implemented,4
30,Leaderboard,Public ranking of creators or stories.,L,H,M,3,Not implemented,5
31,Collection pages,Curated pages listing multiple timelines.,M,H,L,4,Not implemented,6
32,Optional publish score,Score against rubric at publish time.,H,M,L,4,Partial,8
33,Admin API hardening,Secure admin routes and validation.,L,L,M,3,Partial,9
34,Seed data and discoverability,Seed scripts and exemplar content for Discover.,M,H,M,3,Partial,10
35,Redis KV cache,Edge or server cache for hot reads.,L,L,L,4,Not implemented,11
36,Legal compliance pass,Terms; privacy; age; content policies.,M,L,M,3,Partial,12
37,Twitter API cleanup,Debt on X or Twitter share integrations.,L,M,M,3,Partial,13
38,Budget guardrails doc,AI spend and token ceilings documented.,L,L,S,1,Partial,22
39,Week 4 small beta,Structured beta program with user stories.,H,H,M,3,Not implemented,24
40,Community creator beta,Invite cohort; GTM plus community.,H,H,M,3,Not implemented,
41,Embeds,Embed timelines on third-party sites.,M,H,L,5,Not implemented,
42,Collaboration team plans,Shared workspaces; roles; billing.,L,M,L,5,Not implemented,
43,Locality-aligned images,Geo institutions and diverse representation match timeline locale; generic not one-off.,H,M,M,4,Not implemented,
44,Optional per-beat object or venue refs,Optional URL per event for landmark vehicle object conditioning; fallback on failure; perf validate download prepare.,H,L,L,4,Not implemented,
```

### Bubble chart in Google Sheets (quick path)

1. Import the CSV or paste the table. Columns are: `ID`, `Feature`, `Description`, `Information`, `Virality`, `Complexity`, `Cpx`, `Status`, `Issues`.
2. Add numeric columns for plotting, e.g. **Info_n**: H=3, M=2, L=1 · **Vir_n**: same · keep **Cpx** as bubble size.
3. Insert → Chart → **Bubble chart** · X = Info_n, Y = Vir_n, **Size = Cpx** (or `Cpx^2` if you want stronger size contrast).

### Axis swap

You can swap axes (e.g. Virality on X, Information on Y); bubble size should stay **Cpx** so complexity remains visually obvious.

---

## Maintenance

- Re-score after shipping or when scope changes.
- When creating a GitHub issue for a row, add its number to **Issues** and link it here.
- Keep **Description** in sync when the initiative’s intent changes; **Reference** is for code paths and edge cases.

*Last updated: 2026-03-28 — Row 44 backlog: optional per-beat reference images for venues/vehicles/objects (fallback + perf notes).*
