import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { DEFAULT_FORM_CONFIG } from '@/lib/reservation-form-utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reservation-form-config
 * Obtener la configuración del formulario de reservaciones para usuarios regulares
 * Accesible para cualquier usuario autenticado del tenant
 */
export async function GET(req: Request) {
    try {
        const session = await getServerSession();

        if (!session) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        // Obtener configuración del tenant del usuario actual
        // No se requiere rol de admin, solo pertenecer al tenant
        const config = await prisma.tenantConfig.findUnique({
            where: { tenantId: session.user.tenantId },
            select: { reservationFormConfig: true }
        });

        // Si no tiene configuración, usar la por defecto
        let formConfig = config?.reservationFormConfig || DEFAULT_FORM_CONFIG;

        // Asegurar que todos los campos por defecto existan en la configuración (merge)
        // Esto previene que campos añadidos posteriormente al código (ej. attachments)
        // no aparezcan porque el TenantConfig fue guardado en la BD antes de existir.
        if (formConfig && (formConfig as any).fields) {
            const existingFieldIds = new Set((formConfig as any).fields.map((f: any) => f.id));
            const missingFields = DEFAULT_FORM_CONFIG.fields.filter(f => !existingFieldIds.has(f.id));

            if (missingFields.length > 0) {
                formConfig = {
                    ...formConfig as any,
                    fields: [...(formConfig as any).fields, ...missingFields]
                };
            }
        }

        return NextResponse.json(formConfig, {
            status: 200,
            headers: {
                'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=300'
            }
        });

    } catch (error: any) {
        console.error('Error fetching reservation form config (public):', error);
        return NextResponse.json({
            error: 'Error al obtener configuración',
            details: error.message
        }, { status: 500 });
    }
}
