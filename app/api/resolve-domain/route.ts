import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * API Route para resolver custom domains
 * Verifica si un hostname es un custom domain configurado y retorna el tenant slug
 */
export async function GET(request: NextRequest) {
    try {
        const hostname = request.nextUrl.searchParams.get('hostname');

        if (!hostname) {
            return NextResponse.json({ error: 'Hostname requerido' }, { status: 400 });
        }

        // Normalizar hostname (remover puerto, www, etc)
        const normalizedHostname = hostname
            .split(':')[0]
            .replace(/^www\./, '');

        console.log(`[Resolve Domain API] Checking: ${normalizedHostname}`);

        // Buscar tenant con este custom domain
        // NOTA: Temporalmente sin filtrar por domainStatus hasta que Prisma Client se regenere
        const tenant = await prisma.tenant.findFirst({
            where: {
                customDomain: normalizedHostname,
                isActive: true,
            },
            select: {
                slug: true,
                name: true,
            },
        });

        if (tenant) {
            console.log(`[Resolve Domain API] Found: ${normalizedHostname} -> ${tenant.slug}`);
            return NextResponse.json({
                isCustomDomain: true,
                tenantSlug: tenant.slug,
                tenantName: tenant.name,
            });
        }

        // No es un custom domain
        return NextResponse.json({
            isCustomDomain: false,
        });
    } catch (error: any) {
        console.error('[Resolve Domain API] Error:', error);
        return NextResponse.json({ error: 'Error al resolver dominio' }, { status: 500 });
    }
}

// Configurar como Node.js runtime (no Edge)
export const runtime = 'nodejs';
