import { PrismaClient } from '@prisma/client';

const basePrisma = new PrismaClient();

// Inline simplified getTenantPrisma logic
function getTenantPrisma(tenantId: string) {
    return {
        workshop: {
            findMany: (args?: any) =>
                basePrisma.workshop.findMany({
                    ...args,
                    where: { ...args?.where, tenantId },
                }),
        }
    };
}

async function main() {
    const secondaryTenantId = 'cminfcndj00000elt9c2q01xd'; // unidelcerro

    console.log(`--- Testing Fetch for Tenant: ${secondaryTenantId} ---`);

    const prisma = getTenantPrisma(secondaryTenantId);

    console.log('Fetching workshops...');
    const workshops = await prisma.workshop.findMany({
        select: {
            id: true,
            name: true,
            tenantId: true
        }
    });

    console.log(`Found ${workshops.length} workshops:`);
    workshops.forEach((w: any) => {
        console.log(`- [${w.tenantId}] ${w.name} (ID: ${w.id})`);
    });

    const leaking = workshops.some((w: any) => w.tenantId !== secondaryTenantId);
    if (leaking) {
        console.error('❌ LEAKAGE DETECTED: Found workshops from other tenants!');
    } else {
        console.log('✅ NO LEAKAGE: All workshops belong to the correct tenant.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await basePrisma.$disconnect());
