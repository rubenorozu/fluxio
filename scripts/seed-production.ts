import { config } from 'dotenv';
config({ path: '.env.production.local' });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
    try {
        console.log('🌱 Seeding PRODUCTION database...');

        // 1. Crear tenant platform
        console.log('📦 Creating platform tenant...');
        const platformTenant = await prisma.tenant.upsert({
            where: { slug: 'platform' },
            update: {},
            create: {
                name: 'Platform',
                slug: 'platform',
                isActive: true,
                plan: 'ENTERPRISE',
                maxUsers: 999999,
                maxResources: 999999,
                maxStorage: 999999
            }
        });
        console.log('✅ Platform tenant created:', platformTenant.id);

        // 2. Crear configuración del tenant platform
        console.log('⚙️ Creating tenant config...');
        const platformConfig = await prisma.tenantConfig.upsert({
            where: { tenantId: platformTenant.id },
            update: {},
            create: {
                tenantId: platformTenant.id,
                siteName: 'Fluxio RSV',
                topLogoUrl: '/assets/FluxioRSV.svg',
                topLogoHeight: 50,
                bottomLogoUrl: '/assets/FluxioRSV_TX.svg',
                faviconUrl: '/assets/FaviconFluxioRSV.svg',
                primaryColor: '#0076A8',
                secondaryColor: '#1F2937',
                tertiaryColor: '#ff9500',
                carouselResourceLimit: 15,
                reservationFormConfig: {
                    fields: [
                        {
                            id: 'subject',
                            label: 'Materia',
                            type: 'text',
                            enabled: true,
                            required: true,
                            order: 1,
                            placeholder: 'Ingrese la materia'
                        },
                        {
                            id: 'teacher',
                            label: 'Maestro que solicita',
                            type: 'text',
                            enabled: true,
                            required: true,
                            order: 2,
                            placeholder: 'Nombre del maestro'
                        },
                        {
                            id: 'coordinator',
                            label: 'Coordinador que autoriza',
                            type: 'text',
                            enabled: true,
                            required: true,
                            order: 3,
                            placeholder: 'Nombre del coordinador'
                        },
                        {
                            id: 'justification',
                            label: 'Justificación del Proyecto',
                            type: 'textarea',
                            enabled: true,
                            required: true,
                            order: 4,
                            rows: 4,
                            placeholder: 'Describa la justificación del proyecto'
                        }
                    ]
                }
            }
        });
        console.log('✅ Config created');

        // 3. Crear usuario SUPERUSER
        console.log('👤 Creating SUPERUSER...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const superuser = await prisma.user.upsert({
            where: {
                email_tenantId: {
                    email: 'admin@platform.com',
                    tenantId: platformTenant.id
                }
            },
            update: {},
            create: {
                email: 'admin@platform.com',
                firstName: 'Super',
                lastName: 'Admin',
                password: hashedPassword,
                identifier: 'ADMIN001',
                role: 'SUPERUSER',
                isVerified: true,
                tenantId: platformTenant.id
            }
        });
        console.log('✅ SUPERUSER created:', superuser.email);

        console.log('\n🎉 PRODUCTION seed completed!');
        console.log('\n📝 Login credentials:');
        console.log('   Email: admin@platform.com');
        console.log('   Password: admin123');
        console.log('   Role: SUPERUSER');

    } catch (error) {
        console.error('❌ Error seeding:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seed();
