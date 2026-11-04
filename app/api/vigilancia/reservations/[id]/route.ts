import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { detectTenant } from '@/lib/tenant/detection';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

// GET /api/vigilancia/reservations/[id]
// Fetches reservation details for inspection by vigilance staff via QR code scan.
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const tenant = await detectTenant();
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant no autorizado' }, { status: 401 });
  }

  const session = await getServerSession();
  const allowedRoles = [Role.SUPERUSER, Role.VIGILANCIA];
  if (!session || !allowedRoles.some(role => role === session.user.role)) {
    return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });
  }

  const queryId = params.id;
  if (!queryId) {
    return NextResponse.json({ error: 'ID de reservación requerido' }, { status: 400 });
  }

  try {
    const includeQuery = {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          identifier: true,
          phoneNumber: true,
        },
      },
      equipment: {
        select: {
          id: true,
          name: true,
          fixedAssetId: true,
          serialNumber: true,
        },
      },
      checkedOutByUser: {
        select: { firstName: true, lastName: true },
      },
      checkedInByUser: {
        select: { firstName: true, lastName: true },
      },
    };

    // Search first by displayId, then by cartSubmissionId
    let reservations = await prisma.reservation.findMany({
      where: {
        tenantId: tenant.id,
        displayId: queryId,
        equipmentId: { not: null },
      },
      include: includeQuery,
      orderBy: { createdAt: 'asc' },
    });

    if (!reservations || reservations.length === 0) {
      reservations = await prisma.reservation.findMany({
        where: {
          tenantId: tenant.id,
          cartSubmissionId: queryId,
          equipmentId: { not: null },
        },
        include: includeQuery,
        orderBy: { createdAt: 'asc' },
      });
    }

    if (!reservations || reservations.length === 0) {
      return NextResponse.json({ error: 'No se encontró la reservación solicitada.' }, { status: 404 });
    }

    const first = reservations[0];
    const isAllCheckedIn = reservations.every(r => !!r.checkedInAt);
    const isAnyCheckedOut = reservations.some(r => !!r.checkedOutAt);

    let statusText: 'PENDING_CHECKOUT' | 'CHECKED_OUT' | 'CHECKED_IN' = 'PENDING_CHECKOUT';
    if (isAllCheckedIn) {
      statusText = 'CHECKED_IN';
    } else if (isAnyCheckedOut) {
      statusText = 'CHECKED_OUT';
    }

    const responseData = {
      displayId: first.displayId || queryId,
      cartSubmissionId: first.cartSubmissionId,
      status: statusText,
      reservationStatus: first.status,
      startTime: first.startTime,
      endTime: first.endTime,
      user: {
        name: `${first.user.firstName || ''} ${first.user.lastName || ''}`.trim() || first.user.email,
        email: first.user.email,
        identifier: first.user.identifier || 'N/A',
        phoneNumber: first.user.phoneNumber || 'N/A',
      },
      items: reservations.map(r => ({
        id: r.id,
        name: r.equipment?.name || 'Equipo',
        fixedAssetId: r.equipment?.fixedAssetId || 'S/N',
        serialNumber: r.equipment?.serialNumber || 'S/N',
        checkedOutAt: r.checkedOutAt,
        checkedInAt: r.checkedInAt,
        checkedOutByName: r.checkedOutByUser ? `${r.checkedOutByUser.firstName || ''} ${r.checkedOutByUser.lastName || ''}`.trim() : null,
        checkedInByName: r.checkedInByUser ? `${r.checkedInByUser.firstName || ''} ${r.checkedInByUser.lastName || ''}`.trim() : null,
      })),
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error(`Error fetching reservation for vigilancia inspection ${queryId}:`, error);
    return NextResponse.json({ error: 'Error al consultar la reservación' }, { status: 500 });
  }
}
