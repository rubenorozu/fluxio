-- ============================================
-- Script para crear Superusuario en Fluxio
-- Usuario: Rubén Oroz
-- Email: rubenoroz@gmail.com
-- ============================================

-- 1. Obtener el ID del tenant 'platform' existente
DO $$
DECLARE
  platform_tenant_id TEXT;
BEGIN
  -- Buscar el tenant platform
  SELECT id INTO platform_tenant_id FROM "Tenant" WHERE slug = 'platform' LIMIT 1;
  
  -- Si no existe, crearlo
  IF platform_tenant_id IS NULL THEN
    INSERT INTO "Tenant" (id, name, slug, "isActive", plan, "maxUsers", "maxResources", "maxStorage", "createdAt", "updatedAt")
    VALUES (
      gen_random_uuid(),
      'Platform',
      'platform',
      true,
      'ENTERPRISE',
      999999,
      999999,
      999999,
      NOW(),
      NOW()
    )
    RETURNING id INTO platform_tenant_id;
    
    RAISE NOTICE 'Tenant platform creado con ID: %', platform_tenant_id;
  ELSE
    RAISE NOTICE 'Tenant platform ya existe con ID: %', platform_tenant_id;
  END IF;
  
  -- 2. Eliminar usuario existente si existe (para evitar duplicados)
  DELETE FROM "User" WHERE email = 'rubenoroz@gmail.com';
  
  -- 3. Crear el superusuario
  INSERT INTO "User" (
    id,
    email,
    "firstName",
    "lastName",
    password,
    identifier,
    role,
    "tenantId",
    "isVerified",
    "createdAt",
    "updatedAt"
  )
  VALUES (
    gen_random_uuid(),
    'rubenoroz@gmail.com',
    'Rubén',
    'Oroz',
    '$2b$10$ArOwVx9bripWFou26YVeJ.8nMsFlfGLqLjjI786xBQNqBeOx5ZBQK', -- Password: Lum@show1
    'SUPERADMIN',
    'SUPERUSER',
    platform_tenant_id,
    true,
    NOW(),
    NOW()
  );
  
  RAISE NOTICE 'Usuario rubenoroz@gmail.com creado exitosamente';
END $$;

-- 4. Crear TenantConfig si no existe
DO $$
DECLARE
  platform_tenant_id TEXT;
BEGIN
  SELECT id INTO platform_tenant_id FROM "Tenant" WHERE slug = 'platform' LIMIT 1;
  
  IF NOT EXISTS (SELECT 1 FROM "TenantConfig" WHERE "tenantId" = platform_tenant_id) THEN
    INSERT INTO "TenantConfig" (
      id,
      "tenantId",
      "siteName",
      "topLogoUrl",
      "topLogoHeight",
      "bottomLogoUrl",
      "faviconUrl",
      "primaryColor",
      "secondaryColor",
      "tertiaryColor",
      "carouselResourceLimit",
      "reservationFormConfig",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      gen_random_uuid(),
      platform_tenant_id,
      'Fluxio RSV',
      '/assets/Fluxio RSV.svg',
      50,
      '/assets/Fluxio RSV_bco.svg',
      '/assets/FaviconFluxioRSV.svg',
      '#0076A8',
      '#1F2937',
      '#ff9500',
      15,
      '{"fields":[{"id":"subject","label":"Materia","type":"text","enabled":true,"required":true,"order":1,"placeholder":"Ingrese la materia"},{"id":"teacher","label":"Maestro que solicita","type":"text","enabled":true,"required":true,"order":2,"placeholder":"Nombre del maestro"},{"id":"coordinator","label":"Coordinador que autoriza","type":"text","enabled":true,"required":true,"order":3,"placeholder":"Nombre del coordinador"},{"id":"justification","label":"Justificación del Proyecto","type":"textarea","enabled":true,"required":true,"order":4,"rows":4,"placeholder":"Describa la justificación del proyecto"}]}'::jsonb,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'TenantConfig creado para platform';
  END IF;
END $$;

-- 5. Verificar que se creó correctamente
SELECT 
  u.id,
  u.email,
  u."firstName",
  u."lastName",
  u.role,
  u."isVerified",
  t.slug as tenant,
  t.plan
FROM "User" u
JOIN "Tenant" t ON u."tenantId" = t.id
WHERE u.email = 'rubenoroz@gmail.com';

-- ============================================
-- CREDENCIALES DE ACCESO
-- ============================================
-- URL: https://www.fluxiorsv.com/login
-- Email: rubenoroz@gmail.com
-- Password: Lum@show1
-- ============================================
