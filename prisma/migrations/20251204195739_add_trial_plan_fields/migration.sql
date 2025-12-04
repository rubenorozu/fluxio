-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN "trialDays" INTEGER DEFAULT 7;
ALTER TABLE "Tenant" ADD COLUMN "trialExpiresAt" DATETIME;
