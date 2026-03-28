#!/usr/bin/env bash
# Set GitHub Project Status for a StoryWall issue by number.
# Requires: gh auth with scopes read:project + project (write)
#
# Status option IDs are resolved from the project (by name), so adding a column
# in GitHub (e.g. "Ready for test") works without editing this file — use the
# exact name shown in Project settings for the Status field.
#
# Usage:
#   ./scripts/gh-board-set-status.sh ISSUE_NUMBER STATUS
#
# STATUS (keyword → Status field label):
#   planning | not-started | in-progress | ready-for-test | done | blocked
#
# Env:
#   OWNER (default: Kunle123)
#   PROJECT_NUMBER (default: 1)

set -euo pipefail

OWNER="${OWNER:-Kunle123}"
PROJECT_NUMBER="${PROJECT_NUMBER:-1}"

PROJECT_ID="PVT_kwHOAETCr84BTE7x"
STATUS_FIELD_ID="PVTSSF_lAHOAETCr84BTE7xzhAbJnw"

status_label_for_key() {
  case "$1" in
    planning) echo "Planning" ;;
    not-started) echo "Not Started" ;;
    in-progress) echo "In Progress" ;;
    ready-for-test) echo "Ready for test" ;;
    done) echo "Done" ;;
    blocked) echo "Blocked" ;;
    *) echo "" ;;
  esac
}

option_id_for_label() {
  local label="$1"
  gh project field-list "$PROJECT_NUMBER" --owner "$OWNER" --format json | jq -r --arg n "$label" '.fields[] | select(.name=="Status") | .options[] | select(.name==$n) | .id' | head -1
}

if [[ -z "${1:-}" || -z "${2:-}" ]]; then
  echo "Usage: $0 ISSUE_NUMBER STATUS"
  echo "STATUS: planning | not-started | in-progress | ready-for-test | done | blocked"
  exit 1
fi

ISSUE_NUM="$1"
STATUS_KEY="$2"
LABEL="$(status_label_for_key "$STATUS_KEY")"

if [[ -z "$LABEL" ]]; then
  echo "Unknown STATUS: $STATUS_KEY"
  exit 1
fi

OPTION_ID="$(option_id_for_label "$LABEL")"

if [[ -z "$OPTION_ID" || "$OPTION_ID" == "null" ]]; then
  echo "No Status option named «$LABEL» in this project."
  echo "Add it under Project → Settings → (Status field) → Add option, or fix the spelling."
  echo "Current options:"
  gh project field-list "$PROJECT_NUMBER" --owner "$OWNER" --format json | jq -r '.fields[] | select(.name=="Status") | .options[].name'
  exit 1
fi

JSON=$(gh project item-list "$PROJECT_NUMBER" --owner "$OWNER" --format json)
ITEM_ID=$(echo "$JSON" | jq -r --argjson n "$ISSUE_NUM" '.items[] | select(.content.number == $n) | .id' | head -1)

if [[ -z "$ITEM_ID" || "$ITEM_ID" == "null" ]]; then
  echo "No project item found for issue #$ISSUE_NUM. Add it first:"
  echo "  gh project item-add $PROJECT_NUMBER --owner $OWNER --url https://github.com/$OWNER/StoryWall/issues/$ISSUE_NUM"
  exit 1
fi

echo "Setting issue #$ISSUE_NUM → $LABEL ($ITEM_ID)"
gh project item-edit \
  --id "$ITEM_ID" \
  --project-id "$PROJECT_ID" \
  --field-id "$STATUS_FIELD_ID" \
  --single-select-option-id "$OPTION_ID"

echo "OK."
