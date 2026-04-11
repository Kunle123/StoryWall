-- AlterTable
ALTER TABLE "timelines" ADD COLUMN IF NOT EXISTS "is_numbered" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "timelines" ADD COLUMN IF NOT EXISTS "number_label" VARCHAR(50) DEFAULT 'Day';
