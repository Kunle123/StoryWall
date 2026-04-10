# Conversational timeline builder (beta)

Product direction: **co-research** on factual beats before descriptions and images. The classic `/editor` flow stays unchanged.

Related positioning: [GTM one-page memo](./GTM-one-page-memo.md).

## GitHub tracking

- Epic: [#36](https://github.com/Kunle123/StoryWall/issues/36)
- Skeleton API: [#37](https://github.com/Kunle123/StoryWall/issues/37)
- Generate-from-skeleton handoff: [#38](https://github.com/Kunle123/StoryWall/issues/38)
- Chat UI + checklist: [#39](https://github.com/Kunle123/StoryWall/issues/39)
- Multi-turn planner (optional): [#40](https://github.com/Kunle123/StoryWall/issues/40)
- Single narrative tone path: [#41](https://github.com/Kunle123/StoryWall/issues/41)

## What shipped (batch 1)

- **`POST /api/ai/timeline-skeleton`** — JSON milestones only (`year`, optional `month`/`day`, `title`). Prompts in `lib/prompts/chat-skeleton.ts`.
- **`/editor/chat`** — signed-in beta page to call the API and review the list.
- **Feature flag:** set `NEXT_PUBLIC_CONVERSATIONAL_EDITOR=1` to show the link on `/editor`.

## How to test locally

1. Ensure `OPENAI_API_KEY` (or your configured `AI_PROVIDER`) works, same as classic event generation.
2. Add to `.env.local`: `NEXT_PUBLIC_CONVERSATIONAL_EDITOR=1`
3. Restart `next dev`.
4. Open `/editor` → use **Try conversational builder (beta)** or go to `/editor/chat`.
5. Fill name + description → **Propose milestones** → confirm a numbered list appears.

## Next (not in batch 1)

- Checklist edit / add / remove UI ([#39](https://github.com/Kunle123/StoryWall/issues/39)).
- Persist approved skeleton and run `generate-descriptions-v2` ([#38](https://github.com/Kunle123/StoryWall/issues/38)).
