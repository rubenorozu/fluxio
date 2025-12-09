-- Agregar campo de configuración del formulario de reservaciones
ALTER TABLE "TenantConfig" ADD COLUMN "reservationFormConfig" JSONB;

-- Configuración por defecto para el formulario
-- Esta configuración mantiene el comportamiento actual del sistema
UPDATE "TenantConfig" 
SET "reservationFormConfig" = '{
  "fields": [
    {
      "id": "subject",
      "label": "Materia",
      "type": "text",
      "enabled": true,
      "required": true,
      "order": 1,
      "placeholder": "Ingrese la materia"
    },
    {
      "id": "teacher",
      "label": "Maestro que solicita",
      "type": "text",
      "enabled": true,
      "required": true,
      "order": 2,
      "placeholder": "Nombre del maestro"
    },
    {
      "id": "coordinator",
      "label": "Coordinador que autoriza",
      "type": "text",
      "enabled": true,
      "required": true,
      "order": 3,
      "placeholder": "Nombre del coordinador"
    },
    {
      "id": "justification",
      "label": "Justificación del Proyecto",
      "type": "textarea",
      "enabled": true,
      "required": true,
      "order": 4,
      "rows": 4,
      "placeholder": "Describa la justificación del proyecto"
    }
  ]
}'::jsonb
WHERE "reservationFormConfig" IS NULL;
