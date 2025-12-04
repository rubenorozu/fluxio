
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Testing Settings Update (Simple)...');

    // Get default tenant
    const tenant = await prisma.tenant.findUnique({ where: { slug: 'default' } });
    if (!tenant) {
        console.error('Default tenant not found');
        return;
    }

    try {
        const result = await prisma.tenantConfig.upsert({
            where: { tenantId: tenant.id },
            update: {
                tertiaryColor: '#FF0000'
            },
            create: {
                tenantId: tenant.id,
                tertiaryColor: '#FF0000'
            }
        });
        console.log('Update successful:', result);

        // Revert
        await prisma.tenantConfig.update({
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
