-- Migration to add PDF Signature configuration fields to TenantConfig

ALTER TABLE "TenantConfig" ADD COLUMN IF NOT EXISTS "pdfSignatureTitle" TEXT;
ALTER TABLE "TenantConfig" ADD COLUMN IF NOT EXISTS "pdfSignatureName" TEXT;
