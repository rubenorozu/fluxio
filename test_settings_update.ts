
import { getTenantPrisma } from './lib/tenant/prisma.ts';
import { prisma } from './lib/prisma.ts';

async function main() {
    console.log('Testing Settings Update...');

    // Get default tenant
    const tenant = await prisma.tenant.findUnique({ where: { slug: 'default' } });
    if (!tenant) {
        console.error('Default tenant not found');
        return;
    }

    const tenantPrisma = getTenantPrisma(tenant.id);

    try {
        const result = await tenantPrisma.tenantConfig.upsert({
            where: { tenantId: tenant.id },
            update: {
                tertiaryColor: '#FF0000' // Try to update with a test color
            },
            create: {
                tenantId: tenant.id,
                tertiaryColor: '#FF0000'
            }
        });
        console.log('Update successful:', result);

        // Revert
        await tenantPrisma.tenantConfig.update({
            where: { tenantId: tenant.id },
            data: { tertiaryColor: '#F28C00' }
        });
        console.log('Reverted changes.');

    } catch (error) {
        console.error('Update failed:', error);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
