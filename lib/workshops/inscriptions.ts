import { InscriptionStatus, Prisma } from '@prisma/client';
import { prisma as globalPrisma } from '../prisma';
import { getTenantPrisma } from '../tenant/prisma';
import { sendEmail } from '../email';

export interface InscribeParams {
  workshopId: string;
  userId: string;
  tenantId: string;
  isExtraordinary?: boolean;
}

export interface InscribeResult {
  inscription: any;
  status: InscriptionStatus;
  isWaitlist: boolean;
  waitlistPosition?: number;
  autoApproved: boolean;
  message: string;
}

/**
 * Procesa la inscripción a un taller considerando capacidad,
 * aprobación automática y lista de espera.
 */
export async function inscribeToWorkshop({
  workshopId,
  userId,
  tenantId,
  isExtraordinary = false,
}: InscribeParams): Promise<InscribeResult> {
  const prisma = getTenantPrisma(tenantId);
  const transactionPrisma = globalPrisma;

  return await transactionPrisma.$transaction(async (tx) => {
    // 0. Bloqueo pesimista a nivel de fila (Row-level lock) para evitar sobrecupo en alta concurrencia
    await tx.$queryRaw`SELECT id FROM "Workshop" WHERE id = ${workshopId} FOR UPDATE`;

    // 1. Obtener taller
    const workshop = await tx.workshop.findUnique({
      where: { id: workshopId },
      include: {
        _count: {
          select: { inscriptions: true },
        },
      },
    });

    if (!workshop) {
      throw new Error('Taller no encontrado.');
    }

    // 2. Verificar apertura de inscripciones
    if (workshop.inscriptionsStartDate && new Date() < new Date(workshop.inscriptionsStartDate)) {
      throw new Error('Las inscripciones para este taller aún no han comenzado.');
    }

    // 3. Verificar si el usuario ya tiene inscripción
    const existingInscription = await tx.inscription.findUnique({
      where: {
        workshopId_userId: { workshopId, userId },
      },
    });

    if (existingInscription) {
      if (existingInscription.status === InscriptionStatus.WAITLIST) {
        throw new Error('Ya estás en la lista de espera de este taller.');
      } else if (existingInscription.status === InscriptionStatus.APPROVED) {
        throw new Error('Ya estás inscrito y aprobado en este taller.');
      } else if (existingInscription.status === InscriptionStatus.PENDING) {
        throw new Error('Ya tienes una solicitud pendiente para este taller.');
      }
      throw new Error('Ya estás registrado en este taller.');
    }

    // 4. Calcular cupos ocupados
    // En auto-aprobación, los ocupados son los APPROVED.
    // En aprobación manual, PENDING y APPROVED ocupan cupo potencial.
    const activeStatusList = workshop.autoApprove
      ? [InscriptionStatus.APPROVED]
      : [InscriptionStatus.PENDING, InscriptionStatus.APPROVED];

    const currentConfirmedCount = await tx.inscription.count({
      where: {
        workshopId,
        status: { in: activeStatusList },
      },
    });

    const isFull = workshop.capacity > 0 && currentConfirmedCount >= workshop.capacity;

    // 5. Manejar caso de taller lleno
    if (isFull) {
      if (!workshop.allowWaitlist) {
        throw new Error('El taller ya ha alcanzado su capacidad máxima.');
      }

      // Contar personas actualmente en lista de espera
      const currentWaitlistCount = await tx.inscription.count({
        where: {
          workshopId,
          status: InscriptionStatus.WAITLIST,
        },
      });

      // Si tiene límite de lista de espera configurado
      if (workshop.maxWaitlist && workshop.maxWaitlist > 0 && currentWaitlistCount >= workshop.maxWaitlist) {
        throw new Error('La lista de espera para este taller se encuentra llena.');
      }

      const waitlistPosition = currentWaitlistCount + 1;

      // Crear inscripción en lista de espera
      const waitlistInscription = await tx.inscription.create({
        data: {
          workshopId,
          userId,
          status: InscriptionStatus.WAITLIST,
          tenantId: tenantId,
        },
      });

      return {
        inscription: waitlistInscription,
        status: InscriptionStatus.WAITLIST,
        isWaitlist: true,
        waitlistPosition,
        autoApproved: false,
        message: `El taller está completo. Has quedado en el lugar #${waitlistPosition} de la lista de espera.`,
      };
    }

    // 6. Si hay cupo disponible, verificar el límite de inscripciones activas del usuario (máximo 3)
    const activeInscriptions = await tx.inscription.findMany({
      where: {
        userId,
        status: {
          in: [InscriptionStatus.PENDING, InscriptionStatus.APPROVED],
        },
      },
      include: {
        workshop: {
          select: { endDate: true },
        },
      },
    });

    const now = new Date();
    const currentActiveInscriptionsCount = activeInscriptions.filter((inscription) => {
      if (inscription.status === InscriptionStatus.PENDING) return true;
      if (inscription.status === InscriptionStatus.APPROVED) {
        return !(inscription as any).workshop?.endDate || new Date((inscription as any).workshop.endDate) > now;
      }
      return false;
    }).length;

    if (currentActiveInscriptionsCount >= 3) {
      if (isExtraordinary) {
        const limitSetting = await globalPrisma.systemSettings.findUnique({
          where: { key: 'extraordinaryInscriptionLimit' },
        });
        const limit = limitSetting ? parseInt(limitSetting.value, 10) : 0;

        const extraordinaryCount = await tx.inscription.count({
          where: {
            userId,
            status: InscriptionStatus.PENDING_EXTRAORDINARY,
          },
        });

        if (extraordinaryCount >= limit) {
          throw new Error(`Has alcanzado el límite de ${limit} solicitudes de inscripción extraordinarias.`);
        }

        const extraordinaryInscription = await tx.inscription.create({
          data: {
            workshopId,
            userId,
            status: InscriptionStatus.PENDING_EXTRAORDINARY,
            tenantId,
          },
        });

        return {
          inscription: extraordinaryInscription,
          status: InscriptionStatus.PENDING_EXTRAORDINARY,
          isWaitlist: false,
          autoApproved: false,
          message: 'Solicitud extraordinaria enviada con éxito.',
        };
      }

      throw new Error('Ya tienes el máximo de 3 inscripciones activas (pendientes o aprobadas). Por favor, espera a que concluyan o se resuelvan.');
    }

    // 7. Determinar status final según el switch autoApprove
    const finalStatus = workshop.autoApprove ? InscriptionStatus.APPROVED : InscriptionStatus.PENDING;

    const newInscription = await tx.inscription.create({
      data: {
        workshopId,
        userId,
        status: finalStatus,
        tenantId,
      },
    });

    return {
      inscription: newInscription,
      status: finalStatus,
      isWaitlist: false,
      autoApproved: workshop.autoApprove,
      message: workshop.autoApprove
        ? '¡Tu inscripción ha sido aprobada automáticamente! Tienes tu lugar asegurado.'
        : 'Inscripción solicitada con éxito. Tu solicitud está en espera de aprobación por el administrador.',
    };
  });
}

