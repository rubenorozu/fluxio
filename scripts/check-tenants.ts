import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const tenants = await prisma.tenant.findMany();
        console.log('Total tenants:', tenants.length);
        console.log('Tenants:', JSON.stringify(tenants, null, 2));
    } catch (error) {
        console.error('Error fetching tenants:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
