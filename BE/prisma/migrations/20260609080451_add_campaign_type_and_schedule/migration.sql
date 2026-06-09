-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('ONE_SHOT', 'SCHEDULED');

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "end_time" TIMESTAMP(3),
ADD COLUMN     "last_scanned_at" TIMESTAMP(3),
ADD COLUMN     "start_time" TIMESTAMP(3),
ADD COLUMN     "type" "CampaignType" NOT NULL DEFAULT 'ONE_SHOT';
