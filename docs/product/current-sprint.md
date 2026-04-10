# Current sprint / week — StoryWall

**Cadence:** Update weekly. **Issues** are canonical; this file is a **summary**.

**Strategy:** [`LAUNCH_VALIDATION_STRATEGY.md`](./LAUNCH_VALIDATION_STRATEGY.md) · **Roadmap:** [`roadmap.md`](./roadmap.md)

## Priority legend (issues)

| Tier | Meaning |
|------|---------|
| **P0** | Do first — validation, positioning, Week 1 foundations |
| **P1** | Week 2–3 — research, distribution, messaging |
| **P2** | After signals — budget discipline, remix, public beta slice |
| **Eng** | Product/engineering backlog (parallel when capacity) |

### Prioritised (feature matrix)

These rows are marked **Prioritised** in [`FEATURE_PRIORITIZATION_MATRIX.md`](./FEATURE_PRIORITIZATION_MATRIX.md) — high attention across product and GTM.

| Row | Topic | Driver | Next action |
|-----|--------|--------|-------------|
| **14** | How it works + flagship examples | [#16](https://github.com/Kunle123/StoryWall/issues/16) | Feature **3** strong public timelines; optional demo URL — [`FLAGSHIP_EXAMPLES.md`](./FLAGSHIP_EXAMPLES.md) |
| **19** | Visual house style | [GTM — Visual identity](GTM-one-page-memo.md#visual-identity-rules) | Align Discover/cards with mockup notes — [`DISCOVER_UI_MOCKUP_NOTES.md`](./DISCOVER_UI_MOCKUP_NOTES.md) |
| **23** | User research | [#19](https://github.com/Kunle123/StoryWall/issues/19) | Run recruitment + moderated sessions; log learnings in issues |
| **24** | Founder-led distribution | [#20](https://github.com/Kunle123/StoryWall/issues/20) | Context-reply habit + list of target topics — [GTM](GTM-one-page-memo.md#marketing-wedge) |
| **26** | Private beta gates | [#14](https://github.com/Kunle123/StoryWall/issues/14) | Work through [`LAUNCH_GATES_CHECKLIST.md`](./LAUNCH_GATES_CHECKLIST.md) **§1** |
| **34** | Seed + discoverability | [#10](https://github.com/Kunle123/StoryWall/issues/10) | Dev/staging: `scripts/seed-all-data.ts`; prod: exemplar + featured strategy |
| **36** | Legal / compliance | [#12](https://github.com/Kunle123/StoryWall/issues/12) | Beta-appropriate terms/privacy + channel requirements |
| **39** | Week 4 small beta | [#24](https://github.com/Kunle123/StoryWall/issues/24) | Cohort definition + user-story capture — [GTM — Beta program execution](GTM-one-page-memo.md#beta-program-execution) |
| **40** | Community / creator beta | [GTM Community](GTM-one-page-memo.md#community-strategy) | Invite norms (70/30); minimal product churn — same **§1** gates |

---

## P0 — Validation & Week 1 (do now)

| | Issue | Notes |
|---|--------|--------|
| [ ] | [#14](https://github.com/Kunle123/StoryWall/issues/14) | Private beta **gates** checklist |
| [ ] | [#15](https://github.com/Kunle123/StoryWall/issues/15) | **Wedge** + homepage + **sign-in copy** |
| [ ] | [#16](https://github.com/Kunle123/StoryWall/issues/16) | **3 examples** + How it works + **demo video** |
| [ ] | [#17](https://github.com/Kunle123/StoryWall/issues/17) | **Analytics** / funnel metrics |
| [ ] | [#18](https://github.com/Kunle123/StoryWall/issues/18) | **Feedback** capture |

**Related UI:** [#7](https://github.com/Kunle123/StoryWall/issues/7) homepage vs mockup · [#26](https://github.com/Kunle123/StoryWall/issues/26) Explore / How it works tabs (first-fold density) · **Mockup:** `docs/mockups/feature-page-timeline-summary.html`

**Technical SEO / marketability** (robots, sitemap, GSC, OG re-scrape): [#25](https://github.com/Kunle123/StoryWall/issues/25) — see `docs/SHARING_AND_SEO.md`.

---

## P1 — Week 2–3

| | Issue | Notes |
|---|--------|--------|
| [ ] | [#19](https://github.com/Kunle123/StoryWall/issues/19) | Recruit **15–30** + moderated tests |
| [ ] | [#20](https://github.com/Kunle123/StoryWall/issues/20) | Founder-led **distribution** |
| [ ] | [#21](https://github.com/Kunle123/StoryWall/issues/21) | **Free tier** messaging (no monetization sprint) |

---

## P2 — Budget, remix, later beta

| | Issue | Notes |
|---|--------|--------|
| [ ] | [#22](https://github.com/Kunle123/StoryWall/issues/22) | **£250–£900** guardrails |
| [ ] | [#23](https://github.com/Kunle123/StoryWall/issues/23) | **Remix** / create-your-own |
| [ ] | [#24](https://github.com/Kunle123/StoryWall/issues/24) | Week 4 **small beta** + feature user stories |

---

## Eng backlog (product build — not all P0 for validation)

| | Issue |
|---|--------|
| [ ] | [#4](https://github.com/Kunle123/StoryWall/issues/4) Token grants on publish |
| [ ] | [#5](https://github.com/Kunle123/StoryWall/issues/5) Leaderboard |
| [ ] | [#6](https://github.com/Kunle123/StoryWall/issues/6) Collection pages |
| [ ] | [#8](https://github.com/Kunle123/StoryWall/issues/8) Optional rubric / publish score |
| [ ] | [#9](https://github.com/Kunle123/StoryWall/issues/9) Admin API hardening |
| [ ] | [#10](https://github.com/Kunle123/StoryWall/issues/10) Seed + discoverability |
| [ ] | [#11](https://github.com/Kunle123/StoryWall/issues/11) Redis/KV cache |
| [ ] | [#12](https://github.com/Kunle123/StoryWall/issues/12) Legal / compliance |
| [ ] | [#13](https://github.com/Kunle123/StoryWall/issues/13) Twitter API cleanup |

---

### Blocked / waiting

- 

### Notes

- **Perfect story / rubric:** `docs/STORYWALL_PERFECT_STORY_RUBRIC.md`, `docs/PERFECT_STORYWALL.md` — curation ties to [#8](https://github.com/Kunle123/StoryWall/issues/8) and [#16](https://github.com/Kunle123/StoryWall/issues/16).
- **`docs/QUICK_WINS_IMPLEMENTATION_STATUS.md`:** partially stale; featured + bio shipped — see repo history.
- **2026-03-28:** P0 batch — wedge copy on home + auth, “How it works” + Feedback on discover, GA funnel events (`docs/product/FUNNEL_EVENTS.md`), gates checklist (`docs/product/LAUNCH_GATES_CHECKLIST.md`). [#16](https://github.com/Kunle123/StoryWall/issues/16) still needs **3 flagship example stories** + **demo video** (content).
- **2026-03-28 (pm):** Shipped discover **Explore / How it works** tabs ([#26](https://github.com/Kunle123/StoryWall/issues/26)), mockup-aligned spotlight + summary cards ([#7](https://github.com/Kunle123/StoryWall/issues/7)), optional **`NEXT_PUBLIC_FOUNDER_DEMO_URL`** + ops doc for flagship examples ([#16](https://github.com/Kunle123/StoryWall/issues/16) — DB featuring + video still manual). See `docs/product/DISCOVER_UI_MOCKUP_NOTES.md`, `docs/product/FLAGSHIP_EXAMPLES.md`.
- **2026-03-29:** **`/discover` in sitemap** ([#25](https://github.com/Kunle123/StoryWall/issues/25)); **global Feedback** in app header ([#18](https://github.com/Kunle123/StoryWall/issues/18)) — still verify GSC + monitoring per issue #25 checklist.
- **2026-03-29 (pm):** **#9** admin route auth (`requireAdmin`); upload requires sign-in. **#4** tiered publish credits (+30/+20/+10) via `lib/db/publishRewards.ts` on public create / private→public. Verify on staging/prod.
- **2026-03-30 (board sync):** GitHub Project **Status** set for **#34** → **Ready for test** (was unset: `gh project item-list` defaults to **30** items; #34 was past the page). **`scripts/gh-board-set-status.sh`** fixed: `--limit 200` + `gh -q` filter (avoids jq parse errors on long issue bodies). **#28** (restore-point bookmark) moved **In Progress** → **Planning**. Comments on **#34** / **#30** with ship ref **`90c44f3`**.
- **2026-03-28 (prioritised matrix):** Added **§1 Private beta** gates to [`LAUNCH_GATES_CHECKLIST.md`](./LAUNCH_GATES_CHECKLIST.md); **Beta program execution** section in [`GTM-one-page-memo.md`](./GTM-one-page-memo.md); Prioritised table in this file; flagship doc ties to matrix row **14**.

---

*Week of **2026-03-28** (notes updated 2026-03-28)*
