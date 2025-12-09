import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { DEFAULT_FORM_CONFIG } from '@/lib/reservation-form-utils';

/**
 * GET /api/admin/reservation-form-config
 * Obtener la configuración del formulario de reservaciones
 */
export async function GET(req: Request) {
    try {
        const session = await getServerSession();

        if (!session) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        // Verificar que tenga permisos de administrador
        if (session.user.role !== 'SUPERUSER' && session.user.role !== 'ADMIN_RESOURCE') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        // Obtener tenant desde la sesión
        const tenant = await prisma.tenant.findUnique({
            where: { id: session.user.tenantId }
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });
        }

        // Obtener o crear configuración del tenant
        let config = await prisma.tenantConfig.findUnique({
            where: { tenantId: tenant.id },
            select: { reservationFormConfig: true }
        });

        if (!config) {
            // Crear configuración con valores por defecto
            config = await prisma.tenantConfig.create({
                data: {
                    tenantId: tenant.id,
                    reservationFormConfig: DEFAULT_FORM_CONFIG as any
                },
                select: { reservationFormConfig: true }
            });
        }

        // Si no tiene configuración del formulario, usar la por defecto
        const formConfig = config.reservationFormConfig || DEFAULT_FORM_CONFIG;

        return NextResponse.json(formConfig, { status: 200 });

    } catch (error: any) {
        console.error('Error fetching reservation form config:', error);
        return NextResponse.json({ error: 'Error al obtener configuración', details: error.message }, { status: 500 });
    }
}

/**
 * PUT /api/admin/reservation-form-config
 * Actualizar la configuración del formulario de reservaciones
 */
export async function PUT(req: Request) {
    try {
        const session = await getServerSession();

        if (!session) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        // Solo SUPERUSER y ADMIN_RESOURCE pueden modificar
        if (session.user.role !== 'SUPERUSER' && session.user.role !== 'ADMIN_RESOURCE') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        // Obtener tenant desde la sesión
        const tenant = await prisma.tenant.findUnique({
            where: { id: session.user.tenantId }
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });
        }

        const body = await req.json();
        const { fields } = body;

        // Validaciones
        if (!fields || !Array.isArray(fields)) {
            return NextResponse.json({ error: 'Configuración inválida: fields debe ser un array' }, { status: 400 });
        }

        // Verificar que al menos un campo esté habilitado
        const enabledFields = fields.filter(f => f.enabled);
        if (enabledFields.length === 0) {
            return NextResponse.json({ error: 'Debe haber al menos un campo habilitado' }, { status: 400 });
        }

        // Verificar que los IDs sean únicos
        const ids = fields.map(f => f.id);
        const uniqueIds = new Set(ids);
        if (ids.length !== uniqueIds.size) {
            return NextResponse.json({ error: 'Los IDs de campos deben ser únicos' }, { status: 400 });
        }

        // Validar estructura de cada campo
        for (const field of fields) {
            if (!field.id || !field.label || !field.type) {
                return NextResponse.json({ error: 'Cada campo debe tener id, label y type' }, { status: 400 });
            }

            if (!['text', 'textarea', 'file'].includes(field.type)) {
                return NextResponse.json({ error: `Tipo de campo inválido: ${field.type}` }, { status: 400 });
            }
        }

        const newConfig = { fields };

        // Actualizar configuración
        const updatedConfig = await prisma.tenantConfig.upsert({
            where: { tenantId: tenant.id },
            update: { reservationFormConfig: newConfig as any },
            create: {
                tenantId: tenant.id,
                reservationFormConfig: newConfig as any
            },
            select: { reservationFormConfig: true }
        });

        return NextResponse.json(updatedConfig.reservationFormConfig, { status: 200 });

    } catch (error: any) {
        console.error('Error updating reservation form config:', error);
        return NextResponse.json({ error: 'Error al actualizar configuración', details: error.message }, { status: 500 });
    }
}
