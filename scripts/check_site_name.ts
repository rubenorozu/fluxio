
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const configs = await prisma.tenantConfig.findMany({
        select: {
            tenantId: true,
            siteName: true,
        }
    });
    console.log('Tenant Configs:', JSON.stringify(configs, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
