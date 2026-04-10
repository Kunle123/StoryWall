#!/usr/bin/env bash
# Set GitHub Project "Matrix #" for a StoryWall issue (aligns with docs/product/FEATURE_PRIORITIZATION_MATRIX.md rows 1–44).
# Requires: gh auth with read:project + project
#
# Usage:
#   ./scripts/gh-board-set-matrix.sh ISSUE_NUMBER MATRIX_ROW
#   ./scripts/gh-board-set-matrix.sh --sync-all   # set Matrix # for every issue on the board that has a mapping
#
# Env:
#   OWNER (default: Kunle123)
#   PROJECT_NUMBER (default: 1)

set -euo pipefail

OWNER="${OWNER:-Kunle123}"
PROJECT_NUMBER="${PROJECT_NUMBER:-1}"
PROJECT_ID="${PROJECT_ID:-PVT_kwHOAETCr84BTE7x}"
# From: gh project field-list 1 --owner Kunle123 --format json | jq -r '.fields[] | select(.name=="Matrix #") | .id'
MATRIX_FIELD_ID="${MATRIX_FIELD_ID:-PVTF_lAHOAETCr84BTE7xzhBb6Ng}"

item_id_for_issue() {
  local num="$1"
  gh project item-list "$PROJECT_NUMBER" --owner "$OWNER" --format json --limit 200 \
    -q ".items[] | select(.content.number == $num) | .id" | head -1
}

set_matrix() {
  local issue_num="$1"
  local row="$2"
  local item_id
  item_id="$(item_id_for_issue "$issue_num")"
  if [[ -z "$item_id" || "$item_id" == "null" ]]; then
    echo "No project item for issue #$issue_num — add it first:"
    echo "  gh project item-add $PROJECT_NUMBER --owner $OWNER --url https://github.com/$OWNER/StoryWall/issues/$issue_num"
    return 1
  fi
  echo "Issue #$issue_num → Matrix # $row ($item_id)"
  gh project item-edit \
    --id "$item_id" \
    --project-id "$PROJECT_ID" \
    --field-id "$MATRIX_FIELD_ID" \
    --number "$row"
}

# Issue number → matrix row (see FEATURE_PRIORITIZATION_MATRIX.md). One row per issue; overlaps resolved to primary row.
sync_all_mappings() {
  while IFS=: read -r issue row; do
    [[ -z "$issue" ]] && continue
    set_matrix "$issue" "$row" || true
  done <<'EOF'
4:29
5:30
6:31
7:13
8:32
9:33
10:34
11:35
12:36
13:37
14:26
15:20
16:14
17:21
18:22
19:23
20:24
21:25
22:38
23:28
24:39
25:27
26:13
27:13
29:13
30:13
31:15
32:15
34:13
37:1
38:3
39:2
40:5
41:6
EOF
  echo "Done."
}

if [[ "${1:-}" == "--sync-all" ]]; then
  sync_all_mappings
  exit 0
fi

if [[ -z "${1:-}" || -z "${2:-}" ]]; then
  echo "Usage: $0 ISSUE_NUMBER MATRIX_ROW"
  echo "       $0 --sync-all"
  exit 1
fi

set_matrix "$1" "$2"
echo "OK."
