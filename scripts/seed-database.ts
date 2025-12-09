import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
    try {
        console.log('🌱 Iniciando seed de la base de datos...');

        // 1. Crear tenant platform
        console.log('📦 Creando tenant platform...');
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
        console.log('✅ Tenant platform creado:', platformTenant.id);

        // 2. Crear configuración del tenant platform
        console.log('⚙️ Creando configuración del tenant...');
        const platformConfig = await prisma.tenantConfig.upsert({
            where: { tenantId: platformTenant.id },
            update: {},
            create: {
                tenantId: platformTenant.id,
                siteName: 'Fluxio RSV',
                topLogoUrl: '/assets/FluxioRSV.svg',
                topLogoHeight: 50,
                bottomLogoUrl: '/assets/FluxioRSV_bco.svg',
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
        console.log('✅ Configuración creada');

        // 3. Crear usuario SUPERUSER
        console.log('👤 Creando usuario SUPERUSER...');
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
        console.log('✅ SUPERUSER creado:', superuser.email);

        console.log('\n🎉 Seed completado exitosamente!');
        console.log('\n📝 Credenciales de acceso:');
        console.log('   Email: admin@platform.com');
        console.log('   Password: admin123');
        console.log('   Rol: SUPERUSER');

    } catch (error) {
        console.error('❌ Error en seed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seed();
