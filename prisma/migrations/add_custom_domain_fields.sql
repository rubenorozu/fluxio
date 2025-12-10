-- Add custom domain fields to Tenant table
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "customDomain" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "domainStatus" TEXT DEFAULT 'NOT_CONFIGURED';
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "domainVerifiedAt" TIMESTAMP;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "sslEnabled" BOOLEAN DEFAULT false;

-- Create unique index for customDomain
CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_customDomain_key" ON "Tenant"("customDomain");

-- Add comment for documentation
COMMENT ON COLUMN "Tenant"."customDomain" IS 'Custom domain configured by tenant (e.g., universidad.com)';
COMMENT ON COLUMN "Tenant"."domainStatus" IS 'Status: NOT_CONFIGURED, PENDING_DNS, DNS_VERIFIED, SSL_PENDING, ACTIVE, FAILED';
