import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';
import { isTenantActive } from '@/lib/tenant/validation';

export async function POST(req: Request) {
  try {
    const { email, password, tenantId } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Correo electrónico y contraseña son obligatorios.' }, { status: 400 });
    }

    if (!tenantId) {
      return NextResponse.json({ message: 'No se pudo detectar la organización.' }, { status: 400 });
    }

    // Normalizar email a minúsculas para búsqueda case-insensitive
    const normalizedEmail = email.toLowerCase().trim();

    // Buscar usuario por email Y tenantId
    // Si tenantId es 'default', también buscar usuarios con tenantId null (Global Superusers)
    const whereCondition: any = {
      email: normalizedEmail,
    };

    if (tenantId === 'dev-tenant-id') {
      // In development fallback, look for the user among all tenants or just the first one
      console.log('[Login] [DEV] Using dev-tenant-id fallback for user search');
    } else if (tenantId === 'default' || tenantId === 'platform') {
      whereCondition.tenantId = { in: ['default', 'platform', null] };
    } else {
      whereCondition.tenantId = tenantId;
    }

    const user = await prisma.user.findFirst({
      where: whereCondition,
    });

    // SECURITY FIX: Timing-safe password comparison
    // Siempre ejecutar bcrypt para evitar timing attack
    const passwordToCompare = user?.password || '$2a$10$invalidhashtopreventtimingattack.invalidhashtopreventtimingattack';
    const isPasswordValid = await bcrypt.compare(password, passwordToCompare);

    if (!user || !isPasswordValid) {
      // SECURITY FIX: Logging de intento fallido
      console.warn('[SECURITY] Failed login attempt', {
        email: normalizedEmail,
        tenantId,
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        timestamp: new Date().toISOString(),
        reason: !user ? 'user_not_found' : 'invalid_password'
      });

      return NextResponse.json({ message: 'Credenciales inválidas.' }, { status: 401 });
    }

    // Verificar que el tenant del usuario esté activo
    if (user.tenantId) {
      const tenantActive = await isTenantActive(user.tenantId);
      if (!tenantActive) {
        return NextResponse.json({
          message: 'Esta organización ha sido pausada. Contacta al administrador.'
        }, { status: 403 });
      }
    }

    // SECURITY FIX: Logging de login exitoso
    console.info('[SECURITY] Successful login', {
      userId: user.id,
      email: normalizedEmail,
      tenantId: user.tenantId,
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      timestamp: new Date().toISOString()
    });

    // Create session using the centralized function with tenantId
    // If tenantId is null (global user), use 'platform' or 'default' as fallback for session
    const sessionTenantId = user.tenantId || tenantId || 'default';
    await createSession(user.id, user.role as any, sessionTenantId);

    // Remove password from the user object before sending it back
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({ message: 'Inicio de sesión exitoso', user: userWithoutPassword }, { status: 200 });

  } catch (error: any) {
    console.error('--- LOGIN ERROR ---');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);

    // Check for Prisma connection errors specifically
    if (error.message?.includes('Prisma') || error.code?.startsWith('P')) {
      return NextResponse.json({
        message: 'Error de conexión con la base de datos. Verifica tus credenciales en .env.local',
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({ message: 'Algo salió mal en el servidor.', error: error.message }, { status: 500 });
  }
}
