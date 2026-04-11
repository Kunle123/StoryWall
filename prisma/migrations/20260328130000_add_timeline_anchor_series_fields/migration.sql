-- Series-wide image enrichment metadata (Step 3) for layered prompts at generation time
ALTER TABLE "timelines" ADD COLUMN IF NOT EXISTS "anchor_style" TEXT;
ALTER TABLE "timelines" ADD COLUMN IF NOT EXISTS "image_series_continuity" TEXT;
