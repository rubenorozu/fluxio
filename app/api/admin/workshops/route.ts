
import { Role, Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { detectTenant } from '@/lib/tenant/detection';
import { getTenantPrisma } from '@/lib/tenant/prisma';
import { normalizeText } from '@/lib/search-utils';

// Helper function to generate a random alphanumeric string
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// GET: Listar todos los talleres
export async function GET(request: Request) {
  const session = await getServerSession();

  if (!session || (session.user.role !== Role.SUPERUSER && session.user.role !== Role.ADMIN_RESOURCE)) {
    return NextResponse.json({ error: 'Acceso denegado. Se requieren privilegios de Superusuario o Administrador de Recursos.' }, { status: 403 });
  }

  const tenant = await detectTenant();
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }
  const prisma = getTenantPrisma(tenant.id);

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

    const whereClause: Prisma.WorkshopWhereInput = {};

    if (session.user.role === Role.ADMIN_RESOURCE) {
      whereClause.responsibleUserId = session.user.id;
    }

    // When searching, fetch more results and filter in memory for accent-insensitive search
    const fetchLimit = search ? 1000 : pageSize;
    const skip = search ? 0 : (page - 1) * pageSize;

    const workshops = await prisma.workshop.findMany({
      where: whereClause,
      include: {
        images: true,
        responsibleUser: {
          select: {
            firstName: true,
            lastName: true,
          }
        },
        sessions: true, // Incluir las sesiones relacionadas
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: fetchLimit,
    });

    // Filter in memory for accent-insensitive search
    let filteredWorkshops = workshops;
    if (search) {
      const normalizedSearch = normalizeText(search);
      filteredWorkshops = workshops.filter(workshop => {
        const responsibleName = (workshop as any).responsibleUser
          ? `${(workshop as any).responsibleUser.firstName} ${(workshop as any).responsibleUser.lastName}`
          : '';
        const searchableText = [
          workshop.name || '',
          workshop.description || '',
          workshop.teacher || '',
          workshop.displayId || '',
          responsibleName,
        ].join(' ');
        return normalizeText(searchableText).includes(normalizedSearch);
      });
    }

    const totalWorkshops = search ? filteredWorkshops.length : await prisma.workshop.count({ where: whereClause });

    const format = searchParams.get('format');
    if (format === 'csv') {
      const csvRows = [];
      // Headers
      csvRows.push('"ID del taller","Nombre del taller","Responsable","Maestro","Descripción","Fecha de inicio","Fecha de finalización","Sesiones"');

      for (const workshop of filteredWorkshops) { // Use filteredWorkshops for CSV export
        const responsibleName = (workshop as any).responsibleUser ? `${(workshop as any).responsibleUser.firstName} ${(workshop as any).responsibleUser.lastName}` : 'N/A';
        const sessions = workshop.sessions.map(session => {
          const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
          return `${days[session.dayOfWeek]} ${session.timeStart}-${session.timeEnd}${session.room ? ` (${session.room})` : ''}`;
        }).join('; ');

        csvRows.push(
          `"${workshop.displayId || workshop.id}",` +
          `"${workshop.name.replace(/"/g, '""')}",` +
          `"${responsibleName.replace(/"/g, '""')}",` +
          `"${(workshop.teacher || 'N/A').replace(/"/g, '""')}",` +
          `"${(workshop.description || 'N/A').replace(/"/g, '""')}",` +
          `"${workshop.startDate ? new Date(workshop.startDate).toLocaleDateString() : 'N/A'}",` +
          `"${workshop.endDate ? new Date(workshop.endDate).toLocaleDateString() : 'N/A'}",` +
          `"${sessions.replace(/"/g, '""')}"`
        );
      }

      const csv = csvRows.join('\n');
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="talleres.csv"',
        },
      });
    }

    return NextResponse.json({ workshops: filteredWorkshops, totalWorkshops }, { status: 200 });
  } catch (error) {
    console.error('Error al obtener los talleres:', error);
    return NextResponse.json({ error: 'No se pudo obtener la lista de talleres.' }, { status: 500 });
  }
}

// POST: Crear un nuevo taller
export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session || (session.user.role !== Role.SUPERUSER && session.user.role !== Role.ADMIN_RESOURCE)) {
    return NextResponse.json({ error: 'Acceso denegado. Se requieren privilegios de Superusuario o Administrador de Recursos.' }, { status: 403 });
  }

  const tenant = await detectTenant();
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }
  const prisma = getTenantPrisma(tenant.id);

  try {
    const { name, description, capacity, teacher, startDate, endDate, inscriptionsStartDate, responsibleUserId, sessions, images } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'El nombre del taller es obligatorio.' }, { status: 400 });
    }

    let finalResponsibleUserId = responsibleUserId;
    if (session.user.role === Role.ADMIN_RESOURCE) {
      finalResponsibleUserId = session.user.id;
    }

    let displayId: string;
    let isUnique = false;
    do {
      const randomPart = generateRandomString(5);
      displayId = `TA_${randomPart}`;
      const existingWorkshop = await prisma.workshop.findUnique({
        where: { displayId },
      });
      if (!existingWorkshop) {
        isUnique = true;
      }
    } while (!isUnique);

    const parsedInscriptionsStartDate = inscriptionsStartDate ? new Date(inscriptionsStartDate) : null;
    const now = new Date();
    const calculatedInscriptionsOpen = parsedInscriptionsStartDate ? parsedInscriptionsStartDate <= now : true;

    const newWorkshop = await prisma.workshop.create({
      data: {
        displayId,
        name,
        description,
        capacity: capacity || 0,
        teacher,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        inscriptionsStartDate: parsedInscriptionsStartDate,
        inscriptionsOpen: calculatedInscriptionsOpen,
        images: {
          create: images, // Asume que images es un array de { url: string }
        },
        sessions: {
          create: sessions.map((session: { dayOfWeek: number; timeStart: string; timeEnd: string; room?: string }) => ({
            dayOfWeek: session.dayOfWeek,
            timeStart: session.timeStart,
            timeEnd: session.timeEnd,
            room: session.room,
            tenantId: tenant.id // Explicitly set tenantId for sessions if needed, though workshop relation handles it usually. But WorkshopSession might need it if it has tenantId column.
          })),
        },
        responsibleUser: finalResponsibleUserId ? { connect: { id: finalResponsibleUserId } } : undefined,
        // tenantId is automatically added by getTenantPrisma.create
      },
      include: { images: true, sessions: true },
    });

    return NextResponse.json(newWorkshop, { status: 201 });
  } catch (error) {
    console.error('Error al crear el taller:', error);
    return NextResponse.json({ error: 'No se pudo crear el taller.' }, { status: 500 });
  }
}
