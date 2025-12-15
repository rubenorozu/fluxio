import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@/lib/types';

export async function GET() {
    try {
        const session = await getServerSession();

        if (!session || (session.user.role !== Role.SUPERUSER && session.user.role !== Role.ADMIN_RESOURCE)) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const config = await prisma.tenantConfig.findUnique({
            where: { tenantId: session.user.tenantId },
            select: {
                landingContactEmail: true,
                landingDemoTrialDays: true,
                landingFormFields: true,
                landingAutoResponse: true,
                landingAutoResponseMessage: true,
                landingHeroImage: true,
                landingHeroImageA: true,
                landingHeroImageB: true,
                landingHeroImageC: true,
                landingScreenshot1: true,
                landingScreenshot2: true,
                landingScreenshot3: true,
                landingScreenshot4: true,
            },
        });

        if (!config) {
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
                autoResponseMessage: 'Gracias por tu interés en Fluxio RSV.',
                landingHeroImage: '',
                landingHeroImageA: '',
                landingHeroImageB: '',
                landingHeroImageC: '',
                landingScreenshot1: '',
                landingScreenshot2: '',
                landingScreenshot3: '',
                landingScreenshot4: '',
            });
        }

        return NextResponse.json({
            contactEmail: config.landingContactEmail || 'contacto@fluxiorsv.com',
            demoTrialDays: config.landingDemoTrialDays || 7,
            formFields: config.landingFormFields || {
                requirePhone: true,
                requireCompany: true,
                requirePosition: false,
                requireSize: true,
                requireMessage: false
            },
            autoResponse: config.landingAutoResponse ?? true,
            autoResponseMessage: config.landingAutoResponseMessage || 'Gracias por tu interés en Fluxio RSV.',
            landingHeroImage: config.landingHeroImage || '',
            landingHeroImageA: config.landingHeroImageA || '',
            landingHeroImageB: config.landingHeroImageB || '',
            landingHeroImageC: config.landingHeroImageC || '',
            landingScreenshot1: config.landingScreenshot1 || '',
            landingScreenshot2: config.landingScreenshot2 || '',
            landingScreenshot3: config.landingScreenshot3 || '',
            landingScreenshot4: config.landingScreenshot4 || '',
        });
    } catch (error) {
        console.error('Error fetching landing config:', error);
        return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession();

        if (!session || (session.user.role !== Role.SUPERUSER && session.user.role !== Role.ADMIN_RESOURCE)) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const {
            contactEmail,
            demoTrialDays,
            formFields,
            autoResponse,
            autoResponseMessage,
            landingHeroImage,
            landingHeroImageA,
            landingHeroImageB,
            landingHeroImageC,
            landingScreenshot1,
            landingScreenshot2,
            landingScreenshot3,
            landingScreenshot4,
        } = body;

        await prisma.tenantConfig.upsert({
            where: { tenantId: session.user.tenantId },
            create: {
                tenantId: session.user.tenantId,
                landingContactEmail: contactEmail,
                landingDemoTrialDays: demoTrialDays,
                landingFormFields: formFields,
                landingAutoResponse: autoResponse,
                landingAutoResponseMessage: autoResponseMessage,
                landingHeroImage,
                landingHeroImageA,
                landingHeroImageB,
                landingHeroImageC,
                landingScreenshot1,
                landingScreenshot2,
                landingScreenshot3,
                landingScreenshot4,
            },
            update: {
                landingContactEmail: contactEmail,
                landingDemoTrialDays: demoTrialDays,
                landingFormFields: formFields,
                landingAutoResponse: autoResponse,
                landingAutoResponseMessage: autoResponseMessage,
                landingHeroImage,
                landingHeroImageA,
                landingHeroImageB,
                landingHeroImageC,
                landingScreenshot1,
                landingScreenshot2,
                landingScreenshot3,
                landingScreenshot4,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving landing config:', error);
        return NextResponse.json({ error: 'Error al guardar configuración' }, { status: 500 });
    }
}
