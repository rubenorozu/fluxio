
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const targetTenantId = "cminddy2m00000ek3q9v1fxlz"; // The one with "Fluxio"

    const updated = await prisma.tenantConfig.update({
        where: { tenantId: targetTenantId },
        data: { siteName: "Fluxio RSV" }
    });

    console.log('Updated config:', updated);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
