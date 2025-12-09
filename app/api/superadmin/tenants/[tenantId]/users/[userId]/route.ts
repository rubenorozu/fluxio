import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';

/**
 * PATCH /api/superadmin/tenants/[tenantId]/users/[userId]
 * Editar un usuario existente
 */
export async function PATCH(
    req: Request,
    { params }: { params: { tenantId: string; userId: string } }
) {
    try {
        const session = await getServerSession();

        // Verificar que el usuario esté autenticado
        if (!session) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        // Verificar que sea SUPERUSER del tenant 'platform'
        if (session.user.role !== 'SUPERUSER' || session.user.tenantId !== 'platform') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const { tenantId, userId } = params;
        const { firstName, lastName, email, role } = await req.json();

        // Validar campos requeridos
        if (!firstName || !lastName || !email || !role) {
            return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
        }

        // Normalizar email
        const normalizedEmail = email.toLowerCase().trim();

        // Verificar que el usuario a editar existe y pertenece al tenant correcto
        const existingUser = await prisma.user.findFirst({
            where: {
                id: userId,
                tenantId: tenantId,
            },
        });

        if (!existingUser) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        // Si se está cambiando el email, verificar que no exista otro usuario con ese email en el mismo tenant
        if (normalizedEmail !== existingUser.email) {
            const emailExists = await prisma.user.findFirst({
                where: {
                    email: normalizedEmail,
                    tenantId: tenantId,
                    id: { not: userId }, // Excluir el usuario actual
                },
            });

            if (emailExists) {
                return NextResponse.json({ error: 'Ya existe un usuario con ese email en esta organización' }, { status: 409 });
            }
        }

        // Actualizar usuario
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                firstName,
                lastName,
                email: normalizedEmail,
                role,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                tenantId: true,
            },
        });

        return NextResponse.json(updatedUser, { status: 200 });

    } catch (error: any) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Error al actualizar usuario', details: error.message }, { status: 500 });
    }
}

/**
 * DELETE /api/superadmin/tenants/[tenantId]/users/[userId]
 * Eliminar un usuario
 */
export async function DELETE(
    req: Request,
    { params }: { params: { tenantId: string; userId: string } }
) {
    try {
        const session = await getServerSession();

        // Verificar que el usuario esté autenticado
        if (!session) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        // Verificar que sea SUPERUSER del tenant 'platform'
        if (session.user.role !== 'SUPERUSER' || session.user.tenantId !== 'platform') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const { tenantId, userId } = params;

        // Verificar que el usuario existe y pertenece al tenant correcto
        const user = await prisma.user.findFirst({
            where: {
                id: userId,
                tenantId: tenantId,
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        // Prevenir que el superadmin se elimine a sí mismo
        if (userId === session.user.id) {
            return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 });
        }
        // Eliminar usuario
        await prisma.user.delete({
            where: { id: userId },
        });

        return NextResponse.json({ message: 'Usuario eliminado exitosamente' }, { status: 200 });

    } catch (error: any) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: 'Error al eliminar usuario', details: error.message }, { status: 500 });
    }
}
