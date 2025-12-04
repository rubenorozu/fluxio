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

    const whereClause: Prisma.SpaceWhereInput = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { displayId: { not: null, contains: search } },
      ];
    }

    const spaces = await prisma.space.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        description: true,
        displayId: true,
        images: true,
        reservationLeadTime: true,
        requiresSpaceReservationWithEquipment: true,
        _count: { select: { equipments: true } },
      },
    });
    return NextResponse.json(spaces);
  } catch (error) {
    console.error('Error fetching spaces:', error);
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
    const { name, description, reservationLeadTime, requiresSpaceReservationWithEquipment } = body;

    if (!name) {
      return NextResponse.json({ message: 'Name is required' }, { status: 400 });
    }

    const newSpace = await prisma.space.create({
      data: {
        name,
        description,
        reservationLeadTime: reservationLeadTime ? parseInt(reservationLeadTime) : null,
        requiresSpaceReservationWithEquipment: requiresSpaceReservationWithEquipment || false,
      },
    });

    return NextResponse.json(newSpace, { status: 201 });
  } catch (error) {
    console.error('Error creating space:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
