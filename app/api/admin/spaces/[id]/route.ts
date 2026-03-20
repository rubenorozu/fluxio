
import { Role } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma'; // Import singleton Prisma client

// GET: Obtener un espacio por ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();

  if (!session || (session.user.role !== Role.SUPERUSER && session.user.role !== Role.ADMIN_RESOURCE)) {
    return NextResponse.json({ error: 'Acceso denegado. Se requieren privilegios de Superusuario o Administrador de Recursos.' }, { status: 403 });
  }

  const spaceId = params.id;

  try {
    const space = await prisma.space.findUnique({
      where: { id: spaceId },
      include: {
        images: true,
        location: true,
        responsibleUsers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        requirements: {
          select: {
            id: true,
            name: true,
          },
        },
      }
    });

    if (!space) {
      return NextResponse.json({ error: 'Espacio no encontrado.' }, { status: 404 });
    }

    if (session.user.role === Role.ADMIN_RESOURCE && !space.responsibleUsers.some(u => u.id === session.user.id)) {
      return NextResponse.json({ error: 'Acceso denegado. No eres responsable de este espacio.' }, { status: 403 });
    }

    return NextResponse.json(space, { status: 200 });
  } catch (error) {
    console.error('Error al obtener el espacio:', error);
    return NextResponse.json({ error: 'No se pudo obtener el espacio.' }, { status: 500 });
  }
}

// PUT: Actualizar un espacio por ID
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();

  if (!session || (session.user.role !== Role.SUPERUSER && session.user.role !== Role.ADMIN_RESOURCE)) {
    return NextResponse.json({ error: 'Acceso denegado. Se requieren privilegios de Superusuario o Administrador de Recursos.' }, { status: 403 });
  }

  const spaceId = params.id;

  try {
    const existingSpace = await prisma.space.findUnique({
      where: { id: spaceId },
      include: { responsibleUsers: true }
    });

    if (!existingSpace) {
      return NextResponse.json({ error: 'Espacio no encontrado.' }, { status: 404 });
    }

    if (session.user.role === Role.ADMIN_RESOURCE && !existingSpace.responsibleUsers.some(u => u.id === session.user.id)) {
      return NextResponse.json({ error: 'Acceso denegado. No eres responsable de este espacio.' }, { status: 403 });
    }

    const { name, description, images, responsibleUserIds, requirementIds, reservationLeadTime, maxReservationDuration, requiresSpaceReservationWithEquipment, regulationsUrl, locationId } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'El nombre del espacio es obligatorio.' }, { status: 400 });
    }

    const updatedSpace = await prisma.space.update({
      where: { id: spaceId },
      data: {
        name,
        description,
        responsibleUsers: {
          set: (responsibleUserIds || []).map((id: string) => ({ id }))
        },
        reservationLeadTime: reservationLeadTime || null,
        maxReservationDuration: maxReservationDuration || null,
        requiresSpaceReservationWithEquipment: requiresSpaceReservationWithEquipment ?? false,
        regulationsUrl: regulationsUrl || null,
        locationId: locationId || null,
        images: {
          deleteMany: {},
          create: (images || []).map((img: { url: string }) => ({ url: img.url })),
        },
        requirements: {
          set: (requirementIds || []).map((id: string) => ({ id }))
        }
      },
      include: { images: true, requirements: true, responsibleUsers: true, location: true },
    });

    return NextResponse.json(updatedSpace, { status: 200 });
  } catch (error) {
    console.error('Error al actualizar el espacio:', error);
    return NextResponse.json({ error: 'No se pudo actualizar el espacio.' }, { status: 500 });
  }
}

// DELETE: Eliminar un espacio por ID
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();

  if (!session || (session.user.role !== Role.SUPERUSER && session.user.role !== Role.ADMIN_RESOURCE)) {
    return NextResponse.json({ error: 'Acceso denegado. Se requieren privilegios de Superusuario o Administrador de Recursos.' }, { status: 403 });
  }

  const spaceId = params.id;

  try {
    const existingSpace = await prisma.space.findUnique({
      where: { id: spaceId },
      include: { responsibleUsers: true }
    });

    if (!existingSpace) {
      return NextResponse.json({ error: 'Espacio no encontrado.' }, { status: 404 });
    }

    if (session.user.role === Role.ADMIN_RESOURCE && !existingSpace.responsibleUsers.some(u => u.id === session.user.id)) {
      return NextResponse.json({ error: 'Acceso denegado. No eres responsable de este espacio.' }, { status: 403 });
    }

    await prisma.space.delete({
      where: { id: spaceId },
    });

    return NextResponse.json({ message: 'Espacio eliminado correctamente.' }, { status: 200 });
  } catch (error) {
    console.error('Error al eliminar el espacio:', error);
    return NextResponse.json({ error: 'No se pudo eliminar el espacio.' }, { status: 500 });
  }
}
