# Guía: Cómo Agregar Enlaces a PDFs en "Cómo Funciona"

## ✨ Nombres Automáticos de Archivos

El sistema genera automáticamente nombres limpios y profesionales para tus archivos PDF:

**Para el tenant "ceproa"**:
- Reglamento → `ceproa-reglamento.pdf`
- Formato → `ceproa-formato-adjunto.pdf`

**Para el tenant "unidelcerro"**:
- Reglamento → `unidelcerro-reglamento.pdf`
- Formato → `unidelcerro-formato-adjunto.pdf`

### Ventajas:
- ✅ URLs limpias y profesionales
- ✅ Fáciles de recordar y compartir
- ✅ Se sobrescriben automáticamente al actualizar
- ✅ Identificables por organización

---

## Método Recomendado

### Pasos:

1. **Sube los archivos** en Admin → Configuración → Archivos PDF
2. **El sistema genera URLs automáticamente**:
   - `https://xxx.vercel-storage.com/ceproa-reglamento.pdf`
   - `https://xxx.vercel-storage.com/ceproa-formato-adjunto.pdf`
3. **Copia las URLs** que aparecen en "Ver archivo actual"
4. **Edita el JSON** de "Cómo Funciona" (paso 4)

### Ejemplo para tenant "ceproa":

```json
{
  "title": "Consulta el reglamento y descarga tus formatos",
  "description": "Revisa el <a href='https://xxx.vercel-storage.com/ceproa-reglamento.pdf' target='_blank'>reglamento</a> y descarga el <a href='https://xxx.vercel-storage.com/ceproa-formato-adjunto.pdf' target='_blank'>formato que debes adjuntar</a>."
}
```

---

## Ejemplo Completo

```json
[
  {
    "title": "Crea tu cuenta",
    "description": "Usa tu correo institucional y no olvides usar tus nombres y apellidos reales para ser candidato a préstamo."
  },
  {
    "title": "Inicia sesión",
    "description": "Ingresa con tu usuario y contraseña"
  },
  {
    "title": "Accede a la plataforma",
    "description": "Entra desde tu navegador"
  },
  {
    "title": "Consulta el reglamento y descarga tus formatos",
    "description": "Revisa el <a href='https://xxx.vercel-storage.com/ceproa-reglamento.pdf' target='_blank'>reglamento</a> y descarga el <a href='https://xxx.vercel-storage.com/ceproa-formato-adjunto.pdf' target='_blank'>formato que debes adjuntar</a>."
  },
  {
    "title": "Llena tu solicitud",
    "description": "Completa la información necesaria"
  },
  {
    "title": "Sube los archivos",
    "description": "Carga los documentos solicitados"
  },
  {
    "title": "Revisa tu progreso",
    "description": "Consulta el estado de tu trámite"
  },
  {
    "title": "Recibe la validación",
    "description": "Confirma que tu proceso ha concluido"
  }
]
```

---

## Notas Importantes

- Los enlaces se abren en nueva pestaña (`target='_blank'`)
- Usa comillas simples (`'`) dentro del JSON
- El HTML es seguro y se renderiza correctamente
- Si subes un nuevo archivo, **sobrescribe el anterior** manteniendo el mismo nombre
- No necesitas actualizar el JSON si reemplazas el archivo (la URL es la misma)

## Placeholders por Defecto

El contenido base usa placeholders que debes reemplazar:
- `{{REGLAMENTO_URL}}` → URL real de tu reglamento
- `{{FORMATO_URL}}` → URL real de tu formato

