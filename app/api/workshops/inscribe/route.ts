import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { InscriptionStatus } from '@prisma/client';
import { detectTenant } from '@/lib/tenant/detection';
import { getTenantPrisma } from '@/lib/tenant/prisma';
import { prisma as globalPrisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const tenant = await detectTenant();
  if (!tenant) {
    return NextResponse.json({ error: 'Unauthorized Tenant' }, { status: 401 });
  }
  const prisma = getTenantPrisma(tenant.id);
  // SECURITY FIX: Usar globalPrisma para transacciones
  const transactionPrisma = globalPrisma;

  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Debes iniciar sesión para inscribirte.' }, { status: 401 });
  }

  try {
    const { workshopId, isExtraordinary } = await req.json();
    const userId = session.user.id;

    const workshop = await prisma.workshop.findUnique({
      where: { id: workshopId },
      include: { _count: { select: { inscriptions: true } } },
    });

    if (!workshop) {
      return NextResponse.json({ error: 'Taller no encontrado.' }, { status: 404 });
    }

    // Verificar si las inscripciones están abiertas según inscriptionsStartDate
    if (workshop.inscriptionsStartDate && new Date() < new Date(workshop.inscriptionsStartDate)) {
      return NextResponse.json({ error: 'Las inscripciones para este taller aún no han comenzado.' }, { status: 403 });
    }

    // SECURITY FIX: Usar transacción para verificación atómica de capacidad
    try {
      const inscription = await transactionPrisma.$transaction(async (tx) => {
        // Verificar si el usuario ya está inscrito (dentro de la transacción)
        const existingInscription = await tx.inscription.findUnique({
          where: { workshopId_userId: { workshopId, userId } },
        });

        if (existingInscription) {
          throw new Error('Ya estás inscrito en este taller.');
        }

        // Contar inscripciones actuales (dentro de la transacción)
        const currentInscriptionsCount = await tx.inscription.count({
          where: { workshopId },
        });

        // Verificar capacidad atómicamente
        if (workshop.capacity > 0 && currentInscriptionsCount >= workshop.capacity) {
          throw new Error('El taller ya ha alcanzado su capacidad máxima.');
        }

        // Verificar el límite de inscripciones activas (dentro de la transacción)
        const activeInscriptions = await tx.inscription.findMany({
          where: {
            userId,
            status: {
              in: [InscriptionStatus.PENDING, InscriptionStatus.APPROVED],
            },
          },
          include: {
            workshop: {
              select: {
                endDate: true,
              },
            },
          },
        });

        const now = new Date();
        const currentActiveInscriptionsCount = activeInscriptions.filter(inscription => {
          // Si el estado es PENDING, siempre está activo.
          if (inscription.status === InscriptionStatus.PENDING) {
            return true;
          }
          // Si el estado es APPROVED, está activo solo si la fecha de fin del taller está en el futuro o es nula.
          if (inscription.status === InscriptionStatus.APPROVED) {
            return !(inscription as any).workshop.endDate || new Date((inscription as any).workshop.endDate) > now;
          }
          return false; // No debería ocurrir
        }).length;

        if (currentActiveInscriptionsCount >= 3) {
          if (isExtraordinary) {
            // Use globalPrisma for SystemSettings as it doesn't have tenantId
            const limitSetting = await globalPrisma.systemSettings.findUnique({
              where: { key: 'extraordinaryInscriptionLimit' },
            });
            const limit = limitSetting ? parseInt(limitSetting.value, 10) : 0;

            const extraordinaryInscriptionsCount = await tx.inscription.count({
              where: {
                userId,
                status: InscriptionStatus.PENDING_EXTRAORDINARY,
              },
            });

            if (extraordinaryInscriptionsCount >= limit) {
              throw new Error(`Ya has alcanzado el límite de ${limit} solicitudes de inscripción extraordinarias.`);
            }

            return await tx.inscription.create({
              data: {
                workshopId,
                userId,
                status: InscriptionStatus.PENDING_EXTRAORDINARY,
                tenantId: tenant.id,
              },
            });
          }
          throw new Error('Ya tienes el máximo de 3 inscripciones activas (pendientes o aprobadas). Por favor, espera a que se resuelvan las actuales.');
        }

        // Crear la inscripción atómicamente
        return await tx.inscription.create({
          data: {
            workshopId,
            userId,
            tenantId: tenant.id,
          },
        });
      });

      return NextResponse.json(inscription, { status: 201 });
    } catch (error: any) {
      // Manejar errores de la transacción
      if (error.message.includes('Ya estás inscrito') ||
        error.message.includes('capacidad máxima') ||
        error.message.includes('inscripciones activas') ||
        error.message.includes('límite de')) {
        return NextResponse.json({
          error: error.message,
          limitReached: error.message.includes('inscripciones activas')
        }, { status: 403 });
      }
      throw error;
    }

  } catch (error) {
    console.error('Error al crear la inscripción:', error);
    return NextResponse.json({ error: 'No se pudo procesar la inscripción.' }, { status: 500 });
  }
}
