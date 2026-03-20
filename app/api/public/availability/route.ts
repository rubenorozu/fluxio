import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { detectTenant } from '@/lib/tenant/detection';
import { getTenantPrisma } from '@/lib/tenant/prisma';
import { prisma as basePrisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerSession();

  // Requerimos que el usuario tenga sesión iniciada para ver esto
  if (!session) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
  }

  const tenant = await detectTenant();
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  const prisma = getTenantPrisma(tenant.id);
  const { searchParams } = new URL(request.url);
  const resourceType = searchParams.get('resourceType'); // 'space' | 'equipment'
  const resourceId = searchParams.get('resourceId');
  const startStr = searchParams.get('start');
  const endStr = searchParams.get('end');

  if (!resourceType || !resourceId || (resourceType !== 'space' && resourceType !== 'equipment')) {
    return NextResponse.json({ error: 'Faltan parámetros válidos (resourceType, resourceId).' }, { status: 400 });
  }

  try {
    const events: any[] = [];

    // 1. Fetch Reservations
    const reservationWhere: any = {
      status: { in: ['APPROVED', 'PENDING'] },
      tenantId: tenant.id
    };

    if (resourceType === 'space') {
      reservationWhere.spaceId = resourceId;
    } else {
      reservationWhere.equipmentId = resourceId;
    }

    if (startStr && endStr) {
      reservationWhere.startTime = { gte: new Date(startStr) };
      reservationWhere.endTime = { lte: new Date(endStr) };
    }

    const reservations = await basePrisma.reservation.findMany({
      where: reservationWhere,
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
      }
    });

    reservations.forEach((item: any) => {
      events.push({
        id: `res-${item.id}`,
        title: item.status === 'PENDING' ? 'Pendiente de Aprobación' : 'Ocupado',
        start: item.startTime.toISOString(),
        end: item.endTime.toISOString(),
        backgroundColor: item.status === 'PENDING' ? '#f39c12' : '#e74c3c', // Naranja = Pendiente, Rojo = Ocupado
        borderColor: item.status === 'PENDING' ? '#f39c12' : '#e74c3c',
        display: 'block',
      });
    });

    // 2. Fetch RecurringBlocks
    const blockWhere: any = {};
    if (resourceType === 'space') {
      blockWhere.spaceId = resourceId;
    } else {
      blockWhere.equipment = {
        some: { equipmentId: resourceId }
      };
    }

    const recurringBlocks = await prisma.recurringBlock.findMany({
      where: blockWhere,
      select: {
        id: true,
        startDate: true,
        endDate: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        title: true, // We can use the custom title given by the admin (like 'Clase de Artes') or replace it with 'Ocupado'
      }
    });

    recurringBlocks.forEach((block: any) => {
      // Mapping '0' to Sunday, '1' to Monday (Standard in FullCalendar)
      // Prisma schema is String for dayOfWeek, assumed to be '0'-res '6'-res
      const dayInt = parseInt(block.dayOfWeek, 10);
      if (!isNaN(dayInt)) {
        events.push({
          id: `block-${block.id}`,
          title: 'Bloqueo Institucional / Ocupado',
          daysOfWeek: [dayInt],
          startTime: block.startTime,
          endTime: block.endTime,
          startRecur: block.startDate.toISOString(),
          endRecur: block.endDate.toISOString(),
          backgroundColor: '#95a5a6', // Gris para bloqueos institucionales
          borderColor: '#95a5a6',
          display: 'block',
        });
      }
    });

    return NextResponse.json(events, { status: 200 });
  } catch (error) {
    console.error('Error fetching public availability:', error);
    return NextResponse.json({ message: 'Error internal' }, { status: 500 });
  }
}
