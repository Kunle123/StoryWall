# Sharing, Open Graph & SEO

## After each deploy

Social platforms **cache** link previews. After you change titles, images, or descriptions, refresh the cache:

| Platform | Tool |
|----------|------|
| **Facebook / Instagram / WhatsApp** | [Sharing Debugger](https://developers.facebook.com/tools/debug/) — paste a timeline URL → **Scrape Again** |
| **X (Twitter)** | [Card Validator](https://cards-dev.twitter.com/validator) (or post a test link; cache clears over time) |
| **LinkedIn** | [Post Inspector](https://www.linkedin.com/post-inspector/) |

Paste a full URL, e.g. `https://www.storywall.com/timeline/your-slug-or-id` or `https://www.storywall.com/story/<event-id>`.

## What StoryWall emits

### Timeline URLs (`/timeline/...`)

Server-rendered metadata includes:

- `og:title`, `og:description`, `og:image`, `og:url`, `og:site_name`
- `twitter:card` (`summary_large_image` when an image exists)
- `link rel="canonical"` (prefers slug URL)

Configured in `app/(main)/timeline/[id]/layout.tsx` (`generateMetadata`).

### Single-event story URLs (`/story/...`)

Same pattern for shared event links:

- `og:type` is **`article`**
- Title combines **event · timeline** when the parent timeline loads
- Image uses the **event** `image_url`

Configured in `app/(main)/story/[id]/layout.tsx` (`generateMetadata`).

## Sitemap & robots

- **`/sitemap.xml`** — Built by `app/sitemap.ts`: home, **`/discover`**, `/guide/great-stories`, and up to 5000 **public** timelines (`/timeline/{slug-or-id}`), refreshed every hour (`revalidate = 3600`).
- **`/robots.txt`** — Built by `app/robots.ts`: allows `/`, disallows `/api/`, points crawlers at the sitemap when **`NEXT_PUBLIC_APP_URL`** is set.

**Middleware:** `middleware.ts` must **not** send `/sitemap.xml` or `/robots.txt` through Clerk’s sign-in redirect — crawlers would get HTML and Search Console reports “Sitemap appears to be an HTML page.” Both paths bypass auth before other checks.

## Environment

Set **`NEXT_PUBLIC_APP_URL`** to your canonical origin (e.g. `https://www.storywall.com`) so `metadataBase`, **sitemap URLs**, **robots sitemap line**, and absolute image URLs resolve correctly in production.

**Production choice:** canonical host is **`https://www.storywall.com`**. Apex `https://storywall.com` should **301** to `www` (see [`docs/DNS_SETUP.md`](./DNS_SETUP.md)). **Google Search Console** and **Clerk** allowed URLs should use the `www` host consistently.

## Body content & crawlers

The timeline route is hydrated with **server-fetched** timeline + events so the first paint can show title/description quickly. A screen-reader-only block may include the same title/description for accessibility; social crawlers primarily use `<head>` metadata.

## Tracking (ops)

Ongoing **Search Console**, sitemap submission, and post-deploy **OG** checks are tracked in GitHub [#25](https://github.com/Kunle123/StoryWall/issues/25).