/**
 * Promueve automáticamente al siguiente usuario en la lista de espera (por orden de registro)
 * si se ha liberado un lugar en el taller.
 */
export async function promoteNextFromWaitlist(
  workshopId: string,
  tenantId?: string | null,
  externalTx?: Prisma.TransactionClient
): Promise<any | null> {
  const runner = async (tx: Prisma.TransactionClient) => {
    // Bloquear taller para evitar carreras de promoción simultánea
    await tx.$queryRaw`SELECT id FROM "Workshop" WHERE id = ${workshopId} FOR UPDATE`;

    const workshop = await tx.workshop.findUnique({
      where: { id: workshopId },
    });

    if (!workshop || workshop.capacity <= 0) {
      return null;
    }

    // Contar cuántos confirmados hay actualmente
    const activeStatusList = workshop.autoApprove
      ? [InscriptionStatus.APPROVED]
      : [InscriptionStatus.PENDING, InscriptionStatus.APPROVED];

    const confirmedCount = await tx.inscription.count({
      where: {
        workshopId,
        status: { in: activeStatusList },
      },
    });

    // Si aún queda cupo disponible
    if (confirmedCount < workshop.capacity) {
      // Buscar el usuario más antiguo en lista de espera
      const nextWaitlist = await tx.inscription.findFirst({
        where: {
          workshopId,
          status: InscriptionStatus.WAITLIST,
        },
        orderBy: {
          createdAt: 'asc',
        },
        include: {
          user: true,
          workshop: true,
        },
      });

      if (!nextWaitlist) {
        return null;
      }

      // Si el taller tiene autoApprove, se aprueba directo. Si no, pasa a PENDING para revisión.
      const newStatus = workshop.autoApprove ? InscriptionStatus.APPROVED : InscriptionStatus.PENDING;

      const updated = await tx.inscription.update({
        where: { id: nextWaitlist.id },
        data: {
          status: newStatus,
        },
        include: {
          user: true,
          workshop: true,
        },
      });

      // Notificar por correo si está disponible el email del usuario
      if (updated.user?.email) {
        try {
          await sendEmail({
            to: updated.user.email,
            subject: `¡Se liberó un lugar en el taller: ${workshop.name}!`,
            html: `
              <h2>¡Buenas noticias!</h2>
              <p>Hola <strong>${updated.user.firstName || 'Estudiante'}</strong>,</p>
              <p>Se ha liberado un cupo en el taller <strong>${workshop.name}</strong> y has sido promovido de la lista de espera.</p>
              <p>Estado de tu inscripción: <strong>${newStatus === InscriptionStatus.APPROVED ? 'APROBADA' : 'PENDIENTE DE REVISIÓN'}</strong>.</p>
              <p>Puedes consultar tus talleres ingresando a la plataforma.</p>
            `,
          });
        } catch (emailErr) {
          console.error('[Waitlist Promotion] Error sending notification email:', emailErr);
        }
      }

      return updated;
    }

    return null;
  };

  if (externalTx) {
    return await runner(externalTx);
  } else {
    return await globalPrisma.$transaction(async (tx) => runner(tx));
  }
}

