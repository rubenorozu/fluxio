import { NextResponse, type NextRequest } from 'next/server';
import { verifyToken } from './lib/auth-core';
import { Role } from './lib/types';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and images manually to avoid 500 errors
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/assets')
  ) {
    return NextResponse.next();
  }

  // Detectar tenant slug (ahora async para soportar custom domains)
  let tenantSlug = await getTenantSlug(request);

  // Para rutas /api/superadmin, siempre usar 'platform' como tenant
  if (pathname.startsWith('/api/superadmin')) {
    tenantSlug = 'platform';
  }

  console.log(`[Middleware] Host: ${request.headers.get('host')}, Detected Slug: ${tenantSlug}`);

  // Extraer tenant de query parameter si existe (para Vercel sin wildcard DNS)
  const tenantParam = request.nextUrl.searchParams.get('tenant');
  const finalTenantSlug = tenantParam || tenantSlug;

  console.log(`[Middleware] Query param tenant: ${tenantParam}, Final slug: ${finalTenantSlug}`);

  // Preparar headers para el request downstream (Server Components)
  const requestHeaders = new Headers(request.headers);
  if (finalTenantSlug) {
    requestHeaders.set('x-tenant-slug', finalTenantSlug);
  }
  // Agregar pathname para que el layout pueda detectar la landing page
  requestHeaders.set('x-pathname', pathname);

  // Crear response pasando los headers modificados
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (finalTenantSlug) {
    // También establecer en response para debug cliente
    response.headers.set('x-tenant-slug', finalTenantSlug);
    response.headers.set('x-pathname', pathname);

    // (Removed) Do not set cookie to avoid sticky tenant behavior
  }

  // Redirigir /superadmin a /admin
  if (pathname === '/superadmin') {
    const token = request.cookies.get('session')?.value;
    const session = token ? await verifyToken(token) : null;

    if (!session) {
      // No hay sesión, redirigir a login con callback a /admin
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', '/admin');
      return NextResponse.redirect(loginUrl);
    }

    // Si hay sesión, redirigir directamente a /admin
    const adminUrl = new URL('/admin', request.url);
    return NextResponse.redirect(adminUrl);
  }
  // Proteger rutas /admin (excluyendo /api/admin)
  else if (pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
    const token = request.cookies.get('session')?.value;
    const session = token ? await verifyToken(token) : null;

    if (!session) {
      // No hay sesión, redirigir a login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verificar que el tenant del usuario esté activo (excepto platform)
    if (session.tenantId && finalTenantSlug !== 'platform') {
      try {
        const checkUrl = new URL('/api/tenant/check-active', request.url);
        checkUrl.searchParams.set('tenantId', session.tenantId);

        const checkResponse = await fetch(checkUrl.toString());
        const { isActive } = await checkResponse.json();

        if (!isActive) {
          // Tenant pausado, cerrar sesión y redirigir
          const response = NextResponse.redirect(new URL('/login?error=tenant_paused', request.url));
          response.cookies.set('session', '', { expires: new Date(0) });
          return response;
        }
      } catch (error) {
        console.error('[Middleware] Error checking tenant status:', error);
        // En caso de error, permitir acceso pero loguear el error
      }
    }

    // Verificar roles para rutas /admin
    const allowedAdminRoles = [Role.SUPERUSER, Role.ADMIN_RESOURCE, Role.ADMIN_RESERVATION, Role.CALENDAR_VIEWER];

    if (!allowedAdminRoles.some(role => role === session.role)) {
      // Rol no autorizado, redirigir a home o mostrar error
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  // Proteger rutas /vigilancia
  else if (pathname.startsWith('/vigilancia')) {
    const token = request.cookies.get('session')?.value;
    const session = token ? await verifyToken(token) : null;

    if (!session) {
      // No hay sesión, redirigir a login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verificar que el tenant del usuario esté activo
    if (session.tenantId) {
      try {
        const checkUrl = new URL('/api/tenant/check-active', request.url);
        checkUrl.searchParams.set('tenantId', session.tenantId);

        const checkResponse = await fetch(checkUrl.toString());
        const { isActive } = await checkResponse.json();

        if (!isActive) {
          // Tenant pausado, cerrar sesión y redirigir
          const response = NextResponse.redirect(new URL('/login?error=tenant_paused', request.url));
          response.cookies.set('session', '', { expires: new Date(0) });
          return response;
        }
      } catch (error) {
        console.error('[Middleware] Error checking tenant status:', error);
        // En caso de error, permitir acceso pero loguear el error
      }
    }

    // Verificar roles para rutas /vigilancia
    const allowedVigilanciaRoles = [Role.SUPERUSER, Role.VIGILANCIA];
    if (!allowedVigilanciaRoles.some(role => role === session.role)) {
      // Rol no autorizado, redirigir a home
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Check if tenant trial has expired (for non-superusers)
  if (tenantSlug && tenantSlug !== 'platform') {
    const token = request.cookies.get('session')?.value;
    const session = token ? await verifyToken(token) : null;

    if (session && session.role !== Role.SUPERUSER) {
      try {
        // Import prisma here to avoid circular dependencies
        const { prisma } = await import('./lib/prisma');
        const tenant = await prisma.tenant.findUnique({
          where: { slug: tenantSlug },
          select: { plan: true, trialExpiresAt: true, isActive: true }
        });

        if (tenant && tenant.plan === 'TRIAL' && tenant.trialExpiresAt) {
          const now = new Date();
          const expiresAt = new Date(tenant.trialExpiresAt);

          if (now > expiresAt) {
            // Trial has expired, redirect to trial-expired page
            if (!pathname.startsWith('/trial-expired') && !pathname.startsWith('/api')) {
              const expiredUrl = new URL('/trial-expired', request.url);
              return NextResponse.redirect(expiredUrl);
            }
          }
        }

        if (tenant && !tenant.isActive && finalTenantSlug !== 'platform') {
          // Tenant is paused/inactive (pero no el tenant platform de superadmin)
          if (!pathname.startsWith('/tenant-paused') && !pathname.startsWith('/api')) {
            const pausedUrl = new URL('/tenant-paused', request.url);
            return NextResponse.redirect(pausedUrl);
          }
        }
      } catch (error) {
        console.error('[Middleware] Error checking trial status:', error);
      }
    }
  }

  return response;
}

/**
 * Detecta el slug del tenant desde custom domain, headers, subdomain o cookies
 * Prioriza custom domains para mejor UX
 */
async function getTenantSlug(request: NextRequest): Promise<string | null> {
  const host = request.headers.get('host') || '';

  // 1. Intentar desde header (para requests internos)
  const headerSlug = request.headers.get('x-tenant-slug');
  if (headerSlug) return headerSlug;

  // 2. Verificar si es un custom domain (con caché)
  const customDomainSlug = await checkCustomDomain(host);
  if (customDomainSlug) {
    return customDomainSlug;
  }

  // 3. Intentar desde subdomain (lógica existente)
  const subdomain = getSubdomain(host);
  if (subdomain && subdomain !== 'www') {
    return subdomain;
  }

  // 4. Fallback a tenant por defecto
  return 'default';
}

/**
 * Verifica si un host es un custom domain configurado
 * NOTA: Deshabilitado temporalmente porque Prisma no funciona en Edge Runtime
 * Los custom domains se manejarán a nivel de aplicación
 */
async function checkCustomDomain(host: string): Promise<string | null> {
  // Edge Runtime no soporta Prisma Client
  // Los custom domains se detectarán en la aplicación, no en middleware
  return null;

  /* CÓDIGO ORIGINAL - DESHABILITADO POR EDGE RUNTIME
  try {
    const hostname = host.split(':')[0]; // Remover puerto si existe

    // Importar caché dinámicamente
    const { domainCache } = await import('./lib/domain-cache');

    // 1. Verificar caché primero
    const cachedSlug = domainCache.get(hostname);
    if (cachedSlug) {
      console.log(`[Middleware] Custom domain cache HIT: ${hostname} -> ${cachedSlug}`);
      return cachedSlug;
    }

    // 2. Si no está en caché, consultar base de datos
    const { prisma } = await import('./lib/prisma');
    const tenant = await prisma.tenant.findFirst({
      where: {
        customDomain: hostname,
        domainStatus: 'ACTIVE',
        isActive: true,
      },
      select: { slug: true },
    });

    if (tenant) {
      // Guardar en caché para futuras requests
      domainCache.set(hostname, tenant.slug);
      console.log(`[Middleware] Custom domain found: ${hostname} -> ${tenant.slug}`);
      return tenant.slug;
    }

    return null;
  } catch (error) {
    console.error('[Middleware] Error checking custom domain:', error);
    return null;
  }
  */
}


function getSubdomain(host: string): string | null {
  const hostname = host.split(':')[0];
  const parts = hostname.split('.');

  if (parts.length > 2) {
    return parts[0];
  }

  if (parts.length === 2 && parts[1] === 'localhost') {
    return parts[0];
  }

  return null;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/admin).*)',
  ],
};
