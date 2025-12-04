import { PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const secondaryTenantId = 'cminfcndj00000elt9c2q01xd'; // unidelcerro
    const email = 'admin@unidelcerro.com';
    const password = 'password123';

    console.log(`Creating admin user for tenant: ${secondaryTenantId}`);

    const hashedPassword = await hash(password, 12);

    const user = await prisma.user.upsert({
        where: {
            email_tenantId: {
                email,
                tenantId: secondaryTenantId
            }
        },
        update: {
            role: Role.SUPERUSER,
            password: hashedPassword
        },
        create: {
            email,
            password: hashedPassword,
            firstName: 'Admin',
            lastName: 'UniDelCerro',
            role: Role.SUPERUSER,
            tenantId: secondaryTenantId,
            identifier: 'ADMIN_UDC',
            isVerified: true
        }
    });

    console.log(`✅ Admin user created/updated:`);
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${password}`);
    console.log(`Tenant: ${secondaryTenantId}`);
    console.log(`Role: ${user.role}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
