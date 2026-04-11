/*
  Warnings:

  - A unique constraint covering the columns `[user_id,timeline_id]` on the table `likes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,comment_id]` on the table `likes` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "likes_timeline_id_user_id_key";

-- AlterTable
ALTER TABLE "likes" ADD COLUMN     "comment_id" TEXT,
ALTER COLUMN "timeline_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "likes_comment_id_idx" ON "likes"("comment_id");

-- CreateIndex
CREATE UNIQUE INDEX "likes_user_id_timeline_id_key" ON "likes"("user_id", "timeline_id");

-- CreateIndex
CREATE UNIQUE INDEX "likes_user_id_comment_id_key" ON "likes"("user_id", "comment_id");

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
