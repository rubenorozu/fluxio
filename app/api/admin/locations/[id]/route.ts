import { Role } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { detectTenant } from '@/lib/tenant/detection';
import { getTenantPrisma } from '@/lib/tenant/prisma';

export async function PUT(request: Request, context: { params: { id: string } }) {
  // Wait for params to resolve in Next.js 15
  const params = await context.params;
  const locationId = params.id;
  const session = await getServerSession();

  if (!session || (session.user.role !== Role.SUPERUSER && session.user.role !== Role.ADMIN_RESOURCE)) {
    return NextResponse.json({ error: 'Acceso denegado.' }, { status: 403 });
  }

  const tenant = await detectTenant();
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }
  const prisma = getTenantPrisma(tenant.id);

  try {
    const { name, zone, description } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'El nombre de la ubicación es obligatorio.' }, { status: 400 });
    }

    const updatedLocation = await prisma.location.update({
      where: { id: locationId },
      data: {
        name: name.trim(),
        zone: zone ? zone.trim() : null,
        description: description ? description.trim() : null,
      },
    });

    return NextResponse.json(updatedLocation, { status: 200 });
  } catch (error) {
    console.error('Error updating location:', error);
    return NextResponse.json({ error: 'No se pudo actualizar la ubicación.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
  // Wait for params to resolve in Next.js 15
  const params = await context.params;
  const locationId = params.id;
  const session = await getServerSession();

  if (!session || (session.user.role !== Role.SUPERUSER && session.user.role !== Role.ADMIN_RESOURCE)) {
    return NextResponse.json({ error: 'Acceso denegado.' }, { status: 403 });
  }

  const tenant = await detectTenant();
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }
  const prisma = getTenantPrisma(tenant.id);

  try {
    // Check if location is in use
    const locationWithRelations = (await prisma.location.findUnique({
      where: { id: locationId },
      include: {
        _count: {
          select: { spaces: true, equipment: true }
        }
      }
    })) as any;

    if (!locationWithRelations) {
      return NextResponse.json({ error: 'Ubicación no encontrada.' }, { status: 404 });
    }

    if (locationWithRelations._count.spaces > 0 || locationWithRelations._count.equipment > 0) {
      return NextResponse.json({ 
        error: 'No se puede eliminar la ubicación porque tiene recursos asociados.' 
      }, { status: 400 });
    }

    await prisma.location.delete({
      where: { id: locationId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting location:', error);
    return NextResponse.json({ error: 'No se pudo eliminar la ubicación.' }, { status: 500 });
  }
}
