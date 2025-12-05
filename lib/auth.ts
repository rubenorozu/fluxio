
import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { Role } from './types';

const secretKey = process.env.JWT_SECRET;
if (!secretKey) {
  throw new Error('JWT_SECRET is not set in the environment variables');
}
const key = new TextEncoder().encode(secretKey);

// --- Tipos de Sesión ---
interface SessionPayload {
  userId: string;
  role: Role;
  tenantId: string;
  [propName: string]: any; // Agrega un index signature
}

// --- Funciones de Sesión --- //

/**
 * Encripta el payload de la sesión y lo establece como una cookie HTTPOnly.
 */
export async function createSession(userId: string, role: Role, tenantId: string) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días
  const sessionPayload: SessionPayload = { userId, role, tenantId };

  const token = await new SignJWT(sessionPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);

  // --- CAMBIO CLAVE AQUÍ ---
  const cookieStore = await cookies(); // Obtener el almacén de cookies de forma explícita y AWAIT
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expires,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });
}

/**
 * Obtiene y verifica la sesión del usuario a partir de la cookie.
 * Diseñada para ser usada en API Routes y Server Components.
 * 
 * @param options.validateTenant - Si es true, valida que el usuario pertenece al tenant actual
 * @param options.currentTenantId - ID del tenant actual para validación
 */
export async function getServerSession(options?: {
  validateTenant?: boolean;
  currentTenantId?: string;
}): Promise<{ user: { id: string; role: Role; tenantId: string } } | null> {
  // --- CAMBIO CLAVE AQUÍ ---
  const cookieStore = await cookies(); // Obtener el almacén de cookies de forma explícita y AWAIT
  let token = cookieStore.get('session')?.value;

  if (!token) {
    const { headers } = await import('next/headers');
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
    const sessionData = {
      user: {
        id: payload.userId as string,
        role: payload.role as Role,
        tenantId: payload.tenantId as string,
      },
    };

    // Validar que el usuario pertenece al tenant actual
    if (options?.validateTenant && options?.currentTenantId) {
      if (sessionData.user.tenantId !== options.currentTenantId) {
        console.warn(
          `[Auth] Tenant mismatch: User belongs to tenant ${sessionData.user.tenantId} but trying to access tenant ${options.currentTenantId}`
        );
        // Eliminar sesión inválida
        await deleteSession();
        return null;
      }
    }

    return sessionData;
  } catch (e) {
    console.error('--- GET SERVER SESSION: JWT verification failed ---', e);
    return null;
  }
}

/**
 * Verifica un token JWT manualmente.
 * Útil cuando el token viene en headers o query params en lugar de cookies.
 */
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
    return payload as SessionPayload;
  } catch (e) {
    console.error('--- VERIFY TOKEN: JWT verification failed ---', e);
    return null;
  }
}

/**
 * Elimina la cookie de sesión para cerrar la sesión del usuario.
 */
export async function deleteSession() {
  // --- CAMBIO CLAVE AQUÍ ---
  const cookieStore = await cookies(); // Obtener el almacén de cookies de forma explícita y AWAIT
  cookieStore.set('session', '', { expires: new Date(0) });
}
