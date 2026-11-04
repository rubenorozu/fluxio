import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { Role, ReservationStatus, InscriptionStatus } from '@prisma/client';
import { detectTenant } from '@/lib/tenant/detection';
import { getTenantPrisma } from '@/lib/tenant/prisma';

export async function GET() {
  const session = await getServerSession();

  if (
    !session ||
    (session.user.role !== Role.SUPERUSER &&
      session.user.role !== Role.ADMIN_RESERVATION &&
      session.user.role !== Role.ADMIN_RESOURCE)
  ) {
    return NextResponse.json({ error: 'Acceso denegado.' }, { status: 403 });
  }

  const tenant = await detectTenant();
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant no encontrado.' }, { status: 404 });
  }
  const prisma = getTenantPrisma(tenant.id);

  try {
    const [
      pendingReservations,
      activeWorkshops,
      pendingInscriptions,
      waitlistInscriptions,
      totalSpaces,
      totalEquipment,
      totalUsers,
    ] = await Promise.all([
      prisma.reservation.count({
        where: { status: ReservationStatus.PENDING },
      }),
      prisma.workshop.count({
        where: { inscriptionsOpen: true },
      }),
      prisma.inscription.count({
        where: { status: InscriptionStatus.PENDING },
      }),
      prisma.inscription.count({
        where: { status: InscriptionStatus.WAITLIST },
      }),
      prisma.space.count(),
      prisma.equipment.count(),
      prisma.user.count(),
    ]);

    return NextResponse.json({
      pendingReservations,
      activeWorkshops,
      pendingInscriptions,
      waitlistInscriptions,
      totalSpaces,
      totalEquipment,
      totalResources: totalSpaces + totalEquipment,
      totalUsers,
    });
  } catch (error: any) {
    console.error('Error al obtener estadísticas del dashboard:', error);
    return NextResponse.json(
      { error: 'No se pudieron obtener las estadísticas.' },
      { status: 500 }
    );
  }
}

