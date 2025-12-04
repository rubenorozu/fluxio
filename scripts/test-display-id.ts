import { PrismaClient } from '@prisma/client';
import { generateDisplayId } from '../lib/displayId';

const prisma = new PrismaClient();

async function main() {
    const tenantId = 'cminddy2m00000ek3q9v1fxlz'; // Default tenant ID from logs
    // Find a user to test with
    const user = await prisma.user.findFirst({ where: { tenantId } });

    if (!user) {
        console.log('No user found for tenant');
        return;
    }

    console.log('Testing generateDisplayId for user:', user.email);

    await prisma.$transaction(async (tx) => {
        const id = await generateDisplayId(tx, user.id, tenantId);
        console.log('Generated ID:', id);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
