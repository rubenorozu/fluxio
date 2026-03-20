
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

// GET: Listar todos los espacios
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

    const whereClause: Prisma.SpaceWhereInput = {};

    if (session.user.role === Role.ADMIN_RESOURCE) {
      whereClause.responsibleUsers = {
        some: { id: session.user.id }
      };
    }

    // When searching, fetch more results and filter in memory for accent-insensitive search
    const fetchLimit = search ? 1000 : pageSize;
    const skip = search ? 0 : (page - 1) * pageSize;

    const spaces = await prisma.space.findMany({
      where: whereClause,
      include: {
        images: true,
        location: true,
        responsibleUsers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        },
        requirements: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: fetchLimit,
    });

    // Filter in memory for accent-insensitive search
    let filteredSpaces = spaces;
    if (search) {
      const normalizedSearch = normalizeText(search);
      filteredSpaces = spaces.filter(space => {
        const responsibleNames = (space as any).responsibleUsers.map((u: any) => `${u.firstName} ${u.lastName}`).join(', ');
        const searchableText = [
          space.name || '',
          space.description || '',
          space.displayId || '',
          responsibleNames,
        ].join(' ');
        return normalizeText(searchableText).includes(normalizedSearch);
      });
    }

    const totalSpaces = search ? filteredSpaces.length : await prisma.space.count({ where: whereClause });

    return NextResponse.json({ spaces: filteredSpaces, totalSpaces }, { status: 200 });
  } catch (error) {
    console.error('Error al obtener los espacios:', JSON.stringify(error, null, 2));
    return NextResponse.json({ error: 'No se pudo obtener la lista de espacios.', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

// POST: Crear un nuevo espacio
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
    const { name, description, responsibleUserIds, images, requirementIds, reservationLeadTime, maxReservationDuration, requiresSpaceReservationWithEquipment, regulationsUrl, locationId } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'El nombre del espacio es obligatorio.' }, { status: 400 });
    }

    let finalResponsibleUserIds = responsibleUserIds || [];
    if (session.user.role === Role.ADMIN_RESOURCE) {
      if (!finalResponsibleUserIds.includes(session.user.id)) {
        finalResponsibleUserIds.push(session.user.id);
      }
    }

    let displayId: string;
    let isUnique = false;
    do {
      const randomPart = generateRandomString(5);
      displayId = `ES_${randomPart}`;
      const existingSpace = await prisma.space.findUnique({
        where: { displayId },
      });
      if (!existingSpace) {
        isUnique = true;
      }
    } while (!isUnique);

    const newSpace = await prisma.space.create({
      data: {
        displayId,
        name,
        description,
        ...(finalResponsibleUserIds.length > 0 && {
          responsibleUsers: {
            connect: finalResponsibleUserIds.map((id: string) => ({ id }))
          }
        }),
        reservationLeadTime: reservationLeadTime || null, // Guardar el tiempo de antelación específico del espacio
        maxReservationDuration: maxReservationDuration || null, // Guardar la duración máxima específica del espacio
        requiresSpaceReservationWithEquipment: requiresSpaceReservationWithEquipment ?? false, // Guardar si el espacio requiere reserva con equipo
        regulationsUrl: regulationsUrl || null, // Guardar el reglamento en PDF
        images: {
          create: images, // Prisma creará las imágenes y las conectará
        },
        ...(requirementIds && requirementIds.length > 0 && {
          requirements: {
            connect: requirementIds.map((id: string) => ({ id }))
          }
        }),
        locationId: locationId || null,
      },
      include: { images: true, requirements: true, location: true },
    });

    return NextResponse.json(newSpace, { status: 201 });
  } catch (error) {
    console.error('Error al crear el espacio:', error);
    return NextResponse.json({ error: 'No se pudo crear el espacio.' }, { status: 500 });
  }
}
