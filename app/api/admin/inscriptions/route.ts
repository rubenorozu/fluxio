import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession, verifyToken } from '@/lib/auth';
import { Role, Prisma, InscriptionStatus } from '@prisma/client';
import { normalizeText, matchesSearchTokens } from '@/lib/search-utils';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const queryToken = searchParams.get('token');
  let session = await getServerSession();

  if (!session && queryToken) {
    const payload = await verifyToken(queryToken);
    if (payload && (payload.role === Role.SUPERUSER || payload.role === Role.ADMIN_RESERVATION || payload.role === Role.ADMIN_RESOURCE)) {
      session = { user: payload as any };
    }
  }

  if (!session || (session.user.role !== Role.SUPERUSER && session.user.role !== Role.ADMIN_RESERVATION && session.user.role !== Role.ADMIN_RESOURCE)) {
    return NextResponse.json({ error: 'Acceso denegado. Se requieren privilegios de Superusuario o Administrador de Reservas.' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const workshopIdFilter = searchParams.get('workshopId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

    const whereClause: Prisma.InscriptionWhereInput = {};

    if (workshopIdFilter) {
      whereClause.workshopId = workshopIdFilter;
    }

    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'pending') {
        whereClause.status = {
          in: [InscriptionStatus.PENDING, InscriptionStatus.PENDING_EXTRAORDINARY],
        };
      } else if (statusFilter === 'waitlist') {
        whereClause.status = InscriptionStatus.WAITLIST;
      } else {
        whereClause.status = statusFilter.toUpperCase() as InscriptionStatus;
      }
    }

    const skip = (page - 1) * pageSize;

    // When searching, fetch more results and filter in memory for accent-insensitive search
    const fetchLimit = search ? 1000 : pageSize;
    const effectiveSkip = search ? 0 : skip;

    const inscriptions = await prisma.inscription.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, identifier: true } },
        workshop: {
          select: {
            id: true,
            name: true,
            capacity: true,
            autoApprove: true,
            allowWaitlist: true,
            responsibleUsers: { select: { id: true } },
          },
        },
      },
      orderBy: {
        createdAt: 'asc', // Orden cronológico para lista de espera
      },
      skip: effectiveSkip,
      take: fetchLimit,
    });

    // Filter in memory for accent-insensitive search
    let filteredInscriptions = inscriptions;
    if (search) {
      filteredInscriptions = inscriptions.filter(inscription => {
        const searchableText = [
          inscription.user.firstName || '',
          inscription.user.lastName || '',
          inscription.user.email || '',
          inscription.user.identifier || '',
          inscription.workshop.name || '',
        ].join(' ');
        return matchesSearchTokens(searchableText, search);
      });
    }

    const totalInscriptions = search ? filteredInscriptions.length : await prisma.inscription.count({ where: whereClause });

    const format = searchParams.get('format');
    if (format === 'csv') {
      const csvRows = [];
      csvRows.push('"Nombre del Usuario","Matrícula","Email","Taller","Estatus de Inscripción","Asistencia","Hora de Asistencia","Fecha de Registro"');

      for (const inscription of filteredInscriptions) {
        const userName = `${inscription.user.firstName} ${inscription.user.lastName}`;
        const userIdentifier = inscription.user.identifier || 'N/A';
        const userEmail = inscription.user.email || 'N/A';
        const workshopName = inscription.workshop.name;
        const inscriptionStatus = inscription.status;
        const attended = inscription.checkedIn ? 'ASISTIÓ' : 'NO ASISTIÓ';
        const attendedAt = inscription.checkedInAt ? new Date(inscription.checkedInAt).toLocaleString('es-MX') : '-';
        const registeredAt = inscription.createdAt ? new Date(inscription.createdAt).toLocaleString('es-MX') : '-';

        csvRows.push(
          `"${userName.replace(/"/g, '""')}",` +
          `"${userIdentifier.replace(/"/g, '""')}",` +
          `"${userEmail.replace(/"/g, '""')}",` +
          `"${workshopName.replace(/"/g, '""')}",` +
          `"${inscriptionStatus.replace(/"/g, '""')}",` +
          `"${attended}",` +
          `"${attendedAt}",` +
          `"${registeredAt}"`
        );
      }

      const csv = '\uFEFF' + csvRows.join('\r\n');
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="inscripciones_talleres.csv"',
        },
      });
    }


    return NextResponse.json({ inscriptions: filteredInscriptions, totalInscriptions }, { status: 200 });
  } catch (error) {
    console.error('Error al obtener las inscripciones:', error);
    return NextResponse.json({ error: 'No se pudieron obtener las inscripciones.' }, { status: 500 });
  }
}