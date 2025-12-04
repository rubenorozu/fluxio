import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        // Obtener configuración del tenant platform
        const platformTenant = await prisma.tenant.findUnique({
            where: { slug: 'platform' },
            select: {
                config: {
                    select: {
                        landingContactEmail: true,
                        landingDemoTrialDays: true,
                        landingFormFields: true,
                        landingAutoResponse: true,
                        landingAutoResponseMessage: true
                    }
                }
            }
        });

        if (!platformTenant?.config) {
            return NextResponse.json({
                contactEmail: 'contacto@fluxiorsv.com',
                demoTrialDays: 7,
                formFields: {
                    requirePhone: true,
                    requireCompany: true,
                    requirePosition: false,
                    requireSize: true,
                    requireMessage: false
                },
                autoResponse: true,
                autoResponseMessage: 'Gracias por tu interés en Fluxio RSV.'
            });
        }

        return NextResponse.json({
            contactEmail: platformTenant.config.landingContactEmail || 'contacto@fluxiorsv.com',
            demoTrialDays: platformTenant.config.landingDemoTrialDays || 7,
            formFields: platformTenant.config.landingFormFields || {},
            autoResponse: platformTenant.config.landingAutoResponse ?? true,
            autoResponseMessage: platformTenant.config.landingAutoResponseMessage || ''
        });

    } catch (error) {
        console.error('Error fetching landing config:', error);
        return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { contactEmail, demoTrialDays, formFields, autoResponse, autoResponseMessage } = body;

        // Actualizar configuración del tenant platform
        const platformTenant = await prisma.tenant.findUnique({
            where: { slug: 'platform' },
            select: { id: true, configId: true }
        });

        if (!platformTenant) {
            return NextResponse.json({ error: 'Tenant platform no encontrado' }, { status: 404 });
        }

        await prisma.tenantConfig.update({
            where: { id: platformTenant.configId },
            data: {
                landingContactEmail: contactEmail,
                landingDemoTrialDays: demoTrialDays,
                landingFormFields: formFields,
                landingAutoResponse: autoResponse,
                landingAutoResponseMessage: autoResponseMessage
            }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error saving landing config:', error);
        return NextResponse.json({ error: 'Error al guardar configuración' }, { status: 500 });
    }
}
