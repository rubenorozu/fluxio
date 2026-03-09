
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Testing Prisma Select...');

    const configSelect = {
        select: {
            topLogoUrl: true,
            topLogoHeight: true,
            bottomLogoUrl: true,
            faviconUrl: true,
            primaryColor: true,
            secondaryColor: true,
            tertiaryColor: true, // This is the new field
            siteName: true,
            contactEmail: true,
            allowedDomains: true,
            privacyPolicy: true,
            howItWorks: true
        }
    };

    try {
        const tenant = await prisma.tenant.findUnique({
            where: { slug: 'default', isActive: true },
            select: {
                id: true,
                slug: true,
                name: true,
                config: configSelect
            },
        });
        console.log('Query successful:', tenant);
    } catch (error) {
        console.error('Query failed:', error);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
