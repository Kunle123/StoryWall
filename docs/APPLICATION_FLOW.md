# StoryWall — Application flow (visual)

Use a Mermaid-capable viewer (GitHub preview, VS Code extension, [mermaid.live](https://mermaid.live)) to render the diagrams below.

---

## 1. High-level: main surfaces

```mermaid
flowchart TB
  subgraph Public["Public / marketing"]
    Home["/ — Home"]
    Explore["/explore"]
    Discover["/discover"]
    Story["/story/[id]"]
  end

  subgraph Auth["Auth"]
    SignIn["/sign-in"]
    SignUp["/sign-up"]
  end

  subgraph App["Main app (authenticated)"]
    Editor["/editor — Timeline editor"]
    TimelineView["/timeline/[id] — View timeline"]
    Profile["/profile"]
    Settings["/settings"]
    Social["/social"]
    Stats["/statistics"]
  end

  subgraph DevTest["Test / dev pages"]
    Abridged["/abridged — Abridged flow test"]
    TestImage["/test-image-gen …"]
  end

  Home --> Editor
  Home --> Explore
  Editor --> TimelineView
```

---

## 2. Standard timeline editor (6 steps)

Default path when **`timelineType` ≠ statistics** (narrative / factual timelines).

```mermaid
flowchart LR
  S1["1. Timeline Info\n(name, description, factual, dates…)"]
  S2["2. Writing style & events\n(AI generate events or manual)"]
  S3["3. Event details\n(descriptions + image prompts)"]
  S4["4. Image style\n(look & theme)"]
  S5["5. Generate images\n(per event)"]
  S6["6. Review & publish\n(save → DB)"]

  S1 --> S2 --> S3 --> S4 --> S5 --> S6
```

---

## 3. Statistics timeline branch (6 steps)

When user enters editor from **`/statistics`** (or `?type=statistics`).

```mermaid
flowchart LR
  T1["1. Metrics definition"]
  T2["2. Data source\n(AI vs manual)"]
  T3["3. Data entry"]
  T4["4. Chart style"]
  T5["5. Generate charts"]
  T6["6. Review & publish"]

  T1 --> T2 --> T3 --> T4 --> T5 --> T6
```

---

## 4. AI pipeline — standard timeline (conceptual)

What typically runs **between** editor steps (not every button hits every box).

```mermaid
flowchart TB
  subgraph Step2["Step 2 — Events"]
    GE["POST /api/ai/generate-events\n(optional: web search for factual)"]
  end

  subgraph Step3["Step 3 — Descriptions & prompts"]
    NW["Newsworthiness check\n(Clerk user + policy)"]
    GD["POST /api/ai/generate-descriptions-v2\nanchor + descriptions + imagePrompts"]
    VC["verifyAndCorrectEvents\n(optional factual pass)"]
    GE --> NW
    NW --> GD
    GD --> VC
  end

  subgraph Step5["Step 5 — Images"]
    GI["POST /api/ai/generate-images\nor generate-images-stream (SSE)"]
    VC --> GI
    Cloud["Persist images\n(e.g. Cloudinary)"]
    GI --> Cloud
  end

  subgraph Data["Persistence"]
    DB[("PostgreSQL\nvia Prisma")]
    Save["createTimeline / createEvent\n(client API)"]
    Cloud --> Save
    Save --> DB
  end
```

---

## 5. Abridged test page flow (`/abridged`)

Simplified end-to-end test (guest-friendly header); not the full editor.

```mermaid
flowchart TB
  A1["POST /api/ai/suggest-timeline-descriptions"]
  A2["POST /api/ai/generate-events"]
  A3["POST /api/ai/generate-descriptions-v2"]
  A4["POST /api/ai/generate-images-stream\n(SSE → progress per image)"]

  A1 --> A2 --> A3 --> A4
```

---

## 6. Image generation — two streaming patterns

```mermaid
flowchart LR
  subgraph A["Editor / GenerateImagesStep"]
    M1["POST /api/ai/generate-images?stream=true\n(SSE inside same route)"]
  end

  subgraph B["Abridged / tests"]
    M2["POST /api/ai/generate-images-stream\n→ internal POST generate-images?jobId=…\n+ progressStore callbacks"]
  end
```

---

## 7. Viewing a saved timeline

```mermaid
flowchart LR
  U["User opens link"] --> P["/timeline/[id]"]
  P --> API["GET /api/timelines/[id]"]
  API --> DB[("Load timeline + events")]
  DB --> R["Render TimelineCard / viewer"]
```

---

### Sharing & SEO

Timeline and **story** (`/story/[id]`) routes use server metadata (`generateMetadata`); timelines also use server-fetched data for faster first paint. **`/sitemap.xml`** and **`/robots.txt`** list public timelines for crawlers — see **[SHARING_AND_SEO.md](./SHARING_AND_SEO.md)**. After deploys, refresh social caches there too.

---

### Notes

- **Auth:** `/editor` expects a signed-in Clerk user (redirects to `/sign-in` if not).
- **Credits:** Image generation may deduct credits (guest/abridged flows may bypass or use different rules — see route handlers).
- **AI provider:** Controlled by env (`AI_PROVIDER`, OpenAI vs Kimi, etc.); not every route uses the same model — see in-code `createChatCompletion` / `getModelForProvider` usage per feature.
