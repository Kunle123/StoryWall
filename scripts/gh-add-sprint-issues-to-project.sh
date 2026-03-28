#!/usr/bin/env bash
# Add sprint + validation issues #4–#24 to a GitHub Project (run on YOUR machine after: gh auth refresh -s read:project,project)
#
# Usage:
#   gh project list --owner Kunle123    # note the project number
#   ./scripts/gh-add-sprint-issues-to-project.sh PROJECT_NUMBER
#
# Example:
#   ./scripts/gh-add-sprint-issues-to-project.sh 2

set -euo pipefail
OWNER="${OWNER:-Kunle123}"
REPO="${REPO:-StoryWall}"

if [[ -z "${1:-}" ]]; then
  echo "Usage: $0 PROJECT_NUMBER"
  echo "Get PROJECT_NUMBER from: gh project list --owner $OWNER"
  exit 1
fi
PN="$1"

ISSUES=(4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25)
for n in "${ISSUES[@]}"; do
  url="https://github.com/${OWNER}/${REPO}/issues/${n}"
  echo "Adding $url ..."
  gh project item-add "$PN" --owner "$OWNER" --url "$url"
done
echo "Done."
