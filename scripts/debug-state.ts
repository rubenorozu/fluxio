import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const tenantId = 'cminfcndj00000elt9c2q01xd'; // unidelcerro

    console.log('--- Workshops in unidelcerro ---');
    const workshops = await prisma.workshop.findMany({
        where: { tenantId },
        include: { images: true }
    });

    workshops.forEach(w => {
        console.log(`- ${w.name} (ID: ${w.id})`);
        console.log(`  Images: ${w.images.length}`);
        console.log(`  Inscriptions Open: ${w.inscriptionsOpen}`);
    });

    console.log('\n--- Users in unidelcerro ---');
    const users = await prisma.user.findMany({
        where: { tenantId }
    });

    users.forEach(u => {
        console.log(`- ${u.email} (Role: ${u.role})`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
