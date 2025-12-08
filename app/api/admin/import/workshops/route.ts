import { NextResponse } from 'next/server';
import { parseExcelFile, parseBoolean, parseDate } from '@/lib/excel-utils';
import { prisma } from '@/lib/prisma';
import { detectTenant } from '@/lib/tenant/detection';

interface ImportResult {
    row: number;
    name?: string;
    id?: string;
    error?: string;
}

export async function POST(request: Request) {
    try {
        // Detectar tenant
        const tenant = await detectTenant();
        if (!tenant) {
            return NextResponse.json({ error: 'Tenant no detectado' }, { status: 400 });
        }

        // Leer archivo
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const rows = parseExcelFile(buffer);

        const created: ImportResult[] = [];
        const errors: ImportResult[] = [];

        // Procesar cada fila
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNumber = i + 2;

            try {
                // Validar campos requeridos
                if (!row.nombre) {
                    errors.push({ row: rowNumber, error: 'Nombre requerido' });
                    continue;
                }

                // Buscar responsable si se proporciona email
                let responsibleUserId: string | undefined;
                if (row.responsable_email) {
                    const user = await prisma.user.findFirst({
                        where: {
                            email: String(row.responsable_email),
                            tenantId: tenant.id,
                        },
                    });

                    if (!user) {
                        errors.push({
                            row: rowNumber,
                            error: `Usuario con email ${row.responsable_email} no encontrado`,
                        });
                        continue;
                    }
                    responsibleUserId = user.id;
                }

                // Parsear fechas
                const startDate = row.fecha_inicio ? parseDate(row.fecha_inicio) : null;
                const endDate = row.fecha_fin ? parseDate(row.fecha_fin) : null;

                // Validar que fecha fin sea después de fecha inicio
                if (startDate && endDate && endDate < startDate) {
                    errors.push({
                        row: rowNumber,
                        error: 'La fecha de fin debe ser posterior a la fecha de inicio',
                    });
                    continue;
                }

                // Crear taller
                const workshop = await prisma.workshop.create({
                    data: {
                        name: String(row.nombre),
                        description: row.descripcion ? String(row.descripcion) : null,
                        capacity: row.capacidad ? parseInt(String(row.capacidad)) : 0,
                        teacher: row.profesor ? String(row.profesor) : null,
                        schedule: row.horario ? String(row.horario) : null,
                        room: row.salon ? String(row.salon) : null,
                        startDate,
                        endDate,
                        inscriptionsOpen: row.inscripciones_abiertas
                            ? parseBoolean(row.inscripciones_abiertas)
                            : true,
                        tenantId: tenant.id,
                        responsibleUserId,
                    },
                });

                created.push({
                    row: rowNumber,
                    name: workshop.name,
                    id: workshop.id,
                });
            } catch (error: any) {
                errors.push({
                    row: rowNumber,
                    error: error.message || 'Error desconocido',
                });
            }
        }

        return NextResponse.json({
            success: true,
            summary: {
                total: rows.length,
                created: created.length,
                errors: errors.length,
            },
            created,
            errors,
        });
    } catch (error: any) {
        console.error('Error importando talleres:', error);
        return NextResponse.json(
            { error: error.message || 'Error al procesar la importación' },
            { status: 500 }
        );
    }
}
