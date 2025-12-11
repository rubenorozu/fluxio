import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyDNS, isValidDomain, normalizeDomain } from '@/lib/dns-verifier';
import { domainCache } from '@/lib/domain-cache';

// GET - Obtener configuración actual de custom domain
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const tenant = await prisma.tenant.findUnique({
            where: { id: session.user.tenantId },
            select: {
                customDomain: true,
                domainStatus: true,
                domainVerifiedAt: true,
                sslEnabled: true,
                plan: true,
                slug: true,
            },
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });
        }

        return NextResponse.json({
            ...tenant,
            dnsInstructions: tenant.customDomain
                ? {
                    type: 'CNAME',
                    name: '@',
                    value: `${tenant.slug}.fluxiorsv.com`,
                    alternativeType: 'A',
                    alternativeValue: 'Vercel IP (se asigna automáticamente)',
                }
                : null,
        });
    } catch (error: any) {
        console.error('[Custom Domain API] GET Error:', error);
        return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500 });
    }
}

// POST - Guardar custom domain
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { customDomain: rawDomain } = await request.json();

        if (!rawDomain) {
            return NextResponse.json({ error: 'Dominio requerido' }, { status: 400 });
        }

        // Normalizar dominio
        const customDomain = normalizeDomain(rawDomain);

        // 1. Verificar que el tenant tenga plan adecuado
        const tenant = await prisma.tenant.findUnique({
            where: { id: session.user.tenantId },
            select: { plan: true, slug: true, id: true },
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });
        }

        if (!['PROFESSIONAL', 'ENTERPRISE'].includes(tenant.plan)) {
            return NextResponse.json(
                {
                    error: 'Esta funcionalidad requiere plan PROFESSIONAL o ENTERPRISE',
                    requiredPlans: ['PROFESSIONAL', 'ENTERPRISE'],
                    currentPlan: tenant.plan,
                },
                { status: 403 }
            );
        }

        // 2. Validar formato de dominio
        if (!isValidDomain(customDomain)) {
            return NextResponse.json(
                {
                    error: 'Formato de dominio inválido',
                    details:
                        'El dominio debe ser válido (ej: universidad.com). No incluyas http://, https:// ni www.',
                },
                { status: 400 }
            );
        }

        // 3. Verificar que el dominio no esté en uso por otro tenant
        const existingDomain = await prisma.tenant.findFirst({
            where: {
                customDomain,
                id: { not: session.user.tenantId },
            },
        });

        if (existingDomain) {
            return NextResponse.json(
                { error: 'Este dominio ya está en uso por otra organización' },
                { status: 409 }
            );
        }

        // 4. Guardar dominio como PENDING_DNS
        await prisma.tenant.update({
            where: { id: session.user.tenantId },
            data: {
                customDomain,
                domainStatus: 'PENDING_DNS',
                domainVerifiedAt: null,
                sslEnabled: false,
            },
        });

        // Invalidar caché
        domainCache.invalidate(customDomain);

        // 5. Notificar al administrador y al tenant
        try {
            // Obtener información completa del tenant
            const tenantInfo = await prisma.tenant.findUnique({
                where: { id: session.user.tenantId },
                select: {
                    name: true,
                    slug: true,
                    config: {
                        select: {
                            contactEmail: true,
                        }
                    }
                },
            });

            // Importar funciones de email
            const { notifyAdminNewCustomDomain } = await import('@/lib/email');

            // Enviar email al admin
            await notifyAdminNewCustomDomain({
                tenantName: tenantInfo?.name || 'Unknown',
                tenantSlug: tenantInfo?.slug || tenant.slug,
                customDomain,
                tenantEmail: tenantInfo?.config?.contactEmail || undefined,
            });

            console.log('[Custom Domain] Admin notification sent');

            // Crear notificación en el sistema para usuarios admin del tenant platform
            try {
                const platformTenant = await prisma.tenant.findFirst({
                    where: { slug: 'platform', isActive: true },
                    select: { id: true }
                });

                if (platformTenant) {
                    const adminUsers = await prisma.user.findMany({
                        where: {
                            tenantId: platformTenant.id,
                            role: 'SUPERUSER'
                        },
                        select: { id: true }
                    });

                    // Crear notificación para cada admin
                    const notificationMessage = `🌐 NUEVO CUSTOM DOMAIN

Tenant: ${tenantInfo?.name} (${tenantInfo?.slug})
Dominio: ${customDomain}

📋 ACCIÓN REQUERIDA:
1. Ve a Vercel Dashboard
2. Settings → Domains → Add Domain
3. Agrega: ${customDomain}
4. Espera 5-30 min para SSL

El tenant ya configuró el CNAME apuntando a cname.vercel-dns.com`;

                    await Promise.all(
                        adminUsers.map(admin =>
                            prisma.notification.create({
                                data: {
                                    recipientId: admin.id,
                                    message: notificationMessage,
                                    read: false,
                                }
                            })
                        )
                    );

                    console.log(`[Custom Domain] Created ${adminUsers.length} in-app notifications`);
                }
            } catch (notifError) {
                console.error('[Custom Domain] Failed to create in-app notifications:', notifError);
            }
        } catch (error) {
            console.error('[Custom Domain] Failed to send notification:', error);
            // No fallar si el email falla
        }

        return NextResponse.json({
            success: true,
            message: 'Dominio guardado. El administrador de Fluxio ha sido notificado para configurar SSL.',
            dnsInstructions: {
                type: 'CNAME',
                name: '@',
                value: `${tenant.slug}.fluxiorsv.com`,
                steps: [
                    '1. Ve a tu proveedor de dominios (GoDaddy, Namecheap, Cloudflare, etc.)',
                    '2. Busca la sección de DNS o Gestión de DNS',
                    `3. Agrega un registro CNAME con nombre "@" o "${customDomain}" apuntando a "${tenant.slug}.fluxiorsv.com"`,
                    '4. Guarda los cambios',
                    '5. Espera 10-30 minutos para propagación DNS',
                    '6. El administrador de Fluxio configurará SSL en Vercel',
                    '7. Recibirás una notificación cuando esté listo para verificar',
                ],
            },
        });
    } catch (error: any) {
        console.error('[Custom Domain API] POST Error:', error);
        return NextResponse.json({ error: 'Error al guardar dominio' }, { status: 500 });
    }
}

