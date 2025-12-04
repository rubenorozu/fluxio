import { NextResponse } from 'next/server';
import { detectTenant } from '@/lib/tenant/detection';
import { getTenantPrisma } from '@/lib/prisma-tenant';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const tenant = await detectTenant();
    if (!tenant) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const prisma = getTenantPrisma(tenant.id);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const whereClause: Prisma.EquipmentWhereInput = { spaceId: null };

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { serialNumber: { contains: search } },
        { fixedAssetId: { contains: search } },
        { displayId: { not: null, contains: search } },
      ];
    }

    const equipment = await prisma.equipment.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        description: true,
        displayId: true,
        images: true,
        reservationLeadTime: true,
        isFixedToSpace: true,
      },
    });

    return NextResponse.json(equipment);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const tenant = await detectTenant();
    if (!tenant) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const prisma = getTenantPrisma(tenant.id);
    const body = await request.json();
    const { name, description, serialNumber, fixedAssetId, reservationLeadTime, isFixedToSpace } = body;

    if (!name) {
      return NextResponse.json({ message: 'Name is required' }, { status: 400 });
    }

    const newEquipment = await prisma.equipment.create({
      data: {
        name,
        description,
        serialNumber,
        fixedAssetId,
        reservationLeadTime: reservationLeadTime ? parseInt(reservationLeadTime) : null,
        isFixedToSpace: isFixedToSpace || false,
      },
    });

    return NextResponse.json(newEquipment, { status: 201 });
  } catch (error) {
    console.error('Error creating equipment:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
