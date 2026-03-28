#!/usr/bin/env bash
# Deprecated: previously moved issues to **Done** without requiring deploy + test.
# Use ./scripts/gh-board-sync-wip.sh for In Progress / Not Started only.
# See AGENTS.md — Definition of done.

echo "gh-board-sync-current.sh is deprecated."
echo "Use: ./scripts/gh-board-sync-wip.sh"
echo "Mark Done only after deploy + test: ./scripts/gh-board-set-status.sh ISSUE done"
exit 1
