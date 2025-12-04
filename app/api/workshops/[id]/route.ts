import { NextResponse } from 'next/server';
import { detectTenant } from '@/lib/tenant/detection';
import { getTenantPrisma } from '@/lib/tenant/prisma';

interface Params {
  params: { id: string };
}

export async function GET(req: Request, { params }: Params) {
  try {
    const tenant = await detectTenant();
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }
    const prisma = getTenantPrisma(tenant.id);

    const { id } = await params;

    const workshop = await prisma.workshop.findUnique({
      where: { id },
      include: {
        images: true,
        responsibleUser: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        sessions: true,
        _count: {
          select: { inscriptions: true },
        },
      },
    });

    if (!workshop) {
      return NextResponse.json({ message: 'Taller no encontrado.' }, { status: 404 });
    }

    // Add additional fields directly from the workshop object
    const workshopWithDetails = {
      ...workshop,
      teacher: workshop.teacher,
      startDate: workshop.startDate,
      endDate: workshop.endDate,
      inscriptionsOpen: workshop.inscriptionsOpen,
      inscriptionsStartDate: workshop.inscriptionsStartDate,
      capacity: workshop.capacity,
      inscriptionsCount: (workshop as any)._count?.inscriptions || 0,
    };

    return NextResponse.json(workshopWithDetails, { status: 200 });

  } catch (error) {
    console.error('Error al obtener el taller:', error);
    return NextResponse.json({ error: 'No se pudo obtener el taller.' }, { status: 500 });
  }
}