import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/public/pricing-plans
 * Obtiene los planes de pricing para mostrar en la landing page (público)
 */
export async function GET(request: NextRequest) {
    try {
        // Obtener configuración del tenant platform
        const platformTenant = await prisma.tenant.findUnique({
            where: { slug: 'platform' },
            select: { id: true }
        });

        if (!platformTenant) {
            return NextResponse.json({ plans: null });
        }

        // Obtener configuración
        const config = await prisma.tenantConfig.findUnique({
            where: { tenantId: platformTenant.id },
            select: { pricingPlans: true }
        });

        return NextResponse.json({
            plans: config?.pricingPlans || null
        });
    } catch (error) {
        console.error('[Public Pricing Plans API] Error:', error);
        return NextResponse.json({ plans: null });
    }
}
