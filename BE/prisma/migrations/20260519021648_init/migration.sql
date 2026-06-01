-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "MailLogStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'BOUNCED', 'OPENED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "html_body" TEXT NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'PENDING',
    "total_emails" INTEGER NOT NULL DEFAULT 0,
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mail_logs" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "recipient_email" TEXT NOT NULL,
    "recipient_name" TEXT,
    "status" "MailLogStatus" NOT NULL DEFAULT 'QUEUED',
    "message_id" TEXT,
    "error_message" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mail_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mail_logs_campaign_id_idx" ON "mail_logs"("campaign_id");

-- CreateIndex
CREATE INDEX "mail_logs_message_id_idx" ON "mail_logs"("message_id");

-- AddForeignKey
ALTER TABLE "mail_logs" ADD CONSTRAINT "mail_logs_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
