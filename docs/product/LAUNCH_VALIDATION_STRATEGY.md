# StoryWall — launch validation strategy (consolidated)

**Purpose:** Single reference for **positioning**, **private beta gates**, **one-month execution**, **metrics**, **budget**, and **growth messaging**. **Tasks** live in **GitHub Issues**; this doc is the narrative.

**Related:** [`roadmap.md`](./roadmap.md) (goals & metrics table) · [`current-sprint.md`](./current-sprint.md) (weekly focus) · [`LAUNCH_GATES_CHECKLIST.md`](./LAUNCH_GATES_CHECKLIST.md) (broad launch gates) · [`FUNNEL_EVENTS.md`](./FUNNEL_EVENTS.md) (GA events) · [`AGENTS.md`](../../AGENTS.md) (workflow)

---

## Positioning

- StoryWall is an **early prototype** ready for **targeted user testing**, not a **broad public launch** yet.
- **Private beta** now; **broad launch** only after gates below are met (or consciously postponed).
- Focus the next month on **validation**, not polish for everyone.
- Do **not** launch as a general-purpose creativity product yet.
- Launch first for **one clear use group** with a clear **job to be done**.

### Prove

- Strangers understand it fast.
- They can make something good.
- They want to share it.
- They come back to make another.

### Recommended wedges

| Priority | Wedge | Notes |
|----------|--------|--------|
| **First** | Current affairs / history explainers | Best initial wedge |
| **Second** | Teachers / students / revision timelines | Strong secondary |
| **Avoid** | “Everyone who likes storytelling” | Too broad for v1 |

Other candidate segments: newsletter/explainer creators, educational creators, politics enthusiasts.

---

## Broad launch gates (do not skip lightly)

Before a **broad** launch, aim for:

- [ ] **10+** non-founder-created public stories  
- [ ] **5+** users who **completed and shared**  
- [ ] **One** audience segment that **clearly gets it**  
- [ ] **Homepage messaging** aligned to that segment  
- [ ] **Some willingness-to-pay** signal (even soft)

---

## Product (high level)

- **Homepage promise:** what it is, who it’s for, outcome, why shareable.
- **Example framing:** e.g. “Create visual timelines that make complex stories easy to understand and easy to share.”
- **3 killer example stories** on the homepage (not many average ones).
- **Guided creation** with prompts vs blank start.
- **Sharing as hero:** clean public URLs, mobile-friendly pages, social previews, **remix / create-your-own** CTA.
- **Sign-in copy** aligned to real use cases.

### “Perfect story” (summary)

Six dimensions (see `docs/STORYWALL_PERFECT_STORY_RUBRIC.md`): premise clarity, arc, beats/pacing, visuals, payoff, shareability. **24+/30** strong, **27+/30** flagship.

---

## Monetization (this month)

- **Do not** optimize monetization in the next month.
- Keep current free offer; make it **explicit** in marketing and onboarding.
- Frame allowance as **~3 visual stories** / enough to test and share; **first 30 AI images free**; BYO images OK.
- **Delay** leading with paid tokens in messaging.
- **Later test:** free 2–3 stories / 30 images → paid packs; **easier to charge for extra image generations** before charging for story creation.

---

## Metrics to track

| Funnel / signal | Notes |
|-----------------|--------|
| Visitor → signup | |
| Signup → first story started | |
| First story started → completed | |
| Completed → first share | |
| Shared → recipient clicks | |
| % second story | |
| Non-founder public stories count | |
| Users hitting free image limit | |
| Pay intent / credit asks | |

---

## One-month execution (outline)

| Week | Focus |
|------|--------|
| **1** | Homepage + sign-in messaging; 3 polished examples; How it works; analytics + feedback; founder demo; **pick one audience** |
| **2** | Recruit 15–30 relevant users; moderated tests; one story + optional second; watch drop-offs; ask to share with one person |
| **3** | Top onboarding fixes; image/story quality; mobile view/share; duplicate/remix; optional soft paid token test |
| **4** | Small public beta; 3–4 quality examples/week; feature user stories; tiny distribution only if organic works |

---

## Budget (lean first month)

- **Do not** spend full **£2,500** immediately.
- **Rough band:** **£250–£700** (broader lean **£300–£900**).
- **Spend on:** tester incentives, analytics/session/email tools, light onboarding design help, **tiny** paid tests only after organic signal.
- **Avoid:** broad ads, PR, expensive branding, big influencer buys, SEO-heavy programs.

---

## Marketing principles

- Lead with **story examples**, not generic product ads.
- Founder-led: publish standout StoryWalls; X / LinkedIn / Reddit / niche communities.
- Manual outreach to early adopters; small communities over broad advertising.
- Email capture / waitlist (even small).
- Ask testers to invite one person; use user stories as proof when available.

### Growth messaging snippets

- “You can create real StoryWalls for free right now.”
- “First 30 AI images included.”
- “Bring your own images too.”
- “Enough for about 3 visual stories.”
- “Create visual timelines that are easy to understand and easy to share.”

---

## Tooling (tracking work)

- **GitHub Projects** = canonical kanban; **not** Cursor chat.
- **AGENTS.md** + rules + issues + PRs; see `AGENTS.md`.

---

## Explicitly avoid (short list)

- Broad public launch too early  
- Heavy spend before validation  
- Leading with monetization  
- Broad paid ads  
- Cursor as project database  
- One giant unstructured markdown dump for all roadmap/bugs/ideas  

---

## GitHub issues (this strategy)

| Priority | Issue | Title |
|----------|-------|--------|
| P0 | [#14](https://github.com/Kunle123/StoryWall/issues/14) | Private beta validation gates |
| P0 | [#15](https://github.com/Kunle123/StoryWall/issues/15) | Wedge + homepage + sign-in copy |
| P0 | [#16](https://github.com/Kunle123/StoryWall/issues/16) | 3 examples + How it works + demo video |
| P0 | [#17](https://github.com/Kunle123/StoryWall/issues/17) | Funnel analytics |
| P0 | [#18](https://github.com/Kunle123/StoryWall/issues/18) | Feedback capture |
| P1 | [#19](https://github.com/Kunle123/StoryWall/issues/19) | Week 2 user tests (15–30) |
| P1 | [#20](https://github.com/Kunle123/StoryWall/issues/20) | Founder-led distribution |
| P1 | [#21](https://github.com/Kunle123/StoryWall/issues/21) | Free-tier messaging clarity |
| P2 | [#22](https://github.com/Kunle123/StoryWall/issues/22) | Budget guardrails |
| P2 | [#23](https://github.com/Kunle123/StoryWall/issues/23) | Remix / duplicate flow |
| P2 | [#24](https://github.com/Kunle123/StoryWall/issues/24) | Week 4 small public beta |
| — | [#25](https://github.com/Kunle123/StoryWall/issues/25) | Technical SEO & marketability (GSC, sitemap, OG hygiene) |

**Engineering backlog (parallel):** [#4](https://github.com/Kunle123/StoryWall/issues/4)–[#13](https://github.com/Kunle123/StoryWall/issues/13).

---

*Last updated: 2026-03-28*
