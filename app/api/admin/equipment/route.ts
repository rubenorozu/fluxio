
import { Role, Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { detectTenant } from '@/lib/tenant/detection';
import { normalizeText } from '@/lib/search-utils';
import { getTenantPrisma } from '@/lib/tenant/prisma';


// Helper function to generate a random alphanumeric string
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// GET: Listar todos los equipos
export async function GET(request: Request) {
  const session = await getServerSession();


  if (!session) {

    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
  }

  const userRole = session.user.role; // Get role from session, not header


  if (userRole !== Role.SUPERUSER && userRole !== Role.ADMIN_RESOURCE) {

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

    const whereClause: Prisma.EquipmentWhereInput = {};

    if (userRole === Role.ADMIN_RESOURCE) {
      whereClause.responsibleUsers = {
        some: { id: session.user.id }
      };
    }

    // When searching, fetch more results and filter in memory for accent-insensitive search
    const fetchLimit = search ? 1000 : pageSize;
    const skip = search ? 0 : (page - 1) * pageSize;

    const equipment = await prisma.equipment.findMany({
      where: whereClause,
      include: {
        images: true,
        responsibleUsers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: {
        name: 'asc',
      },
      skip,
      take: fetchLimit,
    });

    // Filter in memory for accent-insensitive search
    let filteredEquipment = equipment;
    if (search) {
      const normalizedSearch = normalizeText(search);
      filteredEquipment = equipment.filter(item => {
        const responsibleNames = (item as any).responsibleUsers.map((u: any) => `${u.firstName} ${u.lastName}`).join(', ');
        const searchableText = [
          item.name || '',
          item.description || '',
          item.serialNumber || '',
          item.fixedAssetId || '',
          item.displayId || '',
          responsibleNames,
        ].join(' ');
        return normalizeText(searchableText).includes(normalizedSearch);
      });
    }

    const totalEquipment = search ? filteredEquipment.length : await prisma.equipment.count({ where: whereClause });

    return NextResponse.json({ equipment: filteredEquipment, totalEquipment }, { status: 200 });
  } catch (error) {
    console.error('Error fetching equipment:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}

// POST: Crear un nuevo equipo
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
    const { name, description, serialNumber, fixedAssetId, images, responsibleUserIds, spaceId, reservationLeadTime, maxReservationDuration, isFixedToSpace, regulationsUrl } = await request.json();

    if (!name || name.length < 3 || name.length > 100) {
      return NextResponse.json({ error: 'El nombre del equipo es obligatorio y debe tener entre 3 y 100 caracteres.' }, { status: 400 });
    }

    if (description && description.length > 500) {
      return NextResponse.json({ error: 'La descripción del equipo no puede exceder los 500 caracteres.' }, { status: 400 });
    }

    if (serialNumber && serialNumber.length > 50) {
      return NextResponse.json({ error: 'El número de serie no puede exceder los 50 caracteres.' }, { status: 400 });
    }

    if (fixedAssetId && fixedAssetId.length > 50) {
      return NextResponse.json({ error: 'El ID de activo fijo no puede exceder los 50 caracteres.' }, { status: 400 });
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
      displayId = `EQ_${randomPart}`;
      const existingEquipment = await prisma.equipment.findUnique({
        where: { displayId },
      });
      if (!existingEquipment) {
        isUnique = true;
      }
    } while (!isUnique);

    const newEquipment = await prisma.equipment.create({
      data: {
        displayId,
        name,
        description,
        serialNumber,
        fixedAssetId,
        responsibleUsers: {
          connect: (finalResponsibleUserIds || []).map((id: string) => ({ id }))
        },
        spaceId: spaceId || null, // Guardar el spaceId
        reservationLeadTime: reservationLeadTime || null, // Guardar el tiempo de antelación específico del equipo
        maxReservationDuration: maxReservationDuration || null,
        isFixedToSpace: isFixedToSpace ?? false, // Guardar si el equipo está fijo al espacio
        regulationsUrl: regulationsUrl || null, // Guardar el reglamento en PDF
        images: {
          create: images.map((img: { url: string }) => ({ url: img.url })),
        },
      },
      include: { images: true }, // Incluir las imágenes en la respuesta
    });

    return NextResponse.json(newEquipment, { status: 201 });
  } catch (error) {
    console.error('Error al crear el equipo:', error);
    return NextResponse.json({ error: 'No se pudo crear el equipo.' }, { status: 500 });
  }
}

