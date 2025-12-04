
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

    const equipment = await tenantPrisma.equipment.findFirst({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        displayId: true,
        images: true,
        reservationLeadTime: true,
        isFixedToSpace: true,
        responsibleUser: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!equipment) {
      return NextResponse.json({ message: 'Equipo no encontrado.' }, { status: 404 });
    }

    return NextResponse.json(equipment);
  } catch (error: unknown) {
    console.error('Error al obtener detalles del equipo:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ message: 'Algo salió mal al obtener el equipo.' }, { status: 500 });
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
    const existingEquipment = await tenantPrisma.equipment.findFirst({
      where: { id },
    });

    if (!existingEquipment) {
      return NextResponse.json({ message: 'Equipo no encontrado.' }, { status: 404 });
    }

    const body = await req.json();
    const { name, description, serialNumber, fixedAssetId, reservationLeadTime, isFixedToSpace } = body;

    const updatedEquipment = await prisma.equipment.update({
      where: { id },
      data: {
        name,
        description,
        serialNumber,
        fixedAssetId,
        reservationLeadTime: reservationLeadTime ? parseInt(reservationLeadTime) : null,
        isFixedToSpace: isFixedToSpace || false,
      },
    });

    return NextResponse.json(updatedEquipment);
  } catch (error) {
    console.error('Error updating equipment:', error);
    return NextResponse.json({ message: 'Algo salió mal al actualizar el equipo.' }, { status: 500 });
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
    const existingEquipment = await tenantPrisma.equipment.findFirst({
      where: { id },
    });

    if (!existingEquipment) {
      return NextResponse.json({ message: 'Equipo no encontrado.' }, { status: 404 });
    }

    await prisma.equipment.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Equipo eliminado correctamente.' });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    return NextResponse.json({ message: 'Algo salió mal al eliminar el equipo.' }, { status: 500 });
  }
}
