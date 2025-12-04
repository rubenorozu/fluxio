import { NextResponse } from 'next/server';
import { detectTenant } from '@/lib/tenant/detection';
import { getTenantPrisma } from '@/lib/prisma-tenant';

export async function GET(request: Request, { params }: { params: { spaceId: string } }) {
  try {
    const tenant = await detectTenant();
    if (!tenant) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { spaceId } = await params;

    if (!spaceId) {
      return NextResponse.json({ error: 'Space ID is required' }, { status: 400 });
    }

    const tenantPrisma = getTenantPrisma(tenant.id);

    // Verify space belongs to tenant
    const space = await tenantPrisma.space.findFirst({
      where: { id: spaceId },
    });

    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }

    const equipmentInSpace = await tenantPrisma.equipment.findMany({
      where: {
        spaceId: spaceId,
      },
      include: {
        images: true, // Include images so the cards can display them
      },
      orderBy: {
        name: 'asc', // Sort by name in ascending order
      },
    });

    return NextResponse.json(equipmentInSpace);
  } catch (error) {
    console.error(`Error fetching equipment for space:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
