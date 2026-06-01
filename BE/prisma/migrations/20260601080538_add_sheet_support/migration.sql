/*
  Warnings:

  - You are about to drop the column `message_id` on the `mail_logs` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "mail_logs_message_id_idx";

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "google_sheet_url" TEXT,
ADD COLUMN     "sheet_id" INTEGER,
ADD COLUMN     "sheet_name" TEXT;

-- AlterTable
ALTER TABLE "mail_logs" DROP COLUMN "message_id",
ADD COLUMN     "aws_message_id" TEXT,
ADD COLUMN     "row_index" INTEGER;

-- CreateTable
CREATE TABLE "marketing_contacts" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone_number" TEXT,
    "full_name" TEXT,
    "event_source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_tokens" (
    "email" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "token_expiry" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_tokens_pkey" PRIMARY KEY ("email")
);

-- CreateIndex
CREATE UNIQUE INDEX "marketing_contacts_email_key" ON "marketing_contacts"("email");

-- CreateIndex
CREATE INDEX "mail_logs_aws_message_id_idx" ON "mail_logs"("aws_message_id");
