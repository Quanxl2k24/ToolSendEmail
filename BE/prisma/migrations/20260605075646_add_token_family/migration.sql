-- AlterTable
ALTER TABLE "user_tokens" ADD COLUMN     "last_refreshed_at" TIMESTAMP(3),
ADD COLUMN     "token_family" TEXT;
