import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { Role, InscriptionStatus } from '@prisma/client';
import { generateQrDataUrl, getWorkshopCheckInUrl, getWorkshopPublicUrl } from '@/lib/workshops/qrcode';

// GET: Datos en vivo para proyección y control de asistencia
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (
    !session ||
    (session.user.role !== Role.SUPERUSER &&
      session.user.role !== Role.ADMIN_RESERVATION &&
      session.user.role !== Role.ADMIN_RESOURCE)
  ) {
    return NextResponse.json({ error: 'Acceso denegado.' }, { status: 403 });
  }

  const workshopId = params.id;

  try {
    const workshop = await prisma.workshop.findUnique({
      where: { id: workshopId },
      include: {
        responsibleUsers: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!workshop) {
      return NextResponse.json({ error: 'Taller no encontrado.' }, { status: 404 });
    }

    // Verificar si el usuario es responsable del taller (si no es superadmin)
    if (
      session.user.role !== Role.SUPERUSER &&
      !workshop.responsibleUsers.some((u) => u.id === session.user.id)
    ) {
      return NextResponse.json({ error: 'No tienes permisos sobre este taller.' }, { status: 403 });
    }

    // Obtener todas las inscripciones ordenadas cronológicamente
    const inscriptions = await prisma.inscription.findMany({
      where: { workshopId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            identifier: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const approved = inscriptions.filter((i) => i.status === InscriptionStatus.APPROVED);
    const waitlist = inscriptions.filter((i) => i.status === InscriptionStatus.WAITLIST).map((i, idx) => ({
      ...i,
      waitlistPosition: idx + 1,
    }));
    const pending = inscriptions.filter((i) => i.status === InscriptionStatus.PENDING || i.status === InscriptionStatus.PENDING_EXTRAORDINARY);

    const checkedInCount = approved.filter((i) => i.checkedIn).length;

    // Generar URLs y QRs
    const checkInUrl = getWorkshopCheckInUrl(workshopId);
    const publicUrl = getWorkshopPublicUrl(workshopId);

    const checkInQrDataUrl = await generateQrDataUrl(checkInUrl, { width: 500 });
    const shareQrDataUrl = await generateQrDataUrl(publicUrl, { width: 400 });

    return NextResponse.json({
      workshop: {
        id: workshop.id,
        name: workshop.name,
        teacher: workshop.teacher,
        room: workshop.room,
        startDate: workshop.startDate,
        endDate: workshop.endDate,
        capacity: workshop.capacity,
        autoApprove: workshop.autoApprove,
        allowWaitlist: workshop.allowWaitlist,
        maxWaitlist: workshop.maxWaitlist,
      },
      stats: {
        capacity: workshop.capacity,
        totalApproved: approved.length,
        totalCheckedIn: checkedInCount,
        attendanceRate: approved.length > 0 ? Math.round((checkedInCount / approved.length) * 100) : 0,
        totalWaitlist: waitlist.length,
        totalPending: pending.length,
      },
      approved,
      waitlist,
      pending,
      urls: {
        checkIn: checkInUrl,
        public: publicUrl,
      },
      qr: {
        checkInQrDataUrl,
        shareQrDataUrl,
      },
    });
  } catch (error: any) {
    console.error('Error al obtener datos de asistencia:', error);
    return NextResponse.json({ error: 'Error al obtener datos de asistencia.' }, { status: 500 });
  }
}

// POST: Marcar o desmarcar asistencia manual por el instructor
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (
    !session ||
    (session.user.role !== Role.SUPERUSER &&
      session.user.role !== Role.ADMIN_RESERVATION &&
      session.user.role !== Role.ADMIN_RESOURCE)
  ) {
    return NextResponse.json({ error: 'Acceso denegado.' }, { status: 403 });
  }

  const workshopId = params.id;

  try {
    const { inscriptionId, action } = await request.json();

    if (!inscriptionId) {
      return NextResponse.json({ error: 'ID de inscripción requerido.' }, { status: 400 });
    }

    const inscription = await prisma.inscription.findUnique({
      where: { id: inscriptionId },
      include: {
        workshop: {
          include: { responsibleUsers: { select: { id: true } } },
        },
        user: true,
      },
    });

    if (!inscription || inscription.workshopId !== workshopId) {
      return NextResponse.json({ error: 'Inscripción no encontrada para este taller.' }, { status: 404 });
    }

    if (
      session.user.role !== Role.SUPERUSER &&
      !inscription.workshop.responsibleUsers.some((u) => u.id === session.user.id)
    ) {
      return NextResponse.json({ error: 'No tienes permisos sobre este taller.' }, { status: 403 });
    }

    const shouldCheckIn = action !== 'undo';
    const now = new Date();

    const updated = await prisma.inscription.update({
      where: { id: inscriptionId },
      data: {
        checkedIn: shouldCheckIn,
        checkedInAt: shouldCheckIn ? now : null,
      },
      include: {
        user: { select: { firstName: true, lastName: true, identifier: true, email: true } },
      },
    });

    return NextResponse.json({
      success: true,
      inscription: updated,
      message: shouldCheckIn ? 'Asistencia registrada manualmente.' : 'Asistencia removida.',
    });
  } catch (error: any) {
    console.error('Error al actualizar asistencia manual:', error);
    return NextResponse.json({ error: 'Error al actualizar asistencia.' }, { status: 500 });
  }
}

