#!/bin/bash

# Test script to verify reference image flow works correctly

PERSON_NAME="${1:-King Charles III}"
echo "Testing reference image flow for: $PERSON_NAME"
echo "================================================"

# Step 1: Search Wikimedia
echo ""
echo "Step 1: Searching Wikimedia Commons..."
SEARCH_TERM=$(echo "$PERSON_NAME" | sed 's/ /%20/g')
SEARCH_URL="https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srsearch=intitle:${SEARCH_TERM}&srnamespace=6&srlimit=5&origin=*"

SEARCH_RESULTS=$(curl -s "$SEARCH_URL")
echo "Search results:"
echo "$SEARCH_RESULTS" | jq -r '.query.search[0:3] | .[] | "  - \(.title)"'

# Step 2: Get first result title
FIRST_TITLE=$(echo "$SEARCH_RESULTS" | jq -r '.query.search[0].title // empty')
if [ -z "$FIRST_TITLE" ]; then
    echo "❌ No search results found!"
    exit 1
fi

echo ""
echo "Step 2: Using first result: $FIRST_TITLE"

# Step 3: Get image URL
echo ""
echo "Step 3: Fetching image URL..."
# Use Python to properly URL-encode the title
TITLE_ENCODED=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$FIRST_TITLE', safe=''))")
IMAGE_INFO_URL="https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=${TITLE_ENCODED}&prop=imageinfo&iiprop=url&origin=*"

IMAGE_INFO=$(curl -s "$IMAGE_INFO_URL")
IMAGE_URL=$(echo "$IMAGE_INFO" | jq -r '.query.pages | to_entries[0].value.imageinfo[0].url // empty')

if [ -z "$IMAGE_URL" ]; then
    echo "❌ Failed to get image URL!"
    exit 1
fi

echo "Image URL: $IMAGE_URL"

# Step 4: Validate URL
echo ""
echo "Step 4: Validating image URL..."
HTTP_CODE=$(curl -I -s -o /dev/null -w "%{http_code}" "$IMAGE_URL")
CONTENT_TYPE=$(curl -I -s "$IMAGE_URL" | grep -i "content-type:" | cut -d' ' -f2 | tr -d '\r')

echo "HTTP Status: $HTTP_CODE"
echo "Content-Type: $CONTENT_TYPE"

if [ "$HTTP_CODE" = "200" ] && [[ "$CONTENT_TYPE" == image/* ]]; then
    echo "✅ Image URL is valid!"
else
    echo "❌ Image URL validation failed!"
    exit 1
fi

# Step 5: Check name matching
echo ""
echo "Step 5: Checking name match..."
PERSON_LOWER=$(echo "$PERSON_NAME" | tr '[:upper:]' '[:lower:]')
TITLE_LOWER=$(echo "$FIRST_TITLE" | tr '[:upper:]' '[:lower:]')

# Simple check: does the title contain key parts of the person's name?
NAME_PARTS=$(echo "$PERSON_LOWER" | tr ' ' '\n' | grep -v '^$' | grep -v '^[a-z]$')
MATCH_COUNT=0
TOTAL_PARTS=0

for part in $NAME_PARTS; do
    if [ ${#part} -gt 2 ]; then
        TOTAL_PARTS=$((TOTAL_PARTS + 1))
        if echo "$TITLE_LOWER" | grep -q "$part"; then
            MATCH_COUNT=$((MATCH_COUNT + 1))
            echo "  ✓ Matches: $part"
        else
            echo "  ✗ No match: $part"
        fi
    fi
done

if [ $MATCH_COUNT -eq $TOTAL_PARTS ] && [ $TOTAL_PARTS -gt 0 ]; then
    echo "✅ Perfect name match! ($MATCH_COUNT/$TOTAL_PARTS parts)"
elif [ $MATCH_COUNT -gt 0 ]; then
    echo "⚠️  Partial name match ($MATCH_COUNT/$TOTAL_PARTS parts)"
else
    echo "❌ No name match found!"
fi

echo ""
echo "================================================"
echo "✅ Test complete! Valid image URL: $IMAGE_URL"

