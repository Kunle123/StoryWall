# Quick Wins Implementation Status

> **2026-03-28:** Validation / GTM work is tracked in GitHub **#14–#24** and [`docs/product/LAUNCH_VALIDATION_STRATEGY.md`](./product/LAUNCH_VALIDATION_STRATEGY.md). Engineering backlog: **#4–#13**.

## ✅ Completed

### 1. "Created with Storywall" Footer
- **Status:** ✅ Complete
- **Location:** `app/(main)/timeline/[id]/page.tsx`
- **Details:** Footer on public timelines linking to homepage

### 2. Featured Section on Homepage
- **Status:** ✅ Complete
- **Database:** `isFeatured`, `featuredAt` on `Timeline`
- **API:** `/api/timelines/featured`
- **Frontend:** Featured section on homepage

### 3. Creator Bio Field
- **Status:** ✅ Complete (was pending UI; now shipped)
- **Database:** `bio` on `User`
- **UI:** Settings (`app/(main)/settings/page.tsx`), display on story page (`app/(main)/story/[id]/page.tsx`), profile

## 🚧 Pending (engineering)

### 4. Token Grant on First Story
- **Status:** ⏳ Pending — GitHub [#4](https://github.com/Kunle123/StoryWall/issues/4)
- **Database:** ✅ `firstStoryPublishedAt`, `publishedStoryCount` on `User`
- **Logic:** Grant on publish, tiered incentives

### 5. Basic Leaderboard
- **Status:** ⏳ Pending — GitHub [#5](https://github.com/Kunle123/StoryWall/issues/5)

## Next steps (engineering)

1. Implement token grants — [#4](https://github.com/Kunle123/StoryWall/issues/4)
2. Leaderboard — [#5](https://github.com/Kunle123/StoryWall/issues/5)
3. Ensure migrations applied on each environment if schema predates deploy

## Database

If local DB is behind schema, run:

```bash
npx prisma migrate dev
```

*(Migration name depends on your history; fields above exist in `prisma/schema.prisma`.)*
