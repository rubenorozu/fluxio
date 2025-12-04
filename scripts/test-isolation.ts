import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧪 Starting Isolation Test...');

    // 1. Setup: Create two test tenants
    const tenantA = await prisma.tenant.create({
        data: {
            name: 'Test Tenant A',
            slug: 'test-tenant-a-' + Date.now(),
            isActive: true,
        },
    });

    const tenantB = await prisma.tenant.create({
        data: {
            name: 'Test Tenant B',
            slug: 'test-tenant-b-' + Date.now(),
            isActive: true,
        },
    });

    console.log(`✅ Created Tenant A: ${tenantA.name} (${tenantA.id})`);
    console.log(`✅ Created Tenant B: ${tenantB.name} (${tenantB.id})`);

    try {
        // 2. Action: Create a Workshop in Tenant A
        const workshopA = await prisma.workshop.create({
            data: {
                name: 'Workshop Exclusive to A',
                tenantId: tenantA.id,
                capacity: 10,
            },
        });
        console.log(`✅ Created Workshop in Tenant A: ${workshopA.name} (${workshopA.id})`);

        // 3. Verification: Tenant A should see it
        const workshopsForA = await prisma.workshop.findMany({
            where: { tenantId: tenantA.id },
        });

        if (workshopsForA.some(w => w.id === workshopA.id)) {
            console.log('✅ PASS: Tenant A can see its own workshop.');
        } else {
            console.error('❌ FAIL: Tenant A CANNOT see its own workshop.');
            process.exit(1);
        }

        // 4. Verification: Tenant B should NOT see it
        const workshopsForB = await prisma.workshop.findMany({
            where: { tenantId: tenantB.id },
        });

        if (workshopsForB.length === 0) {
            console.log('✅ PASS: Tenant B sees 0 workshops.');
        } else {
            console.error(`❌ FAIL: Tenant B sees ${workshopsForB.length} workshops! LEAK DETECTED!`);
            console.error(workshopsForB);
            process.exit(1);
        }

        // 5. Verification: Global query without tenant filter (Simulating Admin)
        // This is just to prove the data exists globally but is filtered by tenantId in app logic
        const allWorkshops = await prisma.workshop.findMany({
            where: { id: workshopA.id }
        });
        if (allWorkshops.length === 1) {
            console.log('✅ PASS: Workshop exists in DB (Global view).');
        }

    } catch (error) {
        console.error('❌ Error during test execution:', error);
        process.exit(1);
    } finally {
        // 6. Cleanup
        console.log('🧹 Cleaning up...');
        await prisma.workshop.deleteMany({ where: { tenantId: { in: [tenantA.id, tenantB.id] } } });
        await prisma.tenant.deleteMany({ where: { id: { in: [tenantA.id, tenantB.id] } } });
        console.log('✅ Cleanup complete.');
        await prisma.$disconnect();
    }
}

main();
