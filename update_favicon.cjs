const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const tenantSlug = 'unidelcerro'; // Adjust if needed
    const faviconUrl = 'https://klwcioosfcwo8318.public.blob.vercel-storage.com/1764627298586-FaviconFluxioRSV.svg';

    const tenant = await prisma.tenant.findUnique({
        where: { slug: tenantSlug }
    });

    if (!tenant) {
        console.log(`Tenant ${tenantSlug} not found`);
        return;
    }

    console.log(`Updating favicon for tenant: ${tenant.name} (${tenant.id})`);

    const updated = await prisma.tenantConfig.upsert({
        where: { tenantId: tenant.id },
        update: { faviconUrl },
        create: {
            tenantId: tenant.id,
            faviconUrl
        }
    });

    console.log('Updated config:', updated);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
