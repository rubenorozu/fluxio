-- Create DomainStatus enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "DomainStatus" AS ENUM (
        'NOT_CONFIGURED',
        'PENDING_DNS',
        'DNS_VERIFIED',
        'SSL_PENDING',
        'ACTIVE',
        'FAILED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Now add the columns (if they don't exist already)
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "customDomain" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "domainStatus" "DomainStatus" DEFAULT 'NOT_CONFIGURED';
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "domainVerifiedAt" TIMESTAMP;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "sslEnabled" BOOLEAN DEFAULT false;

-- Create unique index for customDomain
CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_customDomain_key" ON "Tenant"("customDomain");

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "Tenant_customDomain_idx" ON "Tenant"("customDomain");

-- Add comments for documentation
COMMENT ON COLUMN "Tenant"."customDomain" IS 'Custom domain configured by tenant (e.g., universidad.com)';
COMMENT ON COLUMN "Tenant"."domainStatus" IS 'Status: NOT_CONFIGURED, PENDING_DNS, DNS_VERIFIED, SSL_PENDING, ACTIVE, FAILED';
