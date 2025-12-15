# Fluxio RSV - Sistema de Reservaciones Multi-Tenant

Sistema de gestión de reservaciones multi-tenant con soporte para dominios personalizados.

## Características

- Multi-tenancy con subdominios
- Dominios personalizados (PROFESSIONAL/ENTERPRISE)
- Gestión de espacios y equipos
- Sistema de reservaciones con carrito de compras
- Notificaciones por email
- Panel de administración y Superadmin
- Generación de Hojas de Salida PDF con firmas configurables

## Configuración y Despliegue

### Requisitos Previa
- Node.js 18+
- PostgreSQL
- Cuenta en Vercel (para producción)

### Variables de Entorno
Ver `.env.example`. Asegúrate de configurar:
- `DATABASE_URL` y `DIRECT_URL` (Prisma)
- `NEXTAUTH_SECRET` y `JWT_SECRET`
- `BLOB_READ_WRITE_TOKEN` (Vercel Blob para imágenes)

### Despliegue en Vercel
1. Conectar repositorio GitHub a Vercel.
2. Configurar variables de entorno en el dashboard de Vercel.
3. El despliegue es automático con cada push a `main`.

## Onboarding de Clientes (Superadmin)

1. Acceder a `/superadmin` con credenciales de superusuario.
2. Ir a "Inquilinos" -> "Crear Nuevo".
3. Ingresar Nombre, Slug (subdominio) y Datos del Admin.
4. El sistema configurará automáticamente:
   - Usuario Admin
   - Configuración base (Logos, Colores)
   - Firmas PDF por defecto ("Coordinación de [Tenant]")

## Arquitectura y Aislamiento

El sistema utiliza un enfoque de "Single Database, Logical Isolation":
- Todos los datos residen en la misma base de datos.
- Cada registro (`User`, `Reservation`, `Space`, etc.) tiene un `tenantId`.
- El middleware y la capa de acceso a datos (`getTenantPrisma`) aseguran que un usuario solo acceda a los datos de su tenant.

## Custom Domains

Los tenants con planes PROFESSIONAL o ENTERPRISE pueden configurar dominios personalizados desde `/admin/custom-domain`.
