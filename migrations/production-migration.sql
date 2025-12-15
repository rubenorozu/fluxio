-- Ejecutar en Supabase SQL Editor
-- Este script agrega las columnas necesarias a la base de datos de producción

-- 1. Agregar campo pricingPlans
ALTER TABLE "TenantConfig" 
ADD COLUMN IF NOT EXISTS "pricingPlans" JSONB;

-- 2. Agregar campos de imágenes de landing
ALTER TABLE "TenantConfig" 
ADD COLUMN IF NOT EXISTS "landingHeroImage" TEXT,
ADD COLUMN IF NOT EXISTS "landingHeroImageA" TEXT,
ADD COLUMN IF NOT EXISTS "landingHeroImageB" TEXT,
ADD COLUMN IF NOT EXISTS "landingHeroImageC" TEXT,
ADD COLUMN IF NOT EXISTS "landingScreenshot1" TEXT,
ADD COLUMN IF NOT EXISTS "landingScreenshot2" TEXT,
ADD COLUMN IF NOT EXISTS "landingScreenshot3" TEXT,
ADD COLUMN IF NOT EXISTS "landingScreenshot4" TEXT;
