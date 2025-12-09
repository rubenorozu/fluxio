import { NextResponse } from 'next/server';
import { detectTenant } from '@/lib/tenant/detection';
import { getTenantPrisma } from '@/lib/tenant/prisma';
import { writeFile } from 'fs/promises';
import path from 'path';
import * as fs from 'fs/promises';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

interface UserPayload {
  userId: string;
  role: string;
  iat: number;
  exp: number;
}

export async function GET() {
  const tenant = await detectTenant();
  if (!tenant) {
    return NextResponse.json({ error: 'Unauthorized Tenant' }, { status: 401 });
  }
  const prisma = getTenantPrisma(tenant.id);

  const cookieStore = cookies();
  const tokenCookie = cookieStore.get('session');

  if (!tokenCookie) {
    return NextResponse.json({ message: 'No autenticado.' }, { status: 401 });
  }

  let userId: string;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify<UserPayload>(tokenCookie.value, secret);
    userId = payload.userId;
  } catch (err) {
    return NextResponse.json({ message: 'La sesión no es válida.' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        identifier: true, // Incluir el identificador
        phoneNumber: true,
        alternativeEmail: true,
        profileImageUrl: true,
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'Usuario no encontrado.' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error al obtener el perfil:', error);
    return NextResponse.json({ message: 'Algo salió mal al obtener el perfil.' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const tenant = await detectTenant();
  if (!tenant) {
    return NextResponse.json({ error: 'Unauthorized Tenant' }, { status: 401 });
  }
  const prisma = getTenantPrisma(tenant.id);
  const cookieStore = cookies();
  const tokenCookie = cookieStore.get('session');

  if (!tokenCookie) {
    return NextResponse.json({ message: 'No autenticado.' }, { status: 401 });
  }

  let userId: string;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify<UserPayload>(tokenCookie.value, secret);
    userId = payload.userId;
  } catch (err) {
    return NextResponse.json({ message: 'La sesión no es válida.' }, { status: 401 });
  }

  try {
    const formData = await req.formData();

    // SECURITY FIX: Whitelist explícita de campos permitidos
    const allowedFields = ['firstName', 'lastName', 'phoneNumber', 'alternativeEmail', 'profileImage'];

    // SECURITY FIX: Validar que no se envíen campos no permitidos
    for (const key of formData.keys()) {
      if (!allowedFields.includes(key)) {
        console.warn('[SECURITY] Attempted mass assignment', {
          userId,
          field: key,
          timestamp: new Date().toISOString()
        });
        return NextResponse.json({
          error: `Campo no permitido: ${key}. Solo se permiten: ${allowedFields.join(', ')}`
        }, { status: 400 });
      }
    }

    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const alternativeEmail = formData.get('alternativeEmail') as string;
    const profileImage = formData.get('profileImage') as File | null;

    let profileImageUrl: string | undefined;

    if (profileImage) {
      const bytes = await profileImage.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-${profileImage.name || 'profile.jpeg'}`;
      const uploadDir = path.join(process.cwd(), 'public/uploads/profile');
      // Ensure the directory exists
      await fs.mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, filename);
      await writeFile(filePath, buffer);
      profileImageUrl = `/uploads/profile/${filename}`;
    }

    // SECURITY FIX: Solo actualizar campos explícitamente permitidos
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        phoneNumber,
        alternativeEmail,
        profileImageUrl: profileImageUrl || undefined,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        alternativeEmail: true,
        profileImageUrl: true,
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error al actualizar el perfil:', error);
    return NextResponse.json({ message: 'Algo salió mal al actualizar el perfil.' }, { status: 500 });
  }
}
