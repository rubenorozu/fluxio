# Pendientes del Proyecto

## 🔴 Alta Prioridad

### 1. Problema: No se pueden eliminar organizaciones
**Reportado:** 2025-12-08
**Descripción:** El usuario reporta que no puede eliminar organizaciones desde `/admin/tenants`
**Ubicación:** [app/admin/tenants/page.tsx](file:///Users/univa/Documents/fluxio-saas/app/admin/tenants/page.tsx)
**Acción requerida:** Investigar y corregir el endpoint DELETE

---

## 🟡 Media Prioridad

### 2. Configuración de Límite de Recursos en Carrusel
**Estado:** Parcialmente implementado
**Pendiente:**
- Ejecutar migración de Prisma para agregar campo `carouselResourceLimit`
- Agregar campo en UI de settings
- Actualizar tipos TypeScript en `lib/tenant/detection.ts`

**Archivos modificados:**
- [prisma/schema.prisma](file:///Users/univa/Documents/fluxio-saas/prisma/schema.prisma) - Campo agregado
- [app/page.tsx](file:///Users/univa/Documents/fluxio-saas/app/page.tsx) - Código actualizado para usar límite

**Comando de migración pendiente:**
```bash
npx prisma migrate dev --name add_carousel_resource_limit
```

---

## 🟢 Completado Recientemente

### ✅ Sistema de Importación Masiva Excel
- Endpoints de plantillas (espacios, equipos, talleres)
- Endpoints de importación con validaciones
- UI integrada en `/admin/settings`

### ✅ Optimización de Carrusel
- Limitado a 15 recursos por tipo (configurable)
- Orden por fecha de creación

### ✅ Corrección de Subida de Logotipos
- Identificado problema de `BLOB_READ_WRITE_TOKEN` faltante en Vercel
