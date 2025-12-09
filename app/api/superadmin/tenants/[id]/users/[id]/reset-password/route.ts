import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { hash } from 'bcryptjs';
import crypto from 'crypto';

/**
 * POST /api/superadmin/tenants/[id]/users/[id]/reset-password
 * Generar una nueva contraseña temporal para un usuario
 */
export async function POST(
    req: Request,
    { params }: { params: { id: string } }
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

        // Extraer tenantId de la URL manualmente
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        const tenantId = pathParts[4]; // /api/superadmin/tenants/[tenantId]/users/[userId]/reset-password
        const userId = params.id;

        // Verificar que el usuario existe y pertenece al tenant correcto
        const user = await prisma.user.findFirst({
            where: {
                id: userId,
                tenantId: tenantId,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        // Generar contraseña temporal segura
        // Formato: 3 palabras + 2 números + 1 símbolo (ej: "Temporal2025!")
        const words = ['Temporal', 'Nuevo', 'Acceso'];
        const randomWord = words[Math.floor(Math.random() * words.length)];
        const randomNumbers = Math.floor(Math.random() * 90 + 10); // 10-99
        const symbols = ['!', '@', '#', '$', '%'];
        const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];

        const temporaryPassword = `${randomWord}${randomNumbers}${randomSymbol}`;

        // Hashear la nueva contraseña
        const hashedPassword = await hash(temporaryPassword, 10);

        // Actualizar la contraseña del usuario
        await prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                // Opcional: Agregar un campo para forzar cambio de contraseña en el próximo login
                // forcePasswordChange: true,
            },
        });

        return NextResponse.json({
            message: 'Contraseña reseteada exitosamente',
            temporaryPassword: temporaryPassword,
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
            },
        }, { status: 200 });

    } catch (error: any) {
        console.error('Error resetting password:', error);
        return NextResponse.json({ error: 'Error al resetear contraseña', details: error.message }, { status: 500 });
    }
}
