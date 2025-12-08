import * as XLSX from 'xlsx';

export interface ExcelRow {
    [key: string]: string | number | boolean | null;
}

/**
 * Genera un archivo Excel con las columnas especificadas
 */
export function generateExcelTemplate(
    columns: { header: string; key: string; example?: string }[],
    filename: string
): Buffer {
    // Crear headers
    const headers = columns.map(col => col.header);

    // Crear fila de ejemplo si existe
    const exampleRow = columns.map(col => col.example || '');

    // Crear worksheet
    const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);

    // Ajustar ancho de columnas
    ws['!cols'] = columns.map(() => ({ wch: 20 }));

    // Crear workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Datos');

    // Generar buffer
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Lee un archivo Excel y retorna las filas como objetos
 */
export function parseExcelFile(buffer: Buffer): ExcelRow[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convertir a JSON
    const data = XLSX.utils.sheet_to_json(worksheet, {
        raw: false, // Convertir todo a strings
        defval: null, // Valores por defecto para celdas vacías
    });

    return data as ExcelRow[];
}

/**
 * Valida que el archivo Excel tenga las columnas requeridas
 */
export function validateExcelColumns(
    data: ExcelRow[],
    requiredColumns: string[]
): { valid: boolean; missingColumns: string[] } {
    if (data.length === 0) {
        return { valid: false, missingColumns: requiredColumns };
    }

    const firstRow = data[0];
    const actualColumns = Object.keys(firstRow);
    const missingColumns = requiredColumns.filter(
        col => !actualColumns.includes(col)
    );

    return {
        valid: missingColumns.length === 0,
        missingColumns,
    };
}

/**
 * Normaliza valores booleanos de Excel (SI/NO, YES/NO, 1/0)
 */
export function parseBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
        const normalized = value.toLowerCase().trim();
        return normalized === 'si' || normalized === 'yes' || normalized === '1' || normalized === 'true';
    }
    return false;
}

/**
 * Normaliza valores de fecha de Excel
 */
export function parseDate(value: any): Date | null {
    if (!value) return null;

    // Si ya es una fecha
    if (value instanceof Date) return value;

    // Si es un string en formato YYYY-MM-DD
    if (typeof value === 'string') {
        const date = new Date(value);
        if (!isNaN(date.getTime())) return date;
    }

    // Si es un número (fecha de Excel)
    if (typeof value === 'number') {
        const date = XLSX.SSF.parse_date_code(value);
        return new Date(date.y, date.m - 1, date.d);
    }

    return null;
}
