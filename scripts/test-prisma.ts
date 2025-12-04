import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Testing Prisma Client...');
    try {
        const user = await prisma.user.findFirst({
            where: {
                tenantId: 'cminddy2m00000ek3q9v1fxlz'
            }
        });
        console.log('Success! User query with tenantId worked.');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
