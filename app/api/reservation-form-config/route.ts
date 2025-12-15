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
        const formConfig = config?.reservationFormConfig || DEFAULT_FORM_CONFIG;

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
