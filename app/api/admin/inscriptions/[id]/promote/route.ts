import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { Role, InscriptionStatus } from '@prisma/client';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();

  if (
    !session ||
    (session.user.role !== Role.SUPERUSER &&
      session.user.role !== Role.ADMIN_RESERVATION &&
      session.user.role !== Role.ADMIN_RESOURCE)
  ) {
    return NextResponse.json({ error: 'Acceso denegado.' }, { status: 403 });
  }

  const inscriptionId = params.id;

  try {
    const inscription = await prisma.inscription.findUnique({
      where: { id: inscriptionId },
      include: {
        workshop: {
          include: { responsibleUsers: { select: { id: true } } },
        },
        user: true,
      },
    });

    if (!inscription) {
      return NextResponse.json({ error: 'Inscripción no encontrada.' }, { status: 404 });
    }

    if (
      session.user.role !== Role.SUPERUSER &&
      !inscription.workshop.responsibleUsers.some((u) => u.id === session.user.id)
    ) {
      return NextResponse.json({ error: 'No tienes permisos sobre este taller.' }, { status: 403 });
    }

    const updated = await prisma.inscription.update({
      where: { id: inscriptionId },
      data: {
        status: InscriptionStatus.APPROVED,
      },
      include: {
        workshop: { select: { name: true } },
        user: true,
      },
    });

    // Notificación en la plataforma
    await prisma.notification.create({
      data: {
        recipientId: updated.userId,
        message: `¡Tu inscripción al taller "${updated.workshop.name}" ha sido aprobada desde la lista de espera!`,
      },
    });

    // Notificación por correo
    if (updated.user?.email) {
      try {
        await sendEmail({
          to: updated.user.email,
          subject: `¡Inscripción aprobada para el taller: ${updated.workshop.name}!`,
          html: `
            <h2>¡Tu lugar ha sido confirmado!</h2>
            <p>Hola <strong>${updated.user.firstName || 'Estudiante'}</strong>,</p>
            <p>Has sido promovido con éxito de la lista de espera y tu inscripción al taller <strong>${updated.workshop.name}</strong> ahora se encuentra <strong>APROBADA</strong>.</p>
            <p>¡Te esperamos en el taller!</p>
          `,
        });
      } catch (emailErr) {
        console.error('Error enviando correo de promoción:', emailErr);
      }
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    console.error('Error al promover inscripción:', error);
    return NextResponse.json({ error: 'No se pudo promover la inscripción.' }, { status: 500 });
  }
}

