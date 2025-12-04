import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const secondaryTenantId = 'cminfcndj00000elt9c2q01xd'; // unidelcerro
    const defaultTenantId = 'cminddy2m00000ek3q9v1fxlz'; // default

    console.log('--- Testing Workshops for Secondary Tenant (unidelcerro) ---');

    // 1. Create a workshop in Secondary Tenant
    console.log('Creating workshop in unidelcerro...');
    const workshop = await prisma.workshop.create({
        data: {
            name: 'Taller Exclusivo Uni del Cerro',
            description: 'Este taller solo debe ser visible para unidelcerro',
            tenantId: secondaryTenantId,
            capacity: 15,
            inscriptionsOpen: true,
            startDate: new Date(),
            endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
        }
    });
    console.log(`Workshop created: ${workshop.name} (ID: ${workshop.id})`);

    // 2. Verify it exists for Secondary Tenant
    const countSecondary = await prisma.workshop.count({
        where: { tenantId: secondaryTenantId }
    });
    console.log(`Workshops count for unidelcerro: ${countSecondary}`);

    // 3. Verify it DOES NOT exist for Default Tenant
    const countDefault = await prisma.workshop.count({
        where: {
            tenantId: defaultTenantId,
            name: 'Taller Exclusivo Uni del Cerro'
        }
    });
    console.log(`Workshops count for default tenant (should be 0): ${countDefault}`);

    if (countSecondary > 0 && countDefault === 0) {
        console.log('✅ SUCCESS: Data is correctly isolated.');
    } else {
        console.error('❌ FAILURE: Data isolation failed.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
