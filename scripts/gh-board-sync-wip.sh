#!/usr/bin/env bash
# Sets WIP columns only — never marks **Done** (that requires deploy + test; see AGENTS.md).
# Run after: gh auth refresh -h github.com -s read:project,project
#
# Usage: ./scripts/gh-board-sync-wip.sh
#
# Adjust issue numbers below as your active work changes.

set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"

# Example: work in flight
"$DIR/gh-board-set-status.sh" 7 in-progress
"$DIR/gh-board-set-status.sh" 16 in-progress
"$DIR/gh-board-set-status.sh" 14 not-started

echo "OK. Move to **done** only after deploy + test: ./scripts/gh-board-set-status.sh N done"
