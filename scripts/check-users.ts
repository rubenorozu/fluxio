import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking ALL users in database:');

    const users = await prisma.user.findMany({
        include: {
            tenant: {
                select: { name: true, slug: true }
            }
        }
    });

    console.log('Users found:', JSON.stringify(users, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
