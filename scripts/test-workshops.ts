import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const tenantId = 'cminddy2m00000ek3q9v1fxlz'; // Default tenant

    console.log('--- Testing Workshops ---');

    // 1. Create a workshop
    console.log('Creating workshop...');
    const workshop = await prisma.workshop.create({
        data: {
            name: 'Taller de Prueba Multi-Tenant',
            description: 'Taller creado via script para verificar aislamiento',
            tenantId: tenantId,
            capacity: 10,
            inscriptionsOpen: true,
            startDate: new Date(),
            endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
        }
    });
    console.log(`Workshop created: ${workshop.name} (ID: ${workshop.id})`);

    // 2. Find a user
    const user = await prisma.user.findFirst({ where: { tenantId } });
    if (!user) {
        console.log('No user found to enroll');
        return;
    }

    // 3. Enroll user (Inscription)
    console.log(`Enrolling user ${user.email}...`);
    const inscription = await prisma.inscription.create({
        data: {
            workshopId: workshop.id,
            userId: user.id,
            tenantId: tenantId,
            status: 'APPROVED'
        }
    });
    console.log(`Inscription created: ID ${inscription.id}`);

    // 4. Verify isolation (check if it appears in list for this tenant)
    const count = await prisma.workshop.count({
        where: { tenantId }
    });
    console.log(`Total workshops for tenant ${tenantId}: ${count}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
