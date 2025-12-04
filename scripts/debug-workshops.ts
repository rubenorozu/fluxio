import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- All Workshops ---');
    const workshops = await prisma.workshop.findMany({
        include: { tenant: true }
    });

    workshops.forEach(w => {
        console.log(`[${w.tenant?.slug || 'NO_TENANT'}] ${w.name} (ID: ${w.id})`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
