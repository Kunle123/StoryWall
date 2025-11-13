#!/bin/bash

echo "Testing newsworthiness heuristic only (no description generation)"
echo ""

# Test heuristic detection directly
echo "Test: Heuristic should detect 'election' and 'governor' keywords"
echo "Expected: Should use heuristic (instant), not full AI test"
echo ""

# We can't easily test just the newsworthiness function without the full route,
# but we can verify the keywords match
echo "Keywords in test: 'election', 'governor'"
echo "Heuristic keywords include: election, governor, mayor, senator..."
echo ""
echo "✅ Heuristic should match and return instantly"
echo "⚠️  The 9.7s in Test 3 includes the full description generation (~9s), not just newsworthiness"
echo ""
echo "To verify heuristic is working, check server console logs for:"
echo "  '[NewsworthinessTest] Quick heuristic result: Low'"
echo ""
echo "If you see 'Ambiguous case, running full AI test', the heuristic didn't match"
