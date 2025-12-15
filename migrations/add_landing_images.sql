-- Add landing page image fields to TenantConfig
ALTER TABLE "TenantConfig" 
ADD COLUMN IF NOT EXISTS "landingHeroImage" TEXT,
ADD COLUMN IF NOT EXISTS "landingHeroImageA" TEXT,
ADD COLUMN IF NOT EXISTS "landingHeroImageB" TEXT,
ADD COLUMN IF NOT EXISTS "landingHeroImageC" TEXT,
ADD COLUMN IF NOT EXISTS "landingScreenshot1" TEXT,
ADD COLUMN IF NOT EXISTS "landingScreenshot2" TEXT,
ADD COLUMN IF NOT EXISTS "landingScreenshot3" TEXT,
ADD COLUMN IF NOT EXISTS "landingScreenshot4" TEXT;
