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

---

*Week of **2026-03-28***
