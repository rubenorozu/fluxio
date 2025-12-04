import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * API helper para validar si un tenant está activo
 * Usado por el middleware (Edge Runtime) que no puede acceder a Prisma directamente
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const tenantId = searchParams.get('tenantId');

        if (!tenantId) {
            return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
        }

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { isActive: true },
        });

        return NextResponse.json({
            isActive: tenant?.isActive ?? false
        });

    } catch (error) {
        console.error('[API /api/tenant/check-active] Error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            isActive: false
        }, { status: 500 });
    }
}
