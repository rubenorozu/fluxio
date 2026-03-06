
import { Role } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma'; // Import singleton Prisma client

// GET: Obtener un equipo por ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession();

  if (!session || (session.user.role !== Role.SUPERUSER && session.user.role !== Role.ADMIN_RESOURCE)) {
    return NextResponse.json({ error: 'Acceso denegado. Se requieren privilegios de Superusuario o Administrador de Recursos.' }, { status: 403 });
  }

  const equipmentId = params.id;

  try {
    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
      include: {
        images: true,
        responsibleUsers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      },
    });

    if (!equipment) {
      return NextResponse.json({ error: 'Equipo no encontrado.' }, { status: 404 });
    }

    if (session.user.role === Role.ADMIN_RESOURCE && !equipment.responsibleUsers.some(u => u.id === session.user.id)) {
      return NextResponse.json({ error: 'Acceso denegado. No eres responsable de este equipo.' }, { status: 403 });
    }

    return NextResponse.json(equipment, { status: 200 });
  } catch (error) {
    console.error('Error al obtener el equipo:', error);
    return NextResponse.json({ error: 'No se pudo obtener el equipo.' }, { status: 500 });
  }
}

// PUT: Actualizar un equipo por ID
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession();

  if (!session || (session.user.role !== Role.SUPERUSER && session.user.role !== Role.ADMIN_RESOURCE)) {
    return NextResponse.json({ error: 'Acceso denegado. Se requieren privilegios de Superusuario o Administrador de Recursos.' }, { status: 403 });
  }

  const equipmentId = params.id;

  try {
    const existingEquipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
      include: { responsibleUsers: true }
    });

    if (!existingEquipment) {
      return NextResponse.json({ error: 'Equipo no encontrado.' }, { status: 404 });
    }

    if (session.user.role === Role.ADMIN_RESOURCE && !existingEquipment.responsibleUsers.some(u => u.id === session.user.id)) {
      return NextResponse.json({ error: 'Acceso denegado. No eres responsable de este equipo.' }, { status: 403 });
    }

    const { name, description, serialNumber, fixedAssetId, images, responsibleUserIds, spaceId, reservationLeadTime, isFixedToSpace, regulationsUrl } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'El nombre del equipo es obligatorio.' }, { status: 400 });
    }

    const updatedEquipment = await prisma.equipment.update({
      where: { id: equipmentId },
      data: {
        name,
        description,
        serialNumber,
        fixedAssetId,
        responsibleUsers: {
          set: (responsibleUserIds || []).map((id: string) => ({ id }))
        },
        spaceId: spaceId || null,
        reservationLeadTime: reservationLeadTime || null,
        isFixedToSpace: isFixedToSpace ?? false,
        regulationsUrl: regulationsUrl || null,
        images: {
          deleteMany: {},
          create: (images || []).map((img: { url: string }) => ({ url: img.url })),
        },
      },
      include: { images: true, responsibleUsers: true },
    });

    return NextResponse.json(updatedEquipment, { status: 200 });
  } catch (error) {
    console.error('Error al actualizar el equipo:', error);
    return NextResponse.json({ error: 'No se pudo actualizar el equipo.' }, { status: 500 });
  }
}

// DELETE: Eliminar un equipo por ID
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession();

  if (!session || (session.user.role !== Role.SUPERUSER && session.user.role !== Role.ADMIN_RESOURCE)) {
    return NextResponse.json({ error: 'Acceso denegado. Se requieren privilegios de Superusuario o Administrador de Recursos.' }, { status: 403 });
  }

  const equipmentId = params.id;

  try {
    const existingEquipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
      include: { responsibleUsers: true }
    });

    if (!existingEquipment) {
      return NextResponse.json({ error: 'Equipo no encontrado.' }, { status: 404 });
    }

    if (session.user.role === Role.ADMIN_RESOURCE && !existingEquipment.responsibleUsers.some(u => u.id === session.user.id)) {
      return NextResponse.json({ error: 'Acceso denegado. No eres responsable de este equipo.' }, { status: 403 });
    }

    await prisma.equipment.delete({
      where: { id: equipmentId },
    });

    return NextResponse.json({ message: 'Equipo eliminado correctamente.' }, { status: 200 });
  } catch (error) {
    console.error('Error al eliminar el equipo:', error);
    return NextResponse.json({ error: 'No se pudo eliminar el equipo.' }, { status: 500 });
  }
}