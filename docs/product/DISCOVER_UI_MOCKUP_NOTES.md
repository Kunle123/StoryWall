# Discover UI vs `feature-page-timeline-summary.html`

**Issue:** [#7](https://github.com/Kunle123/StoryWall/issues/7)

Reference mockup: `docs/mockups/feature-page-timeline-summary.html`

## Aligned (live app)

- **Section labels** — uppercase small caps for Discover / Featured creator / Browse (mockup “section-label”).
- **Creator spotlight** — gradient top bar, gold-accent badge, larger avatar, italic summary with left border, full-width **timeline strip** with thumbs + meta (mockup `spotlight-timeline`).
- **Summary cards** — tall visual strip (~7rem), gradient background, hover lift (mockup card hover).
- **Copy** — discover subcopy matches mockup intent (“scan without spoiling”).
- **Explore / How it works** — product choice to move long onboarding to a tab ([#26](https://github.com/Kunle123/StoryWall/issues/26)); mockup keeps everything on one page.

## Intentional differences

- **Fonts** — App uses Inter + Space Grotesk (`font-display`); mockup uses DM Sans + Instrument Serif (no serif wired in app yet).
- **Header / nav** — Real app uses shared `Header` + fixed search; mockup is a static page chrome.
- **Category chips** — App has filters; mockup shows tags on cards only.

## Optional follow-ups

- Add a display serif in `tailwind.config.js` + `layout` if brand wants mockup typography exactly.
- Tighten dark-mode token contrast on spotlight gradient if design review asks.
