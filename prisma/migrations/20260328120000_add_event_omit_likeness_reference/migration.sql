-- AlterTable
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "omit_likeness_reference" BOOLEAN NOT NULL DEFAULT false;
