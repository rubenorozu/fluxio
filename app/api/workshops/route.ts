import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { detectTenant } from '@/lib/tenant/detection';
import { getTenantPrisma } from '@/lib/tenant/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const tenant = await detectTenant();
    if (!tenant) {
      console.log('[API/Workshops] No tenant detected');
      return NextResponse.json({ error: 'Unauthorized Tenant' }, { status: 401 });
    }
    console.log(`[API/Workshops] Detected Tenant: ${tenant.slug} (${tenant.id})`);
    const prisma = getTenantPrisma(tenant.id);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const whereClause: Prisma.WorkshopWhereInput = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { teacher: { contains: search } },
      ];
    }

    const workshops = await prisma.workshop.findMany({
      where: whereClause,
      include: {
        images: true, // Incluir las imágenes relacionadas
        _count: {
          select: { inscriptions: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    workshops.sort((a, b) => {
      const aIsAvailable = a.inscriptionsOpen && (!a.inscriptionsStartDate || new Date(a.inscriptionsStartDate) <= new Date());
      const bIsAvailable = b.inscriptionsOpen && (!b.inscriptionsStartDate || new Date(b.inscriptionsStartDate) <= new Date());

      if (aIsAvailable && !bIsAvailable) {
        return -1;
      }
      if (!aIsAvailable && bIsAvailable) {
        return 1;
      }
      return 0;
    });

    return NextResponse.json(workshops);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
