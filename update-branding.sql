-- Script para actualizar la configuración de branding del tenant platform
-- Colores y logo de FluxioRSV

UPDATE "TenantConfig"
SET 
  "primaryColor" = '#145775',
  "secondaryColor" = '#1F2937',
  "tertiaryColor" = '#ff9500',
  "inscriptionDefaultColor" = '#ff9500',
  "inscriptionPendingColor" = '#ff9500',
  "inscriptionApprovedColor" = '#207e36',
  "topLogoUrl" = '/assets/Fluxio RSV.svg',
  "bottomLogoUrl" = '/assets/Fluxio RSV.svg',
  "pdfTopLogoUrl" = '/assets/Fluxio RSV.svg',
  "pdfBottomLogoUrl" = '/assets/Fluxio RSV.svg',
  "siteName" = 'FluxioRSV',
  "updatedAt" = NOW()
WHERE "tenantId" = 'platform-tenant-id';

-- Si no existe el config, crearlo
INSERT INTO "TenantConfig" (
  id,
  "tenantId",
  "primaryColor",
  "secondaryColor",
  "tertiaryColor",
  "inscriptionDefaultColor",
  "inscriptionPendingColor",
  "inscriptionApprovedColor",
  "topLogoUrl",
  "bottomLogoUrl",
  "pdfTopLogoUrl",
  "pdfBottomLogoUrl",
  "siteName",
  "createdAt",
  "updatedAt"
)
SELECT 
  gen_random_uuid(),
  'platform-tenant-id',
  '#145775',
  '#1F2937',
  '#ff9500',
  '#ff9500',
  '#ff9500',
  '#207e36',
  '/assets/Fluxio RSV.svg',
  '/assets/Fluxio RSV.svg',
  '/assets/Fluxio RSV.svg',
  '/assets/Fluxio RSV.svg',
  'FluxioRSV',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "TenantConfig" WHERE "tenantId" = 'platform-tenant-id'
);

-- Verificar la configuración
SELECT 
  tc.*,
  t.name as tenant_name,
  t.slug as tenant_slug
FROM "TenantConfig" tc
JOIN "Tenant" t ON tc."tenantId" = t.id
WHERE t.slug = 'platform';
