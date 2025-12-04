-- Actualizar configuración del tenant con logo y color primario
UPDATE TenantConfig 
SET 
  topLogoUrl = '/assets/Ceproa.svg',
  primaryColor = '#145775'
WHERE tenantId IN (SELECT id FROM Tenant LIMIT 1);
