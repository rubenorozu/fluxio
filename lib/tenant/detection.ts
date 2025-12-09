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
        console.log('[detectTenant] All Headers:', Array.from(headersList.keys()));

        const configSelect = {
            topLogoUrl: true,
            topLogoHeight: true, // Added field
            bottomLogoUrl: true,
            faviconUrl: true,
            primaryColor: true, // Added field
            secondaryColor: true, // Added field
            tertiaryColor: true,
            inscriptionDefaultColor: true, // Inscription colors
            inscriptionPendingColor: true, // Inscription colors
            inscriptionApprovedColor: true, // Inscription colors
            pdfTopLogoUrl: true,
            pdfBottomLogoUrl: true,
            siteName: true,
            contactEmail: true,
            allowedDomains: true,
            privacyPolicy: true,
            howItWorks: true,
            carouselResourceLimit: true, // Carousel configuration
        };

        // 1. Intentar desde header (útil para APIs)
        const headerSlug = headersList.get('x-tenant-slug');
        if (headerSlug) {
            console.log(`[detectTenant] Found x-tenant-slug header: ${headerSlug}`);
            const tenant = await prisma.tenant.findUnique({
                where: { slug: headerSlug, isActive: true },
                select: {
                    id: true,
                    slug: true,
                    name: true,
                    config: {
                        select: configSelect
                    }
                },
            });
            if (tenant) {
                console.log(`[detectTenant] Resolved tenant from header: ${tenant.slug} (${tenant.id})`);
                return tenant;
            }
        }

        // 2. Intentar desde subdomain
        let host = headersList.get('x-forwarded-host') || headersList.get('host') || '';
        if (host.includes(',')) {
            host = host.split(',')[0].trim();
        }

        const subdomain = getSubdomain(host);
        console.log(`[detectTenant] Host: ${host}, Subdomain: ${subdomain}`);

        if (subdomain && subdomain !== 'www') {
            const tenant = await prisma.tenant.findUnique({
                where: { slug: subdomain, isActive: true },
                select: {
                    id: true,
                    slug: true,
                    name: true,
                    config: configSelect
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
                select: {
                    id: true,
                    slug: true,
                    name: true,
                    config: configSelect
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
            return null;
        }

        // 4. Fallback: Buscar tenant 'platform' (para superadmin)
        let defaultTenant = await prisma.tenant.findUnique({
            where: { slug: 'platform', isActive: true },
            select: {
                id: true,
                slug: true,
                name: true,
                config: configSelect
            },
        });

        // Si no existe 'platform', buscar 'default'
        if (!defaultTenant) {
            defaultTenant = await prisma.tenant.findUnique({
                where: { slug: 'default', isActive: true },
                select: {
                    id: true,
                    slug: true,
                    name: true,
                    config: configSelect
                },
            });
        }

        // Si no existe 'default', tomar el primer tenant activo (útil para dev/demo)
        if (!defaultTenant) {
            console.log('Platform and default tenant not found, looking for any active tenant...');
            defaultTenant = await prisma.tenant.findFirst({
                where: { isActive: true },
                select: {
                    id: true,
                    slug: true,
                    name: true,
                    config: configSelect
                },
            });
        }

        if (!defaultTenant) {
            console.error('CRITICAL: No active tenants found in database.');
        } else {
            console.log('Tenant detected (fallback):', defaultTenant.slug);
        }

        return defaultTenant;
    } catch (error) {
        console.error('Error detecting tenant:', error);
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
