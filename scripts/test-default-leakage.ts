import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const defaultTenantId = 'cminddy2m00000ek3q9v1fxlz';
    const secondaryTenantId = 'cminfcndj00000elt9c2q01xd'; // unidelcerro

    console.log(`--- Testing Fetch for Default Tenant: ${defaultTenantId} ---`);

    // Simulate what getTenantPrisma does: filter by tenantId
    const workshops = await prisma.workshop.findMany({
        where: {
            tenantId: defaultTenantId
        },
        select: {
            id: true,
            name: true,
            tenantId: true
        }
    });

    console.log(`Found ${workshops.length} workshops for Default Tenant:`);
    workshops.forEach(w => {
        console.log(`- [${w.tenantId}] ${w.name} (ID: ${w.id})`);
    });

    // Check if any belong to unidelcerro (should be impossible with the where clause, but let's verify DB state)
    const leaking = workshops.some(w => w.tenantId === secondaryTenantId);

    if (leaking) {
        console.error('❌ LEAKAGE DETECTED: Default tenant sees unidelcerro workshops!');
    } else {
        console.log('✅ NO LEAKAGE at DB Level: Default tenant only sees its own workshops.');
    }

    // Double check: Does the unidelcerro workshop exist?
    const udcWorkshop = await prisma.workshop.findFirst({
        where: { tenantId: secondaryTenantId }
    });
    if (udcWorkshop) {
        console.log(`Confirmed 'unidelcerro' workshop exists in DB: ${udcWorkshop.name} (${udcWorkshop.id})`);
    } else {
        console.log("Strange: 'unidelcerro' workshop not found in DB at all.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
