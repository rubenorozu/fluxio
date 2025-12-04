-- AlterTable
ALTER TABLE "TenantConfig" ADD COLUMN "inscriptionApprovedColor" TEXT DEFAULT '#28A745';
ALTER TABLE "TenantConfig" ADD COLUMN "inscriptionPendingColor" TEXT DEFAULT '#17A2B8';
ALTER TABLE "TenantConfig" ADD COLUMN "pdfBottomLogoUrl" TEXT;
ALTER TABLE "TenantConfig" ADD COLUMN "pdfTopLogoUrl" TEXT;
ALTER TABLE "TenantConfig" ADD COLUMN "tertiaryColor" TEXT DEFAULT '#F28C00';
