import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession();

    if (!session || session.user.role !== Role.SUPERUSER) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { id: tenantId } = params;
        const users = await prisma.user.findMany({
            where: { tenantId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error('Error fetching tenant users:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession();

    if (!session || session.user.role !== Role.SUPERUSER) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const { id: tenantId } = params;
        const { firstName, lastName, email, password, role } = await req.json();

        if (!email || !password || !firstName || !lastName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // SECURITY FIX: Validar que el rol es válido
        const validRoles = [Role.USER, Role.ADMIN_RESOURCE, Role.ADMIN_RESERVATION, Role.VIGILANCIA, Role.CALENDAR_VIEWER];
        if (role && !validRoles.includes(role)) {
            console.warn('[SECURITY] Attempted to create user with invalid role', {
                tenantId,
                attemptedRole: role,
                timestamp: new Date().toISOString()
            });
            return NextResponse.json({
                error: `Rol inválido. Roles permitidos: ${validRoles.join(', ')}`
            }, { status: 400 });
        }

        // SECURITY FIX: Prevenir creación de SUPERUSER
        if (role === Role.SUPERUSER) {
            console.warn('[SECURITY] Attempted to create SUPERUSER', {
                tenantId,
                timestamp: new Date().toISOString()
            });
            return NextResponse.json({
                error: 'No se puede crear un SUPERUSER desde este endpoint'
            }, { status: 403 });
        }

        const existingUser = await prisma.user.findFirst({
            where: { email, tenantId },
        });

        if (existingUser) {
            return NextResponse.json({ error: 'User already exists in this tenant' }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const identifier = email.split('@')[0];
        const newUser = await prisma.user.create({
            data: {
                email,
                firstName,
                lastName,
                password: hashedPassword,
                role: role || Role.USER,
                tenantId,
                identifier,
                displayId: `USR_${identifier}`, // Enforce naming convention
                isVerified: false,  // SECURITY FIX: Requiere verificación
            },
        });

        return NextResponse.json(newUser, { status: 201 });
    } catch (error) {
        console.error('Error creating tenant user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
