import { NextResponse } from 'next/server';
import { parseExcelFile, parseBoolean } from '@/lib/excel-utils';
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

                // Buscar espacio si se proporciona
                let spaceId: string | undefined;
                if (row.espacio_asignado) {
                    const space = await prisma.space.findFirst({
                        where: {
                            name: String(row.espacio_asignado),
                            tenantId: tenant.id,
                        },
                    });

                    if (!space) {
                        errors.push({
                            row: rowNumber,
                            error: `Espacio "${row.espacio_asignado}" no encontrado`,
                        });
                        continue;
                    }
                    spaceId = space.id;
                }

                // Validar estado
                const status = row.estado ? String(row.estado).toUpperCase() : 'AVAILABLE';
                if (status !== 'AVAILABLE' && status !== 'IN_MAINTENANCE') {
                    errors.push({
                        row: rowNumber,
                        error: `Estado inválido: ${status}. Debe ser AVAILABLE o IN_MAINTENANCE`,
                    });
                    continue;
                }

                // Crear equipo
                const equipment = await prisma.equipment.create({
                    data: {
                        name: String(row.nombre),
                        description: row.descripcion ? String(row.descripcion) : null,
                        serialNumber: row.numero_serie ? String(row.numero_serie) : null,
                        fixedAssetId: row.activo_fijo ? String(row.activo_fijo) : null,
                        status: status as 'AVAILABLE' | 'IN_MAINTENANCE',
                        tenantId: tenant.id,
                        spaceId,
                        responsibleUserId,
                        isFixedToSpace: row.fijo_a_espacio ? parseBoolean(row.fijo_a_espacio) : false,
                        reservationLeadTime: row.tiempo_anticipacion
                            ? parseInt(String(row.tiempo_anticipacion))
                            : null,
                    },
                });

                created.push({
                    row: rowNumber,
                    name: equipment.name,
                    id: equipment.id,
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
        console.error('Error importando equipos:', error);
        return NextResponse.json(
            { error: error.message || 'Error al procesar la importación' },
            { status: 500 }
        );
    }
}
