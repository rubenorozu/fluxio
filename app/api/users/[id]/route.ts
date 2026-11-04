import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { detectTenant } from '@/lib/tenant/detection';
import { getTenantPrisma } from '@/lib/tenant/prisma';

interface UserPayload {
  userId: string;
  role: string;
  iat: number;
  exp: number;
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const tenant = await detectTenant();
  if (!tenant) {
    return NextResponse.json({ error: 'Unauthorized Tenant' }, { status: 401 });
  }
  const tenantPrisma = getTenantPrisma(tenant.id);

  const cookieStore = cookies();
  const tokenCookie = cookieStore.get('session');

  if (!tokenCookie) {
    return NextResponse.json({ error: 'Acceso denegado. Se requiere autenticación.' }, { status: 401 });
  }

  let userPayload: UserPayload;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify<UserPayload>(tokenCookie.value, secret);
    userPayload = payload;
  } catch (err) {
    return NextResponse.json({ error: 'La sesión no es válida.' }, { status: 401 });
  }

  if (userPayload.role !== Role.SUPERUSER) {
    return NextResponse.json({ error: 'Acceso denegado. Se requieren privilegios de Superusuario.' }, { status: 403 });
  }

  const userIdToDelete = params.id;

  if (userPayload.userId === userIdToDelete) {
    return NextResponse.json({ error: 'Un superusuario no puede eliminarse a sí mismo.' }, { status: 400 });
  }

  // Verify user belongs to this tenant
  const userToDelete = await tenantPrisma.user.findUnique({
    where: { id: userIdToDelete }
  });

  if (!userToDelete) {
    return NextResponse.json({ error: 'Usuario no encontrado en esta organización.' }, { status: 404 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Prisma handles many-to-many cascading automatically for responsibleUsers

      // Delete dependent records
      await tx.notification.deleteMany({
        where: { recipientId: userIdToDelete },
      });
      await tx.inscription.deleteMany({
        where: { userId: userIdToDelete },
      });
      await tx.reservation.deleteMany({
        where: { userId: userIdToDelete },
      });

      // Finally, delete the user
      await tx.user.delete({
        where: { id: userIdToDelete },
      });
    });

    return NextResponse.json({ message: 'Usuario y todos sus registros asociados han sido eliminados correctamente.' }, { status: 200 });

  } catch (error) {
    console.error('Error al eliminar el usuario y sus registros asociados:', error);
    if (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === 'P2003') {
      return NextResponse.json({ error: 'Error de integridad de datos. No se pudieron eliminar todos los registros asociados.' }, { status: 500 });
    }
    return NextResponse.json({ error: 'No se pudo completar la eliminación del usuario.' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const tenant = await detectTenant();
  if (!tenant) {
    return NextResponse.json({ error: 'Unauthorized Tenant' }, { status: 401 });
  }
  const tenantPrisma = getTenantPrisma(tenant.id);

  const cookieStore = cookies();
  const tokenCookie = cookieStore.get('session');

  if (!tokenCookie) {
    return NextResponse.json({ error: 'Acceso denegado. Se requiere autenticación.' }, { status: 401 });
  }

  let userPayload: UserPayload;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify<UserPayload>(tokenCookie.value, secret);
    userPayload = payload;
  } catch (err) {
    return NextResponse.json({ error: 'La sesión no es válida.' }, { status: 401 });
  }

  if (userPayload.role !== Role.SUPERUSER) {
    return NextResponse.json({ error: 'Acceso denegado. Se requieren privilegios de Superusuario.' }, { status: 403 });
  }

  const userIdToUpdate = params.id;

  if (userPayload.userId === userIdToUpdate) {
    return NextResponse.json({ error: 'Un superusuario no puede desactivar su propia cuenta.' }, { status: 400 });
  }

  const userToUpdate = await tenantPrisma.user.findUnique({
    where: { id: userIdToUpdate },
    select: { id: true, isActive: true }
  });

  if (!userToUpdate) {
    return NextResponse.json({ error: 'Usuario no encontrado en esta organización.' }, { status: 404 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const newActiveState = typeof body.isActive === 'boolean' ? body.isActive : !userToUpdate.isActive;

    await prisma.$transaction(async (tx) => {
      // Si se desactiva, asegurar que ningún recurso quede huérfano
      if (!newActiveState) {
        // Buscar un superusuario activo para asignar como responsable de respaldo si fuera necesario
        const fallbackSuperuser = await tx.user.findFirst({
          where: { tenantId: tenant.id, role: Role.SUPERUSER, isActive: true },
          select: { id: true }
        });

        // 1. Espacios
        const managedSpaces = await tx.space.findMany({
          where: { tenantId: tenant.id, responsibleUsers: { some: { id: userIdToUpdate } } },
          include: { responsibleUsers: { select: { id: true } } }
        });

        for (const space of managedSpaces) {
          const remaining = space.responsibleUsers.filter(u => u.id !== userIdToUpdate);
          if (remaining.length === 0 && fallbackSuperuser) {
            await tx.space.update({
              where: { id: space.id },
              data: {
                responsibleUsers: {
                  disconnect: { id: userIdToUpdate },
                  connect: { id: fallbackSuperuser.id }
                }
              }
            });
          } else {
            await tx.space.update({
              where: { id: space.id },
              data: { responsibleUsers: { disconnect: { id: userIdToUpdate } } }
            });
          }
        }

        // 2. Equipos
        const managedEquip = await tx.equipment.findMany({
          where: { tenantId: tenant.id, responsibleUsers: { some: { id: userIdToUpdate } } },
          include: { responsibleUsers: { select: { id: true } } }
        });

        for (const eq of managedEquip) {
          const remaining = eq.responsibleUsers.filter(u => u.id !== userIdToUpdate);
          if (remaining.length === 0 && fallbackSuperuser) {
            await tx.equipment.update({
              where: { id: eq.id },
              data: {
                responsibleUsers: {
                  disconnect: { id: userIdToUpdate },
                  connect: { id: fallbackSuperuser.id }
                }
              }
            });
          } else {
            await tx.equipment.update({
              where: { id: eq.id },
              data: { responsibleUsers: { disconnect: { id: userIdToUpdate } } }
            });
          }
        }
      }

      // Actualizar estado del usuario
      await tx.user.update({
        where: { id: userIdToUpdate },
        data: { isActive: newActiveState }
      });
    });

    return NextResponse.json({
      message: newActiveState ? 'Usuario reactivado correctamente.' : 'Usuario desactivado correctamente. Los recursos a su cargo fueron protegidos.',
      isActive: newActiveState
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error al actualizar estado del usuario:', error);
    return NextResponse.json({ error: 'No se pudo actualizar el estado del usuario.' }, { status: 500 });
  }
}