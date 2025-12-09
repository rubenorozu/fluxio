import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { firstName, lastName, identifier, email, password, phoneNumber, tenantId } = await req.json();
    console.log(`[Register API] Received registration request for TenantID: ${tenantId}, Email: ${email}`);

    if (!firstName || !lastName || !identifier || !email || !password) {
      return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
    }

    if (!tenantId) {
      return NextResponse.json({ message: 'No se pudo detectar la organización.' }, { status: 400 });
    }

    // Normalizar email a minúsculas para consistencia en la base de datos
    const normalizedEmail = email.toLowerCase().trim();

    // Password complexity validation
    if (password.length < 8) {
      return NextResponse.json({ message: 'La contraseña debe tener al menos 8 caracteres.' }, { status: 400 });
    }
    if (!/[A-Z]/.test(password)) {
      return NextResponse.json({ message: 'La contraseña debe contener al menos una letra mayúscula.' }, { status: 400 });
    }
    if (!/[a-z]/.test(password)) {
      return NextResponse.json({ message: 'La contraseña debe contener al menos una letra minúscula.' }, { status: 400 });
    }
    if (!/[0-9]/.test(password)) {
      return NextResponse.json({ message: 'La contraseña debe contener al menos un número.' }, { status: 400 });
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return NextResponse.json({ message: 'La contraseña debe contener al menos un carácter especial.' }, { status: 400 });
    }

    // Validar dominio de email solo si el tenant tiene allowedDomains configurado
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        config: {
          select: {
            allowedDomains: true
          }
        }
      },
    });

    if (tenant?.config?.allowedDomains && tenant.config.allowedDomains.trim() !== '') {
      const allowedDomains = tenant.config.allowedDomains.split(',').map(d => d.trim().toLowerCase());
      const emailDomain = normalizedEmail.split('@')[1];

      if (!emailDomain || !allowedDomains.includes(emailDomain)) {
        return NextResponse.json({
          message: `El dominio del correo electrónico no está permitido. Dominios permitidos: ${allowedDomains.join(', ')}`
        }, { status: 400 });
      }
    }

    // Validar que email sea único POR TENANT
    const existingUser = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        tenantId
      },
    });

    if (existingUser) {
      return NextResponse.json({ message: 'User with that email already exists' }, { status: 409 });
    }

    // Validar que identifier sea único POR TENANT
    const existingIdentifier = await prisma.user.findFirst({
      where: {
        identifier,
        tenantId
      },
    });

    if (existingIdentifier) {
      return NextResponse.json({ message: 'User with that identifier already exists' }, { status: 409 });
    }

    const hashedPassword = await hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await prisma.user.create({
      data: {
        displayId: `USR_${identifier}`,
        firstName,
        lastName,
        identifier,
        email: normalizedEmail,
        password: hashedPassword,
        phoneNumber,
        verificationToken,
        tenantId, // Asignar tenant al usuario
      },
    });

    // In a real app, you would send an email with the verification link
    const verificationLink = `http://localhost:3000/verify-email?token=${verificationToken}`;


    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: 'Something went wrong', error: error.message }, { status: 500 });
  }
}