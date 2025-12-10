import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Obtener información básica del tenant
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const tenant = await prisma.tenant.findUnique({
            where: { id: session.tenantId },
            select: {
                id: true,
                name: true,
                slug: true,
                plan: true,
                isActive: true,
            },
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });
        }

        return NextResponse.json(tenant);
    } catch (error: any) {
        console.error('[Tenant Info API] Error:', error);
        return NextResponse.json({ error: 'Error al obtener información del tenant' }, { status: 500 });
    }
}
