import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { detectTenant } from '@/lib/tenant/detection';
import { getTenantPrisma } from '@/lib/tenant/prisma';
import { Role } from '@prisma/client';
import { generateDisplayId } from '@/lib/displayId';

const allowedAdminRoles: Role[] = [Role.SUPERUSER, Role.ADMIN_RESOURCE, Role.ADMIN_RESERVATION];

// GET /api/reservations
export async function GET(request: NextRequest) {
  const tenant = await detectTenant();
  if (!tenant) {
    return NextResponse.json({ error: 'Unauthorized Tenant' }, { status: 401 });
  }
  const prisma = getTenantPrisma(tenant.id);

  const session = await getServerSession();
  if (!session || !allowedAdminRoles.includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const spaceId = searchParams.get('spaceId');
  const equipmentId = searchParams.get('equipmentId');

  if (!start || !end) {
    return NextResponse.json({ error: 'Missing start or end date' }, { status: 400 });
  }

  if (!spaceId && !equipmentId) {
    return NextResponse.json({ error: 'Missing spaceId or equipmentId' }, { status: 400 });
  }

  const whereClause: any = {
    status: { in: ['APPROVED', 'PENDING'] },
    startTime: { gte: new Date(start) },
    endTime: { lte: new Date(end) },
  };

  if (spaceId) {
    whereClause.spaceId = spaceId;
  } else if (equipmentId) {
    whereClause.equipmentId = equipmentId;
  }

  try {
    const reservations = await prisma.reservation.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        space: {
          select: {
            responsibleUserId: true,
          },
        },
        equipment: {
          select: {
            responsibleUserId: true,
          },
        },
      },
    });
    return NextResponse.json(reservations);
  } catch (error) {
    console.error("Error fetching reservations:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/reservations
export async function POST(request: NextRequest) {
  const tenant = await detectTenant();
  if (!tenant) {
    return NextResponse.json({ error: 'Unauthorized Tenant' }, { status: 401 });
  }
  const prisma = getTenantPrisma(tenant.id);

  const session = await getServerSession();
  if (!session || !allowedAdminRoles.includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { start, end, title, spaceId, equipmentId } = body;

    if (!start || !end || !title || (!spaceId && !equipmentId)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Authorization check for ADMIN_RESOURCE and ADMIN_RESERVATION roles
    if (session.user.role === Role.ADMIN_RESOURCE || session.user.role === Role.ADMIN_RESERVATION) {
      let resource;
      if (spaceId) {
        resource = await prisma.space.findUnique({ where: { id: spaceId } });
      } else if (equipmentId) {
        resource = await prisma.equipment.findUnique({ where: { id: equipmentId } });
      }

      if (!resource || resource.responsibleUserId !== session.user.id) {
        return NextResponse.json({ error: 'Acceso denegado. No eres responsable de este recurso.' }, { status: 403 });
      }
    }

    const startTime = new Date(start);
    const endTime = new Date(end);

    // SECURITY FIX: Validar fechas lógicas
    if (startTime >= endTime) {
      return NextResponse.json({
        error: 'La fecha de inicio debe ser anterior a la fecha de fin'
      }, { status: 400 });
    }

    // SECURITY FIX: Verificar conflictos de horario
    const whereConflict: any = {
      status: { in: ['APPROVED', 'PENDING'] },
      OR: [
        // Nueva reservación empieza durante una existente
        {
          startTime: { lte: startTime },
          endTime: { gt: startTime },
        },
        // Nueva reservación termina durante una existente
        {
          startTime: { lt: endTime },
          endTime: { gte: endTime },
        },
        // Nueva reservación contiene una existente
        {
          startTime: { gte: startTime },
          endTime: { lte: endTime },
        },
      ],
    };

    if (spaceId) {
      whereConflict.spaceId = spaceId;
    } else if (equipmentId) {
      whereConflict.equipmentId = equipmentId;
    }

    const conflictingReservations = await prisma.reservation.findMany({
      where: whereConflict,
      select: {
        id: true,
        startTime: true,
        endTime: true,
        justification: true,
      },
    });

    if (conflictingReservations.length > 0) {
      return NextResponse.json({
        error: 'Ya existe una reservación en este horario',
        conflicts: conflictingReservations
      }, { status: 409 });
    }

    // import { generateDisplayId } from '@/lib/displayId'; // Removed from here

    // ... (inside POST function)

    // Generate displayId using the shared utility
    // We pass prisma as the transaction client since we are not in a larger transaction here, 
    // but the utility handles the counter update atomically enough for this context.
    const displayId = await generateDisplayId(prisma as any, session.user.id, tenant.id);

    const data: any = {
      displayId,
      startTime: new Date(start),
      endTime: new Date(end),
      justification: title,
      status: 'APPROVED',
      userId: session.user.id,
      subject: 'Bloqueo Administrativo',
      // tenantId is automatically injected by getTenantPrisma wrapper
    };

    if (spaceId) {
      data.spaceId = spaceId;
    } else if (equipmentId) {
      data.equipmentId = equipmentId;
    }

    const newBlock = await prisma.reservation.create({ data });

    return NextResponse.json(newBlock, { status: 201 });
  } catch (error) {
    console.error("Error creating block:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
