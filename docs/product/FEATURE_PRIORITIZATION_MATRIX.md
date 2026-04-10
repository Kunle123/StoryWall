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

**GitHub issues** are referenced where they exist; some rows are **strategy-only** (GTM memo, prompt work). **Status** reflects the repo + app as of the last update below—revisit after each release.

---

## Matrix

| # | Feature / initiative | Information | Virality | Complexity | Cpx (1–5) | Status | Reference |
|---|------------------------|-------------|----------|------------|-----------|--------|-----------|
| 1 | **Conversational skeleton API** (`/api/ai/timeline-skeleton`) | H | M | M | 3 | Implemented | [#37](https://github.com/Kunle123/StoryWall/issues/37) |
| 2 | **`/editor/chat` beta page** (propose milestones) | H | M | S | 2 | Partial | [#39](https://github.com/Kunle123/StoryWall/issues/39) — list view; no checklist edits / handoff yet |
| 3 | **Generate-from-skeleton handoff** (skip event LLM → descriptions/images) | H | M | L | 5 | Not implemented | [#38](https://github.com/Kunle123/StoryWall/issues/38) |
| 4 | **Skeleton checklist** (add/remove/edit beats in UI) | H | L | M | 3 | Not implemented | [#39](https://github.com/Kunle123/StoryWall/issues/39) |
| 5 | **Multi-turn chat planner API** | H | M | L | 5 | Not implemented | [#40](https://github.com/Kunle123/StoryWall/issues/40) |
| 6 | **Single default narrative tone** (conversational path) | H | M | M | 3 | Not implemented | [#41](https://github.com/Kunle123/StoryWall/issues/41) |
| 7 | **Prompt: objective verifiability** (replace controversy % caps in base prompts) | H | L | M | 3 | Partial | `chat-skeleton` uses stricter rules; `timeline-modules` / main `generate-events` still carry legacy controversy guidance |
| 8 | **Prompt: beat linkage & pacing** (one beat = one shift; forward-pull) | H | M | M | 3 | Partial | Narrative-arc lines in `BASE_TIMELINE_PROMPT` / `generate-events`; not fully aligned with GTM card-level rules |
| 9 | **Default / recommended beat count** (8–12 UX + guardrails vs 19) | H | H | S | 2 | Not implemented | GTM guidance in docs; editor defaults e.g. `maxEvents` not retuned to 8–12 in UI |
| 10 | **Classic editor** (multi-step: premise → events → details → images) | H | M | L | 4 | Implemented | Core product |
| 11 | **AI generate events** (`generate-events`) | H | M | L | 4 | Implemented | Core product |
| 12 | **AI descriptions + images** (`generate-descriptions-v2`, Imagen) | H | H | L | 5 | Implemented | Core product |
| 13 | **Discover / Explore** (feed, spotlight, expandable inline timeline) | M | H | L | 4 | Implemented | [#7](https://github.com/Kunle123/StoryWall/issues/7) [#26](https://github.com/Kunle123/StoryWall/issues/26) |
| 14 | **How it works + flagship examples** on Discover | M | H | M | 3 | Partial | Tabs + copy shipped; “3 flagship” examples / demo video still tracked under [#16](https://github.com/Kunle123/StoryWall/issues/16) |
| 15 | **Timeline & story public pages** (readable, OG, share) | M | H | L | 4 | Implemented | Core product |
| 16 | **Share flows** (Twitter thread, TikTok, copy link, menus) | L | H | M | 3 | Implemented | Core product |
| 17 | **Comments on timelines** | M | M | M | 3 | Implemented | Core product |
| 18 | **Statistics timeline mode** | M | M | L | 4 | Implemented | Core product |
| 19 | **Visual house style** (consistent grammar: dial, cards, crop rules) | L | H | L | 5 | Partial | Shared UI patterns; full GTM “one glance = Storywall” bar not closed |
| 20 | **Homepage / wedge copy** (context-first positioning) | M | H | S | 2 | Partial | Wedge + discover work shipped; full “context-first” headline swap optional per [#15](https://github.com/Kunle123/StoryWall/issues/15) / GTM |
| 21 | **Funnel analytics (GA)** | M | H | M | 3 | Implemented | `lib/analytics` + GA ID when configured · [#17](https://github.com/Kunle123/StoryWall/issues/17) |
| 22 | **In-app feedback capture** | M | M | S | 2 | Implemented | Feedback entry points (e.g. header / discover) · [#18](https://github.com/Kunle123/StoryWall/issues/18) |
| 23 | **User research / moderated tests** | H | M | M | 3 | Not implemented | Process / [#19](https://github.com/Kunle123/StoryWall/issues/19) — not a shipped feature |
| 24 | **Founder-led distribution** (“context reply” playbook) | M | H | S | 2 | Partial | [GTM memo](./GTM-one-page-memo.md) describes it; execution is ops, not code |
| 25 | **Free tier messaging** (no monetisation sprint) | L | M | S | 2 | Partial | Copy scattered; full treatment under [#21](https://github.com/Kunle123/StoryWall/issues/21) |
| 26 | **Private beta gates checklist** | M | M | S | 2 | Partial | [`LAUNCH_GATES_CHECKLIST.md`](./LAUNCH_GATES_CHECKLIST.md) etc. — living checklist, not automated |
| 27 | **Technical SEO** (sitemap, GSC, OG hygiene) | L | H | M | 3 | Implemented | [#25](https://github.com/Kunle123/StoryWall/issues/25) closed — code/docs + crawl fixes shipped; **ongoing ops:** GSC monitoring + re-scrape after metadata changes ([`SHARING_AND_SEO.md`](../SHARING_AND_SEO.md)) |
| 28 | **Remix / create-your-own from a story** | M | H | L | 5 | Not implemented | [#23](https://github.com/Kunle123/StoryWall/issues/23) |
| 29 | **Token grants on publish** | L | M | M | 3 | Not implemented | [#4](https://github.com/Kunle123/StoryWall/issues/4) |
| 30 | **Leaderboard** | L | H | M | 3 | Not implemented | [#5](https://github.com/Kunle123/StoryWall/issues/5) |
| 31 | **Collection pages** | M | H | L | 4 | Not implemented | [#6](https://github.com/Kunle123/StoryWall/issues/6) |
| 32 | **Optional publish score / rubric** | H | M | L | 4 | Partial | Rubric docs exist; in-product score under [#8](https://github.com/Kunle123/StoryWall/issues/8) not shipped |
| 33 | **Admin API hardening** | L | L | M | 3 | Partial | Admin routes exist; hardening scope open · [#9](https://github.com/Kunle123/StoryWall/issues/9) |
| 34 | **Seed data + discoverability** | M | H | M | 3 | Partial | Seed scripts / admin seed; not “done” as a product surface · [#10](https://github.com/Kunle123/StoryWall/issues/10) |
| 35 | **Redis / KV cache** | L | L | L | 4 | Not implemented | [#11](https://github.com/Kunle123/StoryWall/issues/11) |
| 36 | **Legal / compliance pass** | M | L | M | 3 | Partial | Legal pages / terms flows; ongoing · [#12](https://github.com/Kunle123/StoryWall/issues/12) |
| 37 | **Twitter API cleanup** | L | M | M | 3 | Partial | Share integrations exist; cleanup ticket open · [#13](https://github.com/Kunle123/StoryWall/issues/13) |
| 38 | **Budget guardrails doc** | L | L | S | 1 | Partial | Strategy docs · [#22](https://github.com/Kunle123/StoryWall/issues/22) |
| 39 | **Week 4 small beta + user stories** | H | H | M | 3 | Not implemented | Program under [#24](https://github.com/Kunle123/StoryWall/issues/24) |
| 40 | **Community / creator beta** (context storytelling, 70/30 craft vs product) | H | H | M | 3 | Not implemented | GTM plan; no dedicated community product row yet |
| 41 | **Embeds** (timeline on external sites) | M | H | L | 5 | Not implemented | Future · GTM memo |
| 42 | **Collaboration / team plans** | L | M | L | 5 | Not implemented | Future · GTM memo |

---

## Copy-paste CSV (for Sheets / Excel bubble chart)

```csv
ID,Feature,Information,Virality,Complexity,Cpx,Status
1,Conversational skeleton API,H,M,M,3,Implemented
2,Editor chat page,H,M,S,2,Partial
3,Generate-from-skeleton,H,M,L,5,Not implemented
4,Skeleton checklist UI,H,M,M,3,Not implemented
5,Multi-turn planner,H,M,L,5,Not implemented
6,Single narrative tone,H,M,M,3,Not implemented
7,Prompt objective verifiability,H,L,M,3,Partial
8,Prompt beat linkage,H,M,M,3,Partial
9,Default beat count 8-12,H,H,S,2,Not implemented
10,Classic editor,H,M,L,4,Implemented
11,AI generate events,H,M,L,4,Implemented
12,AI descriptions + images,H,H,L,5,Implemented
13,Discover Explore,M,H,L,4,Implemented
14,How it works + examples,M,H,M,3,Partial
15,Timeline story pages,M,H,L,4,Implemented
16,Share flows,L,H,M,3,Implemented
17,Comments,M,M,M,3,Implemented
18,Statistics timelines,M,M,L,4,Implemented
19,Visual house style,L,H,L,5,Partial
20,Homepage wedge copy,M,H,S,2,Partial
21,Funnel analytics,M,H,M,3,Implemented
22,Feedback capture,M,M,S,2,Implemented
23,User research,H,M,M,3,Not implemented
24,Founder distribution,M,H,S,2,Partial
25,Free tier messaging,L,M,S,2,Partial
26,Beta gates,M,M,S,2,Partial
27,Technical SEO,L,H,M,3,Implemented
28,Remix,M,H,L,5,Not implemented
29,Token grants,L,M,M,3,Not implemented
30,Leaderboard,L,H,M,3,Not implemented
31,Collections,M,H,L,4,Not implemented
32,Publish rubric,H,M,L,4,Partial
33,Admin hardening,L,L,M,3,Partial
34,Seed discoverability,M,H,M,3,Partial
35,Redis cache,L,L,L,4,Not implemented
36,Legal compliance,M,L,M,3,Partial
37,Twitter API cleanup,L,M,M,3,Partial
38,Budget guardrails,L,L,S,1,Partial
39,Small beta,H,H,M,3,Not implemented
40,Creator community,H,H,M,3,Not implemented
41,Embeds,M,H,L,5,Not implemented
42,Collaboration,L,M,L,5,Not implemented
```

### Bubble chart in Google Sheets (quick path)

1. Import the CSV or paste the table.
2. Add numeric columns for plotting, e.g. **Info_n**: H=3, M=2, L=1 · **Vir_n**: same · keep **Cpx** as bubble size.
3. Insert → Chart → **Bubble chart** · X = Info_n, Y = Vir_n, **Size = Cpx** (or `Cpx^2` if you want stronger size contrast).

### Axis swap

You can swap axes (e.g. Virality on X, Information on Y); bubble size should stay **Cpx** so complexity remains visually obvious.

---

## Maintenance

- Re-score after shipping or when scope changes.
- Link new GitHub issues as rows here or in a follow-on table.

*Last updated: 2026-04-04 — #25 Technical SEO closed; matrix row 27 marked Implemented (ongoing ops: GSC + preview refresh).*
