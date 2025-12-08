import { NextResponse } from 'next/server';
import { generateExcelTemplate } from '@/lib/excel-utils';

export async function GET() {
    try {
        const columns = [
            { header: 'nombre', key: 'nombre', example: 'Taller de Robótica' },
            { header: 'descripcion', key: 'descripcion', example: 'Introducción a la robótica' },
            { header: 'capacidad', key: 'capacidad', example: '30' },
            { header: 'profesor', key: 'profesor', example: 'Dr. Roberto García' },
            { header: 'horario', key: 'horario', example: 'Lunes y Miércoles 14:00-16:00' },
            { header: 'salon', key: 'salon', example: 'A-201' },
            { header: 'fecha_inicio', key: 'fecha_inicio', example: '2025-01-15' },
            { header: 'fecha_fin', key: 'fecha_fin', example: '2025-06-15' },
            { header: 'inscripciones_abiertas', key: 'inscripciones_abiertas', example: 'SI' },
            { header: 'responsable_email', key: 'responsable_email', example: 'roberto@ejemplo.com' },
        ];

        const buffer = generateExcelTemplate(columns, 'plantilla_talleres.xlsx');

        return new NextResponse(buffer as any, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="plantilla_talleres.xlsx"',
            },
        });
    } catch (error) {
        console.error('Error generando plantilla de talleres:', error);
        return NextResponse.json(
            { error: 'Error al generar la plantilla' },
            { status: 500 }
        );
    }
}
