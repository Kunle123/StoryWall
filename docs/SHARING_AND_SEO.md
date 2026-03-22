# Sharing, Open Graph & SEO

## After each deploy

Social platforms **cache** link previews. After you change titles, images, or descriptions, refresh the cache:

| Platform | Tool |
|----------|------|
| **Facebook / Instagram / WhatsApp** | [Sharing Debugger](https://developers.facebook.com/tools/debug/) — paste a timeline URL → **Scrape Again** |
| **X (Twitter)** | [Card Validator](https://cards-dev.twitter.com/validator) (or post a test link; cache clears over time) |
| **LinkedIn** | [Post Inspector](https://www.linkedin.com/post-inspector/) |

Paste a full timeline URL, e.g. `https://www.storywall.com/timeline/your-slug-or-id`.

## What StoryWall emits (timeline pages)

Server-rendered metadata includes:

- `og:title`, `og:description`, `og:image`, `og:url`, `og:site_name`
- `twitter:card` (`summary_large_image` when an image exists)
- `link rel="canonical"` (prefers slug URL)

Configured in `app/(main)/timeline/[id]/layout.tsx` (`generateMetadata`).

## Environment

Set **`NEXT_PUBLIC_APP_URL`** to your canonical origin (e.g. `https://www.storywall.com`) so `metadataBase` and absolute image URLs resolve correctly in production.

## Body content & crawlers

The timeline route is hydrated with **server-fetched** timeline + events so the first paint can show title/description quickly. A screen-reader-only block may include the same title/description for accessibility; social crawlers primarily use `<head>` metadata.
