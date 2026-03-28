#!/usr/bin/env bash
# Set GitHub Project Status for a StoryWall issue by number.
# Requires: gh auth with scopes read:project + project (write)
#
# Usage:
#   ./scripts/gh-board-set-status.sh ISSUE_NUMBER STATUS
#
# STATUS (keyword):
#   planning | not-started | in-progress | done | blocked
#
# Env:
#   OWNER (default: Kunle123)
#   PROJECT_NUMBER (default: 1)

set -euo pipefail

OWNER="${OWNER:-Kunle123}"
PROJECT_NUMBER="${PROJECT_NUMBER:-1}"

PROJECT_ID="PVT_kwHOAETCr84BTE7x"
STATUS_FIELD_ID="PVTSSF_lAHOAETCr84BTE7xzhAbJnw"

option_id_for() {
  case "$1" in
    planning) echo f75ad846 ;;
    not-started) echo c7405d44 ;;
    in-progress) echo 47fc9ee4 ;;
    done) echo 98236657 ;;
    blocked) echo 1ca87d3e ;;
    *) echo "" ;;
  esac
}

if [[ -z "${1:-}" || -z "${2:-}" ]]; then
  echo "Usage: $0 ISSUE_NUMBER STATUS"
  echo "STATUS: planning | not-started | in-progress | done | blocked"
  exit 1
fi

ISSUE_NUM="$1"
STATUS_KEY="$2"
OPTION_ID="$(option_id_for "$STATUS_KEY")"

if [[ -z "$OPTION_ID" ]]; then
  echo "Unknown STATUS: $STATUS_KEY"
  exit 1
fi

JSON=$(gh project item-list "$PROJECT_NUMBER" --owner "$OWNER" --format json)
ITEM_ID=$(echo "$JSON" | jq -r --argjson n "$ISSUE_NUM" '.items[] | select(.content.number == $n) | .id' | head -1)

if [[ -z "$ITEM_ID" || "$ITEM_ID" == "null" ]]; then
  echo "No project item found for issue #$ISSUE_NUM. Add it first:"
  echo "  gh project item-add $PROJECT_NUMBER --owner $OWNER --url https://github.com/$OWNER/StoryWall/issues/$ISSUE_NUM"
  exit 1
fi

echo "Setting issue #$ISSUE_NUM → $STATUS_KEY ($ITEM_ID)"
gh project item-edit \
  --id "$ITEM_ID" \
  --project-id "$PROJECT_ID" \
  --field-id "$STATUS_FIELD_ID" \
  --single-select-option-id "$OPTION_ID"

echo "OK."
