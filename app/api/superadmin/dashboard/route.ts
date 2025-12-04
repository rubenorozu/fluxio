import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { Role } from '@prisma/client';

export async function GET(req: Request) {
    const session = await getServerSession();

    if (!session || session.user.role !== Role.SUPERUSER) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const [
            tenantCount,
            userCount,
            activeTenantsCount,
            recentTenants,
            recentUsers
        ] = await Promise.all([
            prisma.tenant.count(),
            prisma.user.count(),
            prisma.tenant.count({ where: { isActive: true } }),
            prisma.tenant.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: { id: true, name: true, slug: true, createdAt: true }
            }),
            prisma.user.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: { id: true, email: true, firstName: true, lastName: true, createdAt: true, tenant: { select: { name: true } } }
            })
        ]);

        return NextResponse.json({
            metrics: {
                totalTenants: tenantCount,
                activeTenants: activeTenantsCount,
                totalUsers: userCount,
            },
            recentActivity: {
                tenants: recentTenants,
                users: recentUsers
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard metrics:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
