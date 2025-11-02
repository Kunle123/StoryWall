# StoryWall (MVP Scaffold)

![License](https://img.shields.io/badge/license-MIT-green)
![Deploy](https://img.shields.io/badge/deploy-Railway-blue)
![Build](https://img.shields.io/github/actions/workflow/status/Kunle123/StoryWall/ci.yml?label=build)

Collaborative timeline platform - "Wikipedia for timelines". This repository contains a Next.js 14 + TypeScript + Tailwind scaffold aligned with the design spec.

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Clerk (Auth)
- PostgreSQL (Railway)

## Getting Started

1. Install dependencies
```bash
npm install
```

2. Create `.env.local` from `.env.example` and add your API keys:
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` and add your actual API keys:
   - `OPENAI_API_KEY` - Get from https://platform.openai.com/api-keys
   - `CLOUDINARY_*` - Get from your Cloudinary dashboard
   - `CLERK_*` - Get from your Clerk dashboard
   - `DATABASE_URL` - Your PostgreSQL connection string

3. Run the dev server
```bash
npm run dev
```

4. Open http://localhost:3000

## Project Structure
- app/ — App Router pages and layout
- components/ — UI primitives
- lib/ — types and utilities

## License
MIT