// PUT - Verificar DNS
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const tenant = await prisma.tenant.findUnique({
            where: { id: session.user.tenantId },
            select: { customDomain: true, slug: true, id: true, domainStatus: true },
        });

        if (!tenant?.customDomain) {
            return NextResponse.json({ error: 'No hay dominio configurado' }, { status: 400 });
        }

        // Verificar DNS
        const expectedTarget = `${tenant.slug}.fluxiorsv.com`;
        const dnsValid = await verifyDNS(tenant.customDomain, expectedTarget);

        if (dnsValid) {
            // DNS verificado, actualizar estado
            await prisma.tenant.update({
                where: { id: session.user.tenantId },
                data: {
                    domainStatus: 'ACTIVE', // En Vercel, SSL es automático
                    domainVerifiedAt: new Date(),
                    sslEnabled: true, // Vercel maneja SSL automáticamente
                },
            });

            // Actualizar caché
            domainCache.set(tenant.customDomain, tenant.slug);

            // Enviar notificación al tenant
            try {
                const tenantInfo = await prisma.tenant.findUnique({
                    where: { id: session.user.tenantId },
                    select: {
                        name: true,
                        config: {
                            select: {
                                contactEmail: true,
                            }
                        }
                    },
                });

                if (tenantInfo?.config?.contactEmail) {
                    const { notifyTenantDomainActive } = await import('@/lib/email');
                    await notifyTenantDomainActive({
                        tenantEmail: tenantInfo.config.contactEmail,
                        customDomain: tenant.customDomain,
                        tenantName: tenantInfo.name,
                    });
                    console.log('[Custom Domain] Tenant notification sent');
                }
            } catch (error) {
                console.error('[Custom Domain] Failed to send tenant notification:', error);
            }

            return NextResponse.json({
                success: true,
                message: '¡DNS verificado correctamente! Tu dominio personalizado está activo.',
                nextSteps: [
                    `Ahora puedes acceder a tu plataforma desde ${tenant.customDomain}`,
                    'El certificado SSL se generará automáticamente (puede tardar unos minutos)',
                    'Comparte tu nuevo dominio con tus usuarios',
                ],
            });
        }

        return NextResponse.json({
            success: false,
            message: 'DNS aún no propagado. Por favor espera unos minutos e intenta de nuevo.',
            details: [
                'La propagación DNS puede tardar de 10 minutos a 48 horas',
                'Usualmente es más rápido (10-30 minutos)',
                `Verifica que el CNAME apunte a: ${expectedTarget}`,
                'Puedes usar herramientas como https://dnschecker.org para verificar',
            ],
        });
    } catch (error: any) {
        console.error('[Custom Domain API] PUT Error:', error);
        return NextResponse.json({ error: 'Error al verificar DNS' }, { status: 500 });
    }
}

// DELETE - Eliminar custom domain
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const tenant = await prisma.tenant.findUnique({
            where: { id: session.user.tenantId },
            select: { customDomain: true },
        });

        const oldDomain = tenant?.customDomain;

        await prisma.tenant.update({
            where: { id: session.user.tenantId },
            data: {
                customDomain: null,
                domainStatus: 'NOT_CONFIGURED',
                domainVerifiedAt: null,
                sslEnabled: false,
            },
        });

        // Invalidar caché
        if (oldDomain) {
            domainCache.invalidate(oldDomain);
        }

        return NextResponse.json({
            success: true,
            message: 'Dominio personalizado eliminado correctamente',
        });
    } catch (error: any) {
        console.error('[Custom Domain API] DELETE Error:', error);
        return NextResponse.json({ error: 'Error al eliminar dominio' }, { status: 500 });
    }
}
