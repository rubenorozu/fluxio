import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

/**
 * Detecta el tenant actual desde:
 * 1. Header x-tenant-slug (para APIs)
 * 2. Subdomain (ej: tenant1.fluxio.com)
 * 3. Path slug (ej: /t/tenant1)
 * 4. Cookie tenant-slug
 * 5. Default tenant como fallback
 */
export async function detectTenant(): Promise<{
    id: string;
    slug: string;
    name: string;
    config?: {
        topLogoUrl?: string | null;
        topLogoHeight?: number | null;
        bottomLogoUrl?: string | null;
        faviconUrl?: string | null;
        primaryColor?: string | null;
        secondaryColor?: string | null;
        tertiaryColor?: string | null;
        inscriptionDefaultColor?: string | null;
        inscriptionPendingColor?: string | null;
        inscriptionApprovedColor?: string | null;
        siteName?: string | null;
        contactEmail?: string | null;
        allowedDomains?: string | null;
        privacyPolicy?: string | null;
        howItWorks?: string | null;
        carouselResourceLimit?: number | null;
    } | null;
} | null> {
    try {
        const headersList = headers();
        let host = headersList.get('x-forwarded-host') || headersList.get('host') || '';
        if (host.includes(',')) {
            host = host.split(',')[0].trim();
        }

        const subdomain = getSubdomain(host);
        console.log(`[detectTenant] Host: ${host}, Subdomain: ${subdomain}`);

        if (subdomain && subdomain !== 'www') {
            const tenant = await prisma.tenant.findUnique({
                where: { slug: subdomain, isActive: true },
                include: {
                    config: true
                },
            });
            if (tenant) {
                console.log(`[detectTenant] Found by subdomain: ${tenant.slug}`);
                return tenant;
            } else {
                console.log(`[detectTenant] Subdomain '${subdomain}' not found in DB or inactive.`);
            }
        } else {
            // No subdomain detected - use platform tenant as default
            console.log('[detectTenant] No subdomain detected, using platform tenant as default');
            const platformTenant = await prisma.tenant.findUnique({
                where: { slug: 'platform', isActive: true },
                include: {
                    config: true
                }
            });

            if (platformTenant) {
                console.log(`[detectTenant] Using platform tenant: ${platformTenant.slug} (${platformTenant.id})`);
                return {
                    id: platformTenant.id,
                    slug: platformTenant.slug,
                    name: platformTenant.name,
                    config: platformTenant.config
                };
            }

            console.log('[detectTenant] Platform tenant not found, returning null');

            // SECURITY: In development, if no platform tenant found, try to find ANY active tenant as fallback
            if (process.env.NODE_ENV === 'development' || host.includes('localhost')) {
                console.log('[detectTenant] [DEV] Looking for any active tenant as final fallback...');
                const anyTenant = await prisma.tenant.findFirst({
                    where: { isActive: true },
                    include: { config: true }
                });
                if (anyTenant) {
                    console.log(`[detectTenant] [DEV] Using fallback tenant: ${anyTenant.slug}`);
                    return anyTenant;
                }
            }

            return null;
        }

        // 4. Fallback: Buscar tenant 'platform' (para superadmin)
        let defaultTenant = await prisma.tenant.findUnique({
            where: { slug: 'platform', isActive: true },
            include: {
                config: true
            },
        });

        // Si no existe 'platform', buscar 'default'
        if (!defaultTenant) {
            defaultTenant = await prisma.tenant.findUnique({
                where: { slug: 'default', isActive: true },
                include: {
                    config: true
                },
            });
        }

        // Si no existe 'default', tomar el primer tenant activo (útil para dev/demo)
        if (!defaultTenant) {
            console.log('Platform and default tenant not found, looking for any active tenant...');
            defaultTenant = await prisma.tenant.findFirst({
                where: { isActive: true },
                include: {
                    config: true
                },
            });
        }

        if (!defaultTenant) {
            console.error('CRITICAL: No active tenants found in database.');
            // En desarrollo, si la base de datos está vacía o inaccesible, devolvemos un objeto mínimo para evitar errores 400
            if (process.env.NODE_ENV === 'development' || host.includes('localhost')) {
                return {
                    id: 'dev-tenant-id',
                    slug: 'dev',
                    name: 'Development Tenant'
                } as any;
            }
        } else {
            console.log('Tenant detected (fallback):', defaultTenant.slug);
        }

        return defaultTenant;
    } catch (error) {
        console.error('Error detecting tenant:', error);
        // Fallback para errores de conexión en desarrollo
        if (process.env.NODE_ENV === 'development' || (typeof window === 'undefined' && process.env.DATABASE_URL?.includes('localhost'))) {
            return {
                id: 'dev-tenant-id',
                slug: 'dev',
                name: 'Development Tenant'
            } as any;
        }
        return null;
    }
}

/**
 * Extrae el subdomain de un host
 * Ejemplo: tenant1.fluxio.com -> tenant1
 */
function getSubdomain(host: string): string | null {
    // Remover puerto si existe
    const hostname = host.split(':')[0];

    // Dividir por puntos
    const parts = hostname.split('.');

    // Si tiene más de 2 partes (ej: tenant.fluxio.com), el primero es el subdomain
    if (parts.length > 2) {
        return parts[0];
    }

    // Si es localhost con subdomain (ej: tenant.localhost)
    if (parts.length === 2 && parts[1] === 'localhost') {
        return parts[0];
    }

    return null;
}

/**
 * Extrae un valor de cookie del header de cookies
 */
function getCookieValue(cookieHeader: string, name: string): string | null {
    const cookies = cookieHeader.split(';').map(c => c.trim());
    const cookie = cookies.find(c => c.startsWith(`${name}=`));
    return cookie ? cookie.split('=')[1] : null;
}

/**
 * Detecta tenant desde path slug
 * Ejemplo: /t/tenant1/dashboard -> tenant1
 */
export function getTenantSlugFromPath(pathname: string): string | null {
    const match = pathname.match(/^\/t\/([^\/]+)/);
    return match ? match[1] : null;
}

/**
 * Valida que un usuario tenga acceso a un tenant
 */
export async function validateUserTenantAccess(
    userId: string,
    tenantId: string
): Promise<boolean> {
    const user = await prisma.user.findFirst({
        where: {
            id: userId,
            tenantId: tenantId,
        },
    });

    return !!user;
}
