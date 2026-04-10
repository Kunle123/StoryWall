# StoryWall Launch Board — suggested layout

**Reading the board:** Column names are explained in plain language in **`AGENTS.md`** (table: “In plain language”). Issue titles should also be easy for anyone to understand; use templates under **GitHub → New issue** for friendly wording and room for **screenshots**.

Use this to **drag cards** into columns or to align your **Priority** / **Status** fields with the backlog.

**Matrix # (aligned with [`FEATURE_PRIORITIZATION_MATRIX.md`](./FEATURE_PRIORITIZATION_MATRIX.md)):** The board includes a **Matrix #** number field (rows **1–44**). In GitHub Projects, open **Table** view to sort or filter by **Matrix #** so cards line up with the matrix (not with GitHub issue numbers, which are unrelated). **Set values:** `./scripts/gh-board-set-matrix.sh ISSUE MATRIX_ROW` or bulk `./scripts/gh-board-set-matrix.sh --sync-all` (mapping lives in that script). **No matrix row yet** (leave blank or set manually): e.g. **#28** restore bookmark, **#33** kanban/templates meta, **#35** back button, **#36** conversational epic (spans rows 1–6).

**Priority order:** P0 → P1 → P2 → Eng (see [`current-sprint.md`](./current-sprint.md)).

## Suggested columns (your board)

Add **Ready for test** in GitHub: **Project → … → Settings → Custom fields → Status → Add option** — name it exactly **`Ready for test`** (matches `./scripts/gh-board-set-status.sh … ready-for-test`).

| Column | Put these issues here |
|--------|------------------------|
| **Planning** | Ideas not committed this week; optional future work |
| **Not Started** | Next up when you pull from the queue |
| **In Progress** | Active development (keep to 1–3) |
| **Ready for test** | **Merged / deployed to an environment you can test** — QA before Done |
| **Blocked** | Waiting on dependency or decision |
| **Done** | **Verified** on the agreed environment after testing |

## Issues by tier (drag Not Started → In Progress in this order)

### P0 — do first

| Issue | Title |
|-------|--------|
| [#14](https://github.com/Kunle123/StoryWall/issues/14) | Private beta validation gates |
| [#15](https://github.com/Kunle123/StoryWall/issues/15) | Wedge + homepage + sign-in copy |
| [#16](https://github.com/Kunle123/StoryWall/issues/16) | 3 examples + How it works + demo |
| [#17](https://github.com/Kunle123/StoryWall/issues/17) | Funnel analytics |
| [#18](https://github.com/Kunle123/StoryWall/issues/18) | Feedback capture |
| [#7](https://github.com/Kunle123/StoryWall/issues/7) | Homepage UI vs mockup |
| [#25](https://github.com/Kunle123/StoryWall/issues/25) | GSC + SEO hygiene |
| [#26](https://github.com/Kunle123/StoryWall/issues/26) | Home: Explore vs How it works tabs (first fold) |
| [#31](https://github.com/Kunle123/StoryWall/issues/31) | Mobile story page: summary → full view + FAB collapse |

### P1

| [#19](https://github.com/Kunle123/StoryWall/issues/19)–[#21](https://github.com/Kunle123/StoryWall/issues/21) | User tests, distribution, free-tier messaging |

### P2

| [#22](https://github.com/Kunle123/StoryWall/issues/22)–[#24](https://github.com/Kunle123/StoryWall/issues/24) | Budget, remix, small beta |

### Engineering backlog

| [#4](https://github.com/Kunle123/StoryWall/issues/4)–[#13](https://github.com/Kunle123/StoryWall/issues/13) | Tokens, leaderboard, collections, infra, etc. |

---

## Add missing cards to the project (your machine)

If any issue is missing from the board:

```bash
gh auth refresh -h github.com -s read:project,project
cd /path/to/StoryWall
./scripts/gh-add-sprint-issues-to-project.sh YOUR_PROJECT_NUMBER
```

`YOUR_PROJECT_NUMBER` comes from `gh project list --owner Kunle123`.

## Done = deployed + tested

Do **not** move a card to **Done** until the work is **live** (or on the agreed environment) and **you’ve verified** it. Merging to `main` alone is not enough unless that is your production branch and you’ve tested after deploy.

## Update Status as work moves (required scope: `project`)

```bash
gh auth refresh -h github.com -s read:project,project
./scripts/gh-board-set-status.sh 15 in-progress   # starting
./scripts/gh-board-set-status.sh 15 done          # finished
```

Project id and Status field ids are pinned in `scripts/gh-board-set-status.sh` for **Storywall Launch Board** (`PVT_kwHOAETCr84BTE7x`). The **Matrix #** field id is pinned in `scripts/gh-board-set-matrix.sh`. If you recreate the project, re-run `gh project field-list 1 --owner Kunle123 --format json` and update both scripts (and recreate the **Matrix #** field if missing).

---

*This file is guidance only — GitHub is the source of truth for card positions.*
