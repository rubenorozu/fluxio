-- AlterTable
ALTER TABLE "TenantConfig" ADD COLUMN "landingAutoResponse" BOOLEAN DEFAULT true;
ALTER TABLE "TenantConfig" ADD COLUMN "landingAutoResponseMessage" TEXT DEFAULT 'Gracias por tu interés en Fluxio RSV.';
ALTER TABLE "TenantConfig" ADD COLUMN "landingContactEmail" TEXT DEFAULT 'contacto@fluxiorsv.com';
ALTER TABLE "TenantConfig" ADD COLUMN "landingDemoTrialDays" INTEGER DEFAULT 7;
ALTER TABLE "TenantConfig" ADD COLUMN "landingFormFields" JSONB;
