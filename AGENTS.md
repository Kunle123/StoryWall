# StoryWall — agent & collaborator workflow

This repo uses **GitHub Issues + GitHub Projects** as the source of truth for work. Cursor and humans should follow this protocol so tasks stay traceable and shippable.

## Project board (canonical)

- **Board name:** StoryWall Launch Board (or your chosen name in GitHub Projects).
- **View:** Use GitHub Projects’ **Board** view as the main kanban (columns = status). Add **Table** or **Roadmap** views if you want filters or timeline; the Board stays the default for day-to-day execution.
- **Board URL:** After you create the project: **GitHub → Projects → open the board → copy URL** and paste it here. Example shape: `https://github.com/users/Kunle123/projects/1` (your ID will differ).

### Recommended labels (create in the repo if missing)

| Label | Use |
|-------|-----|
| `feature` | Product or capability work |
| `bug` | Defects |
| `growth` | Experiments, acquisition, funnels |
| `research` | Interviews, analysis, discovery |
| `infra` | CI, hosting, tooling |
| `frontend` / `backend` | Area (optional; can live in Project “Area” field instead) |
| `high-priority` | Needs attention before normal queue |
| `blocked` (optional) | Extra signal on the issue; status still lives in the **Blocked** column |

**Board columns (StoryWall Launch Board):**

| Column        | Meaning |
|---------------|---------|
| **Planning**  | Ideas, feedback, or work that still needs shaping before it’s ready to build. |
| **Not Started** | Triaged and ready to pick up next. |
| **In Progress** | Actively being worked. |
| **Blocked**   | Waiting on a dependency, decision, or external; say what you need in a comment. |
| **Done**      | **Deployed** to the agreed environment (e.g. production) **and tested** — not merely merged locally. |

Optional: add **Review** between **In Progress** and **Done** for “merged, not yet verified in prod.”

Use **labels** for type (`feature`, `bug`, `growth`, `research`, `infra`, …) and **Priority** / **Area** as project fields—not a separate “Bugs” column mixed with status.

## Rules for every coding task

1. **Start from an issue**  
   Prefer a GitHub issue number in the branch name or PR description (`Fixes #123` or `Refs #123`).

2. **Before coding**  
   Read the issue; restate **acceptance criteria** in the PR description or first commit message when helpful.

3. **While working**  
   Add short progress comments on the issue when scope or blockers change.

4. **When done**  
   Open or update a **PR** that **links the issue** (`Closes #123` when it fully resolves it).

5. **Blocked**  
   Comment on the issue with what you’re waiting on; move the card to **Blocked**.

6. **Scope change**  
   Update the issue body / checklist **before** writing more code.

7. **Definition of done**  
   Do not move a card to **Done** (or close the issue) until **acceptance criteria are met**, **tests/lint pass** where applicable, the change is **deployed** to the environment you care about, and you’ve **smoke-tested** it there. **Do not** treat “merged to `main`” alone as Done unless that branch *is* production for you.

## What not to do

- Do not treat Cursor chat as the task system—**the issue is the task**.
- Do not track priorities only in markdown (use `docs/product/` for *summaries*, not as the only record).
- Do not close issues without a PR or explicit reason.

## Repo map (quick)

| Path | Purpose |
|------|---------|
| `docs/product/roadmap.md` | Launch goals, priorities, what not to build now |
| `docs/product/current-sprint.md` | This week’s must/should ship (refresh often) |
| `docs/product/LAUNCH_VALIDATION_STRATEGY.md` | Private beta, wedges, metrics, budget, GTM (narrative) |
| `docs/product/FUNNEL_EVENTS.md` | GA4 custom funnel event names |
| `docs/product/LAUNCH_GATES_CHECKLIST.md` | Broad launch gates (before scaling marketing) |
| `docs/product/BOARD_PRIORITY.md` | Suggested Project column placement by issue # |
| `app/` | Next.js App Router |
| `components/` | React UI |
| `docs/` | Engineering & product notes |

