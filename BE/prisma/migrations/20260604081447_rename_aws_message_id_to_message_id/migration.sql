/*
  Warnings:

  - You are about to drop the column `aws_message_id` on the `mail_logs` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "mail_logs_aws_message_id_idx";

-- AlterTable
ALTER TABLE "mail_logs" DROP COLUMN "aws_message_id",
ADD COLUMN     "message_id" TEXT;

-- CreateIndex
CREATE INDEX "mail_logs_message_id_idx" ON "mail_logs"("message_id");
