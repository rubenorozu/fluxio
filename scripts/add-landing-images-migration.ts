import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

config({ path: '.env.local' });

const prisma = new PrismaClient();

async function main() {
    console.log('Adding landing page image fields to TenantConfig...');

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

    console.log('✅ Migration completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Migration failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
