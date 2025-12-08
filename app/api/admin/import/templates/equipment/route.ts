import { NextResponse } from 'next/server';
import { generateExcelTemplate } from '@/lib/excel-utils';

export async function GET() {
    try {
        const columns = [
            { header: 'nombre', key: 'nombre', example: 'Microscopio Óptico' },
            { header: 'descripcion', key: 'descripcion', example: 'Microscopio con aumento 1000x' },
            { header: 'numero_serie', key: 'numero_serie', example: 'MS-2024-001' },
            { header: 'activo_fijo', key: 'activo_fijo', example: 'AF-12345' },
            { header: 'estado', key: 'estado', example: 'AVAILABLE' },
            { header: 'espacio_asignado', key: 'espacio_asignado', example: 'Laboratorio de Química' },
            { header: 'fijo_a_espacio', key: 'fijo_a_espacio', example: 'SI' },
            { header: 'responsable_email', key: 'responsable_email', example: 'maria@ejemplo.com' },
            { header: 'tiempo_anticipacion', key: 'tiempo_anticipacion', example: '48' },
        ];

        const buffer = generateExcelTemplate(columns, 'plantilla_equipos.xlsx');

        return new NextResponse(buffer as any, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="plantilla_equipos.xlsx"',
            },
        });
    } catch (error) {
        console.error('Error generando plantilla de equipos:', error);
        return NextResponse.json(
            { error: 'Error al generar la plantilla' },
            { status: 500 }
        );
    }
}
