-- Add image_prompt column to events table
-- Run this SQL directly in Railway database or via psql

ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "image_prompt" TEXT;

