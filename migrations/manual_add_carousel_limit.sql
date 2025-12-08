-- Migración: Agregar campo carouselResourceLimit a TenantConfig
-- Fecha: 2025-12-08
-- Descripción: Agrega configuración para limitar recursos en el carrusel de la página de inicio

-- Agregar columna carouselResourceLimit con valor por defecto 15
ALTER TABLE "TenantConfig" 
ADD COLUMN IF NOT EXISTS "carouselResourceLimit" INTEGER DEFAULT 15;

-- Verificar que se agregó correctamente
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'TenantConfig' 
AND column_name = 'carouselResourceLimit';
