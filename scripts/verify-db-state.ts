import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

config({ path: '.env.local' });

const prisma = new PrismaClient();

async function main() {
    console.log('Verificando estado de la base de datos...');

    try {
        // Verificar que exista el tenant platform
        const platformTenant = await prisma.tenant.findFirst({
            where: { slug: 'platform' },
            include: { config: true }
        });

        if (!platformTenant) {
            console.log('❌ No se encontró el tenant platform');
        } else {
            console.log('✅ Tenant platform encontrado:', platformTenant.name);
            console.log('   Config existe:', !!platformTenant.config);

            if (platformTenant.config) {
                console.log('   Campos de imágenes:');
                console.log('   - landingHeroImage:', platformTenant.config.landingHeroImage || 'null');
                console.log('   - landingHeroImageA:', platformTenant.config.landingHeroImageA || 'null');
            }
        }

        // Contar todos los tenants
        const tenantCount = await prisma.tenant.count();
        console.log(`\nTotal de tenants: ${tenantCount}`);

        // Listar todos los tenants
        const allTenants = await prisma.tenant.findMany({
            select: { id: true, slug: true, name: true, isActive: true }
        });

        console.log('\nTenants en la base de datos:');
        allTenants.forEach(t => {
            console.log(`  - ${t.slug} (${t.name}) - ${t.isActive ? 'Activo' : 'Inactivo'}`);
        });

    } catch (error) {
        console.error('❌ Error al verificar base de datos:', error);
    }
}

main()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
