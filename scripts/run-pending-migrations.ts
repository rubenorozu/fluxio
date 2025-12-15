import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

config({ path: '.env.local' });

const prisma = new PrismaClient();

async function main() {
    console.log('Ejecutando migraciones pendientes...\n');

    try {
        // 1. Agregar pricingPlans si no existe
        console.log('1. Agregando campo pricingPlans...');
        await prisma.$executeRawUnsafe(`
      ALTER TABLE "TenantConfig" 
      ADD COLUMN IF NOT EXISTS "pricingPlans" JSONB;
    `);
        console.log('   ✅ pricingPlans agregado');

        // 2. Agregar campos de landing images
        console.log('\n2. Agregando campos de imágenes de landing...');
        await prisma.$executeRawUnsafe(`
      ALTER TABLE "TenantConfig" 
      ADD COLUMN IF NOT EXISTS "landingHeroImage" TEXT,
      ADD COLUMN IF NOT EXISTS "landingHeroImageA" TEXT,
      ADD COLUMN IF NOT EXISTS "landingHeroImageB" TEXT,
      ADD COLUMN IF NOT EXISTS "landingHeroImageC" TEXT,
      ADD COLUMN IF NOT EXISTS "landingScreenshot1" TEXT,
      ADD COLUMN IF NOT EXISTS "landingScreenshot2" TEXT,
      ADD COLUMN IF NOT EXISTS "landingScreenshot3" TEXT,
      ADD COLUMN IF NOT EXISTS "landingScreenshot4" TEXT;
    `);
        console.log('   ✅ Campos de imágenes agregados');

        // 3. Verificar que todo esté bien
        console.log('\n3. Verificando estado final...');
        const tenant = await prisma.tenant.findFirst({
            where: { slug: 'platform' },
            include: { config: true }
        });

        if (tenant) {
            console.log('   ✅ Tenant platform encontrado');
            console.log('   ✅ Config existe:', !!tenant.config);
        } else {
            console.log('   ❌ No se encontró tenant platform');
        }

        console.log('\n✅ Todas las migraciones completadas exitosamente!');

    } catch (error) {
        console.error('\n❌ Error ejecutando migraciones:', error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error('Error fatal:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