/**
 * Cancela una inscripción y, si era un cupo confirmado, promueve al siguiente en lista de espera.
 */
export async function cancelInscription({
  inscriptionId,
  userId,
  isAdmin = false,
}: {
  inscriptionId: string;
  userId?: string;
  isAdmin?: boolean;
}) {
  return await globalPrisma.$transaction(async (tx) => {
    const inscription = await tx.inscription.findUnique({
      where: { id: inscriptionId },
      include: { workshop: true },
    });

    if (!inscription) {
      throw new Error('Inscripción no encontrada.');
    }

    if (!isAdmin && userId && inscription.userId !== userId) {
      throw new Error('No tienes permiso para cancelar esta inscripción.');
    }

    const wasConfirmed =
      inscription.status === InscriptionStatus.APPROVED ||
      inscription.status === InscriptionStatus.PENDING;

    // Eliminar la inscripción
    await tx.inscription.delete({
      where: { id: inscriptionId },
    });

    let promotedInscription = null;
    if (wasConfirmed && inscription.workshopId) {
      promotedInscription = await promoteNextFromWaitlist(
        inscription.workshopId,
        inscription.tenantId,
        tx
      );
    }

    return {
      success: true,
      promotedInscription,
    };
  });
}

/**
 * Registra asistencia presencial con validación y prevención de duplicados.
 */
export async function registerAttendance({
  workshopId,
  userId,
}: {
  workshopId: string;
  userId: string;
}) {
  const inscription = await globalPrisma.inscription.findUnique({
    where: {
      workshopId_userId: {
        workshopId,
        userId,
      },
    },
    include: {
      user: true,
      workshop: true,
    },
  });

  if (!inscription) {
    return {
      success: false,
      code: 'NOT_INSCRIBED',
      message: 'No estás inscrito en este taller. Por favor acércate con el responsable del evento.',
    };
  }

  if (inscription.status === InscriptionStatus.WAITLIST) {
    return {
      success: false,
      code: 'WAITLIST',
      message: 'Te encuentras en la lista de espera. Solo los asistentes con cupo aprobado pueden registrar asistencia.',
    };
  }

  if (inscription.status === InscriptionStatus.PENDING) {
    return {
      success: false,
      code: 'PENDING',
      message: 'Tu inscripción aún se encuentra pendiente de aprobación.',
    };
  }

  if (inscription.status === InscriptionStatus.REJECTED) {
    return {
      success: false,
      code: 'REJECTED',
      message: 'Tu inscripción para este taller no fue aprobada.',
    };
  }

  // Si ya había registrado asistencia previamente (Anti-duplicidad)
  if (inscription.checkedIn) {
    return {
      success: true,
      alreadyCheckedIn: true,
      checkedInAt: inscription.checkedInAt,
      user: {
        name: `${inscription.user.firstName} ${inscription.user.lastName}`.trim(),
        email: inscription.user.email,
        matricula: inscription.user.identifier,
      },
      workshopName: inscription.workshop.name,
      message: `Tu asistencia ya fue registrada previamente a las ${new Date(inscription.checkedInAt!).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} hrs.`,
    };
  }

  // Registrar asistencia por primera vez
  const now = new Date();
  const updated = await globalPrisma.inscription.update({
    where: { id: inscription.id },
    data: {
      checkedIn: true,
      checkedInAt: now,
    },
    include: {
      user: true,
      workshop: true,
    },
  });

  return {
    success: true,
    alreadyCheckedIn: false,
    checkedInAt: now,
    user: {
      name: `${updated.user.firstName} ${updated.user.lastName}`.trim(),
      email: updated.user.email,
      matricula: updated.user.identifier,
    },
    workshopName: updated.workshop.name,
    message: '¡Asistencia registrada con éxito!',
  };
}
