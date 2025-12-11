import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/pricing-plans
 * Obtiene los planes de pricing configurados
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession();

        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        // Solo el tenant platform puede configurar planes
        const tenant = await prisma.tenant.findUnique({
            where: { id: session.user.tenantId },
            select: { slug: true }
        });

        if (tenant?.slug !== 'platform') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        // Obtener configuración
        const config = await prisma.tenantConfig.findUnique({
            where: { tenantId: session.user.tenantId },
            select: { pricingPlans: true }
        });

        return NextResponse.json({
            plans: config?.pricingPlans || null
        });
    } catch (error) {
        console.error('[Pricing Plans API] Error:', error);
        return NextResponse.json({ error: 'Error al obtener planes' }, { status: 500 });
    }
}

/**
 * POST /api/admin/pricing-plans
 * Guarda los planes de pricing
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession();

        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        // Solo el tenant platform puede configurar planes
        const tenant = await prisma.tenant.findUnique({
            where: { id: session.user.tenantId },
            select: { slug: true }
        });

        if (tenant?.slug !== 'platform') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const { plans } = await request.json();

        if (!plans || !Array.isArray(plans)) {
            return NextResponse.json({ error: 'Planes inválidos' }, { status: 400 });
        }

        // Actualizar configuración
        await prisma.tenantConfig.update({
            where: { tenantId: session.user.tenantId },
            data: { pricingPlans: plans }
        });

        return NextResponse.json({
            success: true,
            message: 'Planes guardados exitosamente'
        });
    } catch (error) {
        console.error('[Pricing Plans API] Error:', error);
        return NextResponse.json({ error: 'Error al guardar planes' }, { status: 500 });
    }
}
