import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const defaultTenantId = 'cminddy2m00000ek3q9v1fxlz';

    console.log('Fixing spaces with null tenantId...');

    const result = await prisma.space.updateMany({
        where: { tenantId: null },
        data: { tenantId: defaultTenantId }
    });

    console.log(`Updated ${result.count} spaces to tenant ${defaultTenantId}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
