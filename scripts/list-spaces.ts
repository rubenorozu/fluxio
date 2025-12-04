import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Tenants ---');
    const tenants = await prisma.tenant.findMany();
    tenants.forEach(t => console.log(`[${t.slug}] ${t.name} (ID: ${t.id})`));

    console.log('\n--- All Spaces ---');
    const spaces = await prisma.space.findMany({
        include: { images: true }
    });

    console.log('Total spaces found:', spaces.length);
    spaces.forEach(s => {
        console.log(`- [${s.status}] ${s.name} (ID: ${s.id})`);
        console.log(`  Tenant: ${s.tenantId}`);
        console.log(`  Images: ${s.images.length}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
