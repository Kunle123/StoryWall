-- Add Twitter token columns to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "twitter_access_token" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "twitter_refresh_token" TEXT;

