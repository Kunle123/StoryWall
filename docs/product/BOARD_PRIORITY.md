# StoryWall Launch Board — suggested layout

Use this to **drag cards** into columns or to align your **Priority** / **Status** fields with the backlog.

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

Project id and Status field ids are pinned in `scripts/gh-board-set-status.sh` for **Storywall Launch Board** (`PVT_kwHOAETCr84BTE7x`). If you recreate the project, re-run `gh project field-list 1 --owner Kunle123 --format json` and update the script.

---

*This file is guidance only — GitHub is the source of truth for card positions.*
