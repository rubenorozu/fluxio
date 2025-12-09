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
        // SECURITY FIX: Verificar autenticación
        const { getServerSession } = await import('@/lib/auth');
        const { Role } = await import('@prisma/client');

        const session = await getServerSession();
        if (!session || (session.user.role !== Role.SUPERUSER && session.user.role !== Role.ADMIN_RESOURCE)) {
            return NextResponse.json({ error: 'Acceso denegado. Se requieren privilegios de administrador.' }, { status: 403 });
        }

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

        // SECURITY FIX: Validar tipo y extensión de archivo
        const allowedExtensions = ['.xlsx', '.xls'];
        const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];

        if (!extension || !allowedExtensions.includes(extension)) {
            return NextResponse.json({
                error: 'Solo se permiten archivos Excel (.xlsx, .xls)'
            }, { status: 400 });
        }

        // SECURITY FIX: Validar tamaño del archivo (máx 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({
                error: 'El archivo excede el límite de 5MB'
            }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const rows = parseExcelFile(buffer);

        const created: ImportResult[] = [];
        const errors: ImportResult[] = [];

        // Procesar cada fila
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNumber = i + 2; // +2 porque Excel empieza en 1 y tiene header

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

                // Validar estado
                const status = row.estado ? String(row.estado).toUpperCase() : 'AVAILABLE';
                if (status !== 'AVAILABLE' && status !== 'IN_MAINTENANCE') {
                    errors.push({
                        row: rowNumber,
                        error: `Estado inválido: ${status}. Debe ser AVAILABLE o IN_MAINTENANCE`,
                    });
                    continue;
                }

                // Crear espacio
                const space = await prisma.space.create({
                    data: {
                        name: String(row.nombre),
                        description: row.descripcion ? String(row.descripcion) : null,
                        status: status as 'AVAILABLE' | 'IN_MAINTENANCE',
                        tenantId: tenant.id,
                        responsibleUserId,
                        requiresSpaceReservationWithEquipment: row.requiere_reserva_espacio
                            ? parseBoolean(row.requiere_reserva_espacio)
                            : false,
                        reservationLeadTime: row.tiempo_anticipacion
                            ? parseInt(String(row.tiempo_anticipacion))
                            : null,
                    },
                });

                created.push({
                    row: rowNumber,
                    name: space.name,
                    id: space.id,
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
        console.error('Error importando espacios:', error);
        return NextResponse.json(
            { error: error.message || 'Error al procesar la importación' },
            { status: 500 }
        );
    }
}
