import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/prisma-tenant';
import { Role } from '@prisma/client';

const allowedAdminRoles: Role[] = [Role.SUPERUSER, Role.ADMIN_RESOURCE, Role.ADMIN_RESERVATION];

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || !allowedAdminRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Usar Prisma con filtro de tenant
    const prisma = getTenantPrisma(session.user.tenantId);

    // Obtener espacios y equipos del tenant actual
    const [spaces, equipment] = await Promise.all([
      prisma.space.findMany({
        select: {
          id: true,
          name: true,
          displayId: true,
          description: true,
          status: true,
        },
        orderBy: { name: 'asc' },
      }),
      prisma.equipment.findMany({
        select: {
          id: true,
          name: true,
          displayId: true,
          description: true,
          status: true,
        },
        orderBy: { name: 'asc' },
      })
    ]);

    return NextResponse.json({ spaces, equipment });

  } catch (error: any) {
    console.error('Error fetching all resources:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
