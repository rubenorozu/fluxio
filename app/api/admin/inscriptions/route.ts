import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { Role, Prisma, InscriptionStatus } from '@prisma/client';
import { normalizeText } from '@/lib/search-utils';

export async function GET(request: Request) {
  const session = await getServerSession();

  if (!session || (session.user.role !== Role.SUPERUSER && session.user.role !== Role.ADMIN_RESERVATION && session.user.role !== Role.ADMIN_RESOURCE)) {
    return NextResponse.json({ error: 'Acceso denegado. Se requieren privilegios de Superusuario o Administrador de Reservas.' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

    const whereClause: Prisma.InscriptionWhereInput = {};

    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'pending') {
        whereClause.status = {
          in: [InscriptionStatus.PENDING, InscriptionStatus.PENDING_EXTRAORDINARY],
        };
      } else {
        whereClause.status = statusFilter.toUpperCase() as InscriptionStatus;
      }
    }

    if (search) {
      whereClause.OR = [
        {
          user: {
            OR: [
              { firstName: { contains: search } },
              { lastName: { contains: search } },
              { email: { contains: search } },
              { identifier: { contains: search } },
            ],
          },
        },
        {
          workshop: {
            name: { contains: search },
          },
        },
      ];
    }

    const skip = (page - 1) * pageSize;

    // When searching, fetch more results and filter in memory for accent-insensitive search
    const fetchLimit = search ? 1000 : pageSize;
    const effectiveSkip = search ? 0 : skip;

    const inscriptions = await prisma.inscription.findMany({
      where: whereClause,
      include: {
        user: { select: { firstName: true, lastName: true, email: true, identifier: true } },
        workshop: {
          select: {
            id: true,
            name: true,
            responsibleUserId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: effectiveSkip,
      take: fetchLimit,
    });

    // Filter in memory for accent-insensitive search
    let filteredInscriptions = inscriptions;
    if (search) {
      const normalizedSearch = normalizeText(search);
      filteredInscriptions = inscriptions.filter(inscription => {
        const searchableText = [
          inscription.user.firstName || '',
          inscription.user.lastName || '',
          inscription.user.email || '',
          inscription.user.identifier || '',
          inscription.workshop.name || '',
        ].join(' ');
        return normalizeText(searchableText).includes(normalizedSearch);
      });
    }

    const totalInscriptions = search ? filteredInscriptions.length : await prisma.inscription.count({ where: whereClause });

    const format = searchParams.get('format');
    if (format === 'csv') {
      const csvRows = [];
      csvRows.push('"Nombre del Usuario","Matrícula","Taller","Estatus de Inscripción"');

      for (const inscription of filteredInscriptions) {
        const userName = `${inscription.user.firstName} ${inscription.user.lastName}`;
        const userIdentifier = inscription.user.identifier || 'N/A';
        const workshopName = inscription.workshop.name;
        const inscriptionStatus = inscription.status;

        csvRows.push(
          `"${userName.replace(/"/g, '""')}",` +
          `"${userIdentifier.replace(/"/g, '""')}",` +
          `"${workshopName.replace(/"/g, '""')}",` +
          `"${inscriptionStatus.replace(/"/g, '""')}"`
        );
      }

      const csv = csvRows.join('\n');
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="inscripciones.csv"',
        },
      });
    }


    return NextResponse.json({ inscriptions: filteredInscriptions, totalInscriptions }, { status: 200 });
  } catch (error) {
    console.error('Error al obtener las inscripciones:', error);
    return NextResponse.json({ error: 'No se pudieron obtener las inscripciones.' }, { status: 500 });
  }
}