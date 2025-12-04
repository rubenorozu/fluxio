
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking Tenants...');
    const tenants = await prisma.tenant.findMany({
        include: {
            config: true
        }
    });

    if (tenants.length === 0) {
        console.log('No tenants found!');
    } else {
        console.log(`Found ${tenants.length} tenants:`);
        tenants.forEach(t => {
            console.log(`- ID: ${t.id}, Name: ${t.name}, Slug: ${t.slug}, Active: ${t.isActive}`);
            if (t.config) {
                console.log(`  Config: Primary: ${t.config.primaryColor}, Tertiary: ${t.config.tertiaryColor}`);
            } else {
                console.log('  No Config found');
            }
        });
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
