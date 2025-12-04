
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Updating default tenant configuration...');

    const defaultTenantSlug = 'default';

    try {
        const tenant = await prisma.tenant.findUnique({
            where: { slug: defaultTenantSlug }
        });

        if (!tenant) {
            console.log(`Tenant '${defaultTenantSlug}' not found. Skipping.`);
            return;
        }

        await prisma.tenantConfig.upsert({
            where: { tenantId: tenant.id },
            update: {
                topLogoUrl: '/assets/defaults/top_logo.svg',
                bottomLogoUrl: '/assets/defaults/bottom_logo.svg',
                faviconUrl: '/assets/defaults/favicon.svg',
                topLogoHeight: 50
            },
            create: {
                tenantId: tenant.id,
                siteName: 'Tu CEPROA',
                topLogoUrl: '/assets/defaults/top_logo.svg',
                bottomLogoUrl: '/assets/defaults/bottom_logo.svg',
                faviconUrl: '/assets/defaults/favicon.svg',
                topLogoHeight: 50
            }
        });

        console.log('Default tenant configuration updated successfully.');
    } catch (error) {
        console.error('Error updating default tenant:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
