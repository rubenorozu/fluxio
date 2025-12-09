import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateLogos() {
    try {
        console.log('🔄 Actualizando logos de todos los tenants...');

        // Actualizar todos los tenants con los nuevos logos
        const result = await prisma.tenantConfig.updateMany({
            data: {
                topLogoUrl: '/assets/FluxioRSV.svg',
                bottomLogoUrl: '/assets/FluxioRSV_TX.svg',
            }
        });

        console.log(`✅ ${result.count} configuraciones de tenant actualizadas`);

        // Mostrar todos los tenants actualizados
        const tenants = await prisma.tenant.findMany({
            include: {
                config: {
                    select: {
                        siteName: true,
                        topLogoUrl: true,
                        bottomLogoUrl: true,
                    }
                }
            }
        });

        console.log('\n📋 Tenants actualizados:');
        tenants.forEach(tenant => {
            console.log(`  - ${tenant.name} (${tenant.slug})`);
            console.log(`    Top Logo: ${tenant.config?.topLogoUrl || 'N/A'}`);
            console.log(`    Bottom Logo: ${tenant.config?.bottomLogoUrl || 'N/A'}`);
        });

        console.log('\n🎉 Actualización completada!');

    } catch (error) {
        console.error('❌ Error actualizando logos:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

updateLogos();
