/**
 * Utilidades para manejar la configuración del formulario de reservaciones
 */

export interface ReservationFormField {
    id: string;
    label: string;
    type: 'text' | 'textarea' | 'file';
    enabled: boolean;
    required: boolean;
    order: number;
    placeholder?: string;
    rows?: number;
    multiple?: boolean;
}

export interface ReservationFormConfig {
    fields: ReservationFormField[];
}

/**
 * Configuración por defecto del formulario
 */
export const DEFAULT_FORM_CONFIG: ReservationFormConfig = {
    fields: [
        {
            id: 'subject',
            label: 'Área',
            type: 'text',
            enabled: true,
            required: true,
            order: 1,
            placeholder: 'Ingrese el área'
        },
        {
            id: 'teacher',
            label: 'Proyecto',
            type: 'text',
            enabled: true,
            required: true,
            order: 2,
            placeholder: 'Nombre del proyecto'
        },
        {
            id: 'coordinator',
            label: 'Supervisor',
            type: 'text',
            enabled: true,
            required: true,
            order: 3,
            placeholder: 'Nombre del supervisor'
        },
        {
            id: 'justification',
            label: 'Justificación',
            type: 'textarea',
            enabled: true,
            required: true,
            order: 4,
            rows: 4,
            placeholder: 'Describa la justificación'
        }
    ]
};

/**
 * Obtiene el label personalizado de un campo
 */
export function getFieldLabel(fieldId: string, config?: ReservationFormConfig | null): string {
    if (!config) {
        return getDefaultLabel(fieldId);
    }

    const field = config.fields?.find(f => f.id === fieldId);
    return field?.label || getDefaultLabel(fieldId);
}

/**
 * Obtiene el label por defecto de un campo
 */
function getDefaultLabel(fieldId: string): string {
    const defaults: Record<string, string> = {
        subject: 'Área',
        teacher: 'Proyecto',
        coordinator: 'Supervisor',
        justification: 'Justificación',
        attachments: 'Adjuntar Archivos'
    };
    return defaults[fieldId] || fieldId;
}

/**
 * Obtiene el nombre amigable para mostrar en la UI de configuración
 */
export function getFieldDisplayName(fieldId: string): string {
    const displayNames: Record<string, string> = {
        subject: 'Área',
        teacher: 'Proyecto',
        coordinator: 'Supervisor',
        justification: 'Justificación',
        attachments: 'Adjuntar Archivos'
    };
    return displayNames[fieldId] || fieldId;
}

/**
 * Obtiene los campos habilitados ordenados
 */
export function getEnabledFields(config?: ReservationFormConfig | null): ReservationFormField[] {
    if (!config) {
        return DEFAULT_FORM_CONFIG.fields;
    }

    return config.fields
        .filter(f => f.enabled)
        .sort((a, b) => a.order - b.order);
}

/**
 * Obtiene los IDs de campos obligatorios
 */
export function getRequiredFieldIds(config?: ReservationFormConfig | null): string[] {
    const fields = getEnabledFields(config);
    return fields.filter(f => f.required).map(f => f.id);
}

/**
 * Verifica si un campo está habilitado
 */
export function isFieldEnabled(fieldId: string, config?: ReservationFormConfig | null): boolean {
    if (!config) {
        return true;
    }

    const field = config.fields?.find(f => f.id === fieldId);
    return field?.enabled ?? false;
}

/**
 * Verifica si un campo es obligatorio
 */
export function isFieldRequired(fieldId: string, config?: ReservationFormConfig | null): boolean {
    if (!config) {
        const defaultField = DEFAULT_FORM_CONFIG.fields.find(f => f.id === fieldId);
        return defaultField?.required ?? false;
    }

    const field = config.fields?.find(f => f.id === fieldId);
    return field?.required ?? false;
}

/**
 * Obtiene la configuración de un campo específico
 */
export function getFieldConfig(fieldId: string, config?: ReservationFormConfig | null): ReservationFormField | undefined {
    if (!config) {
        return DEFAULT_FORM_CONFIG.fields.find(f => f.id === fieldId);
    }

    return config.fields?.find(f => f.id === fieldId);
}
