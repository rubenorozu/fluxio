import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { detectTenant } from '@/lib/tenant/detection';
import { getTenantPrisma } from '@/lib/tenant/prisma';
import { Role } from '@prisma/client';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    // SECURITY FIX: Agregar autenticación
    const session = await getServerSession();
    if (!session || session.user.role !== Role.SUPERUSER) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // SECURITY FIX: Verificar tenant
    const tenant = await detectTenant();
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }
    const prisma = getTenantPrisma(tenant.id);

    const { id } = params;
    const { status } = await req.json();

    if (!status) {
      return NextResponse.json({ message: 'Status is required' }, { status: 400 });
    }

    // SECURITY FIX: Verificar que la reservación pertenece al tenant
    const existingReservation = await prisma.reservation.findFirst({
      where: {
        id,
        tenantId: tenant.id
      }
    });

    if (!existingReservation) {
      return NextResponse.json({ message: 'Reservation not found' }, { status: 404 });
    }

    const updatedReservation = await prisma.reservation.update({
      where: { id },
      data: { status },
      include: {
        user: true, // Include user to get their email
      },
    });

    // Create on-site notification
    await prisma.notification.create({
      data: {
        recipientId: updatedReservation.userId,
        message: `Tu solicitud de reserva ha sido ${status.toLowerCase()}`,
      },
    });

    // Simulate sending an email


    return NextResponse.json(updatedReservation);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
