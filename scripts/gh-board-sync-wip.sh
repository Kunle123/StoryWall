#!/usr/bin/env bash
# Sets WIP columns only — never marks **Done** (that requires deploy + test; see AGENTS.md).
# Run after: gh auth refresh -h github.com -s read:project,project
#
# Usage: ./scripts/gh-board-sync-wip.sh
#
# Adjust issue numbers below as your active work changes.

set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"

# Active engineering / growth (adjust when focus shifts)
"$DIR/gh-board-set-status.sh" 16 in-progress

# Strategy / gates — not dev sprint (see issue #14)
"$DIR/gh-board-set-status.sh" 14 planning

# RFT queue (merge on main): #4 #7 #9 #25 #26 — run \`… N done\` after prod smoke test
echo "OK. RFT → Done only after deploy + test: ./scripts/gh-board-set-status.sh N done"
