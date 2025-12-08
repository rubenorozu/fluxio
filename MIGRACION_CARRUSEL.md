# Guía de Migración - Configuración del Carrusel

## ✅ Estado Actual

El archivo `.env.local` ha sido corregido con la variable `DIRECT_URL` necesaria.

## 📝 Siguiente Paso

Ejecuta este comando en tu terminal:

```bash
npx prisma migrate dev --name add_carousel_resource_limit
```

## ⏱️ Tiempo estimado
30-60 segundos

## ✅ Resultado Esperado

Deberías ver algo como:
```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database
Applying migration `20251208_add_carousel_resource_limit`
The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20251208XXXXXX_add_carousel_resource_limit/
    └─ migration.sql

Your database is now in sync with your schema.
```

## 🎯 Después de la Migración

1. Ve a `/admin/settings`
2. Busca el campo "Límite de Recursos en Carrusel"
3. Ajusta el valor (recomendado: 10-20)
4. Guarda los cambios

## 🔴 Si hay errores

Copia el mensaje de error completo y compártelo conmigo.
