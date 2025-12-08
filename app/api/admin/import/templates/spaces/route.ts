import { NextResponse } from 'next/server';
import { generateExcelTemplate } from '@/lib/excel-utils';

export async function GET() {
    try {
        const columns = [
            { header: 'nombre', key: 'nombre', example: 'Laboratorio de Química' },
            { header: 'descripcion', key: 'descripcion', example: 'Espacio para prácticas de química' },
            { header: 'estado', key: 'estado', example: 'AVAILABLE' },
            { header: 'responsable_email', key: 'responsable_email', example: 'juan@ejemplo.com' },
            { header: 'requiere_reserva_espacio', key: 'requiere_reserva_espacio', example: 'NO' },
            { header: 'tiempo_anticipacion', key: 'tiempo_anticipacion', example: '24' },
        ];

        const buffer = generateExcelTemplate(columns, 'plantilla_espacios.xlsx');

        return new NextResponse(buffer as any, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="plantilla_espacios.xlsx"',
            },
        });
    } catch (error) {
        console.error('Error generando plantilla de espacios:', error);
        return NextResponse.json(
            { error: 'Error al generar la plantilla' },
            { status: 500 }
        );
    }
}
