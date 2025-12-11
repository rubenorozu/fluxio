-- Agregar campo pricingPlans a TenantConfig
ALTER TABLE "TenantConfig" 
ADD COLUMN IF NOT EXISTS "pricingPlans" JSONB;

-- Comentario
COMMENT ON COLUMN "TenantConfig"."pricingPlans" IS 'JSON array of pricing plans for platform landing page';
