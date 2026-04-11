-- AlterTable
ALTER TABLE "timelines" ADD COLUMN "is_numbered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "number_label" VARCHAR(50) DEFAULT 'Day';

-- AlterTable
ALTER TABLE "events" ADD COLUMN "number" INTEGER,
ADD COLUMN "number_label" VARCHAR(50);

