-- Actualizar colores de todos los tenants existentes
UPDATE TenantConfig 
SET 
  primaryColor = '#145775',
  secondaryColor = '#1F2937',
  tertiaryColor = '#ff9500',
  inscriptionDefaultColor = '#ff9500',
  inscriptionPendingColor = '#ff9500',
  inscriptionApprovedColor = '#28A745'
WHERE tenantId IN (SELECT id FROM Tenant);
