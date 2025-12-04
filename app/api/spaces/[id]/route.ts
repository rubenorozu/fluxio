import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { detectTenant } from '@/lib/tenant/detection';
import { getTenantPrisma } from '@/lib/prisma-tenant';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const tenant = await detectTenant();
    if (!tenant) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const tenantPrisma = getTenantPrisma(tenant.id);

    const space = await tenantPrisma.space.findFirst({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        images: true,
        reservationLeadTime: true,
        requiresSpaceReservationWithEquipment: true,
        responsibleUser: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!space) {
      return NextResponse.json({ message: 'Space not found' }, { status: 404 });
    }

    return NextResponse.json(space);
  } catch (error: unknown) {
    console.error('Error fetching space details:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const tenant = await detectTenant();
    if (!tenant) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const tenantPrisma = getTenantPrisma(tenant.id);

    // Verify ownership
    const existingSpace = await tenantPrisma.space.findFirst({
      where: { id },
    });

    if (!existingSpace) {
      return NextResponse.json({ message: 'Space not found' }, { status: 404 });
    }

    const body = await req.json();
    const { name, description, reservationLeadTime, requiresSpaceReservationWithEquipment } = body;

    const updatedSpace = await prisma.space.update({
      where: { id },
      data: {
        name,
        description,
        reservationLeadTime: reservationLeadTime ? parseInt(reservationLeadTime) : null,
        requiresSpaceReservationWithEquipment: requiresSpaceReservationWithEquipment || false,
      },
    });

    return NextResponse.json(updatedSpace);
  } catch (error) {
    console.error('Error updating space:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const tenant = await detectTenant();
    if (!tenant) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const tenantPrisma = getTenantPrisma(tenant.id);

    // Verify ownership
    const existingSpace = await tenantPrisma.space.findFirst({
      where: { id },
    });

    if (!existingSpace) {
      return NextResponse.json({ message: 'Space not found' }, { status: 404 });
    }

    await prisma.space.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Space deleted successfully' });
  } catch (error) {
    console.error('Error deleting space:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}