## PR hygiene

- Link issues: `Closes #N` or `Refs #N`.
- Keep the PR description aligned with acceptance criteria.
- Prefer small PRs per issue when possible.

## Automation (optional, in GitHub)

Use GitHub Projects **built-in automations** with care: **“issue closed by PR” → Done** can violate *deployed + tested* unless your deploy is immediate and you trust it. Prefer moving to **Done** manually or via script **after** verification.

---

## Keeping progress in sync as you build

There are **two layers**: (1) **GitHub** = live status; (2) **repo markdown** = short-lived summaries for you and Cursor. Neither replaces the other.

### Source of truth (order)

| Layer | Role | Update when |
|--------|------|-------------|
| **GitHub Issue** | Single task: acceptance criteria, discussion, closure | Every meaningful task |
| **Project board** | Column = status (Planning → Done) | As work moves; ideally with automations |
| **`docs/product/current-sprint.md`** | This week’s focus + backlog hints | Weekly, or when priorities shift |
| **`docs/product/roadmap.md`** | Launch goals, non-goals, metrics | When strategy changes (not every PR) |

### What needs to happen so work stays traceable

1. **Before implementation**  
   - Have a **GitHub issue** (or create one from the templates).  
   - Put the card in **In Progress** when you start (or ask the agent to remind you).

2. **While building**  
   - **Issue:** short comments if scope/blockers change (humans or agents can paste updates; only **you** can post to GitHub from the browser unless `gh`/token is set up).  
   - **Blocked:** move card to **Blocked** + comment.

3. **When a PR merges**  
   - Prefer **`Refs #N`** until **deployed + tested**; use **`Closes #N`** when you’re ready to close the issue (or close manually after verification). If GitHub automations move cards to **Done** on close, consider disabling that or using a **Review** column so “merged” ≠ “Done.”  
   - After **deploy + test**, move the card to **Done** (`./scripts/gh-board-set-status.sh N done`) and then close the issue if open.  
   - **Agent (in this repo):** update **`docs/product/current-sprint.md`** when the user confirms deploy/test — check off bullets, refresh Notes.

4. **Weekly (or end of milestone)**  
   - **Human:** skim board vs sprint doc; drag any stragglers.  
   - **Agent:** refresh **`current-sprint.md`** date line, **must/should ship** lists, and **Notes** so Cursor’s next session isn’t working off a stale list.

5. **Roadmap**  
   - Update **`roadmap.md`** when launch goals, audience, or “what we’re not building” changes — not after every task.

### What the Cursor agent can do vs needs from you

| Action | Agent in repo | Needs from you |
|--------|----------------|----------------|
| Edit `AGENTS.md`, `current-sprint.md`, `roadmap.md` | Yes | Tell it when something shipped or priorities changed |
| **Move Project cards** (Status column) | Run `./scripts/gh-board-set-status.sh` **if** `gh` has **`project`** + **`read:project`** scopes | Run **`gh auth refresh -h github.com -s read:project,project`** on your Mac; then scripts work from Terminal |
| Create/update **GitHub Issues** | `gh issue create` with `repo` scope | — |
| Know what’s “done” | Reads issues/PRs if you link them; else reads sprint file + git | Link `Fixes #N` in PRs; ask agent to sync sprint doc after merge |

**Board helpers (local `gh`):**

- `./scripts/gh-board-set-status.sh ISSUE_NUMBER planning|not-started|in-progress|done|blocked` — use **`done`** only **after deploy + test** (see Definition of done above).
- `./scripts/gh-board-sync-wip.sh` — optional: sets **In Progress / Not Started** only (never forces **Done**).

**Practical minimum:** Issues + `Closes #N` + a standing ask: *“Sync `current-sprint.md` with what we just shipped.”* That keeps the markdown aligned with reality without duplicating the whole board.

---

*Paste your real **StoryWall Launch Board** URL under **Board URL** after the project exists.*
