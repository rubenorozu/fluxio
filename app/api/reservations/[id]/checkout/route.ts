
import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role, ReservationStatus } from '@prisma/client';

// POST /api/reservations/[id]/checkout
// Marks a reservation as "checked out" by a VIGILANCIA user.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  // 1. Authentication & Authorization
  const allowedRoles = [Role.SUPERUSER, Role.VIGILANCIA];
  if (!session || !allowedRoles.some(role => role === session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const id = params.id;
  if (!id) {
    return NextResponse.json({ error: 'Reservation ID is required' }, { status: 400 });
  }

  try {
    // SECURITY FIX: Verificar tenant
    const { detectTenant } = await import('@/lib/tenant/detection');
    const { getTenantPrisma } = await import('@/lib/tenant/prisma');

    const tenant = await detectTenant();
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }
    const tenantPrisma = getTenantPrisma(tenant.id);

    // 2. Find the reservation - SECURITY FIX: Verificar que pertenece al tenant
    const reservation = await tenantPrisma.reservation.findFirst({
      where: {
        id,
        tenantId: tenant.id
      }
    });

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    // 3. Validation
    if (reservation.status !== ReservationStatus.APPROVED) {
      return NextResponse.json({ error: 'La reserva no está aprobada y no puede ser retirada.' }, { status: 400 });
    }

    if (reservation.checkedOutAt) {
      return NextResponse.json({ error: 'Este equipo ya ha sido retirado.' }, { status: 400 });
    }

    // Only equipment reservations can be checked out
    if (!reservation.equipmentId) {
      return NextResponse.json({ error: 'Esta reserva no es para un equipo y no puede ser retirada.' }, { status: 400 });
    }

    // 4. Update the reservation
    const updatedReservation = await tenantPrisma.reservation.update({
      where: { id },
      data: {
        checkedOutAt: new Date(),
        checkedOutByUserId: session.user.id,
      },
    });

    return NextResponse.json(updatedReservation);
  } catch (error) {
    console.error(`Error checking out reservation ${id}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
