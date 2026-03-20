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
      status: { in: ['APPROVED', 'PENDING', 'PARTIALLY_APPROVED'] },
      tenantId: tenant.id
    };

    if (resourceType === 'space') {
      reservationWhere.spaceId = resourceId;
    } else {
      reservationWhere.equipmentId = resourceId;
    }

    if (startStr && endStr) {
      const start = new Date(startStr);
      const end = new Date(endStr);
      // Overlap logic: event starts before view ends AND event ends after view starts
      reservationWhere.startTime = { lt: end };
      reservationWhere.endTime = { gt: start };
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
        backgroundColor: '#95a5a6', // Uniform Grey for public
        borderColor: '#95a5a6',
        display: 'block',
      });
    });

    // 2. Fetch RecurringBlocks
    // Using basePrisma here too to bypass tenantId filtering if it's null in DB
    const blockWhere: any = {};
    if (resourceType === 'space') {
      blockWhere.spaceId = resourceId;
    } else {
      blockWhere.equipment = {
        some: { equipmentId: resourceId }
      };
    }

    const recurringBlocks = await basePrisma.recurringBlock.findMany({
      where: blockWhere,
      select: {
        id: true,
        startDate: true,
        endDate: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        title: true,
      }
    });

    recurringBlocks.forEach((block: any) => {
      try {
        const blockDays = typeof block.dayOfWeek === 'string' && block.dayOfWeek.startsWith('[') 
          ? JSON.parse(block.dayOfWeek) 
          : [parseInt(block.dayOfWeek, 10)];
        
        const daysArray = Array.isArray(blockDays) ? blockDays : [blockDays];
        const validDays = daysArray.filter(d => !isNaN(d));

        if (validDays.length > 0) {
          events.push({
            id: `block-${block.id}`,
            title: 'Bloqueo Institucional / Ocupado',
            daysOfWeek: validDays,
            startTime: block.startTime,
            endTime: block.endTime,
            startRecur: block.startDate.toISOString(),
            endRecur: block.endDate.toISOString(),
            backgroundColor: '#95a5a6',
            borderColor: '#95a5a6',
            display: 'block',
          });
        }
      } catch (err) {
        console.error('Error parsing blockDays:', block.dayOfWeek, err);
      }
    });

    return NextResponse.json(events, { status: 200 });
  } catch (error) {
    console.error('Error fetching public availability:', error);
    return NextResponse.json({ message: 'Error internal' }, { status: 500 });
  }
}
