# Funnel analytics events (GA4)

**Requires:** `NEXT_PUBLIC_GA_MEASUREMENT_ID` in production (see root `layout.tsx`). Events are sent via `gtag` from `lib/analytics.ts`.

## Custom events

| Event name | When | Params |
|------------|------|--------|
| `sw_funnel_editor_entered` | Signed-in user lands on `/editor` (once per **session**) | `source` (e.g. `editor_mount`) |
| `sw_funnel_timeline_saved` | User completes save from editor (timeline + events created) | `timeline_id`, `is_public`, `event_count` |
| `sw_funnel_story_shared` | User copies link or uses native share from `ShareMenu` on a timeline | `timeline_id` |

## GA4 setup

1. In **GA4 → Admin → Events**, mark these as **key events** if you want them in primary reports (optional).
2. Build **explorations** or **funnels**: e.g. `sw_funnel_editor_entered` → `sw_funnel_timeline_saved` → `sw_funnel_story_shared`.
3. **Sign-up** is still available via Clerk + GA enhanced measurement; link `user_id` if you add it later.

## Related issue

[#17](https://github.com/Kunle123/StoryWall/issues/17)
