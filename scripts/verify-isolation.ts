import { prisma } from '../lib/prisma';
import { getTenantPrisma } from '../lib/prisma-tenant';

async function main() {
    console.log('Starting isolation verification...');

    // 1. Create Test Tenants
    const tenantA = await prisma.tenant.upsert({
        where: { slug: 'test-tenant-a' },
        update: {},
        create: { name: 'Test Tenant A', slug: 'test-tenant-a' },
    });

    const tenantB = await prisma.tenant.upsert({
        where: { slug: 'test-tenant-b' },
        update: {},
        create: { name: 'Test Tenant B', slug: 'test-tenant-b' },
    });

    console.log(`Created tenants: ${tenantA.slug} (${tenantA.id}), ${tenantB.slug} (${tenantB.id})`);

    // 2. Create Space in Tenant A
    const tenantAPrisma = getTenantPrisma(tenantA.id);
    const spaceA = await tenantAPrisma.space.create({
        data: {
            name: 'Space A',
            description: 'Belongs to Tenant A',
        },
    });
    console.log(`Created Space A: ${spaceA.name} (${spaceA.id}) in Tenant A`);

    // 3. Verify Tenant A can see it
    const foundByA = await tenantAPrisma.space.findFirst({
        where: { id: spaceA.id },
    });
    if (foundByA) {
        console.log('✅ Tenant A can see its own space.');
    } else {
        console.error('❌ Tenant A CANNOT see its own space!');
    }

    // 4. Verify Tenant B CANNOT see it
    const tenantBPrisma = getTenantPrisma(tenantB.id);
    const foundByB = await tenantBPrisma.space.findFirst({
        where: { id: spaceA.id },
    });

    if (!foundByB) {
        console.log('✅ Tenant B cannot see Tenant A\'s space (Isolation Working).');
    } else {
        console.error('❌ Tenant B CAN see Tenant A\'s space (Isolation FAILED)!');
        console.error('Leaked Space:', foundByB);
    }

    // 5. Cleanup
    await prisma.space.delete({ where: { id: spaceA.id } });
    await prisma.tenant.delete({ where: { id: tenantA.id } });
    await prisma.tenant.delete({ where: { id: tenantB.id } });
    console.log('Cleanup done.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
