import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🔐 Creating superuser...');

    // Get the tenant
    const tenant = await prisma.tenant.findFirst({
        where: { slug: 'ceproa' }
    });

    if (!tenant) {
        throw new Error('Tenant not found');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('L@mambanegra1', 10);

    // Create or update superuser
    const user = await prisma.user.upsert({
        where: {
            identifier_tenantId: {
                identifier: 'ruben.oroz',
                tenantId: tenant.id
            }
        },
        update: {
            email: 'ruben.oroz@univa.mx',
            password: hashedPassword,
            role: 'SUPERUSER',
            isVerified: true,
        },
        create: {
            identifier: 'ruben.oroz',
            displayId: 'RUBEN001',
            email: 'ruben.oroz@univa.mx',
            firstName: 'Rubén',
            lastName: 'Orozco',
            password: hashedPassword,
            role: 'SUPERUSER',
            tenantId: tenant.id,
            isVerified: true,
        },
    });

    console.log('✅ Superuser created successfully!');
    console.log('📧 Email:', user.email);
    console.log('🔑 Identifier:', user.identifier);
    console.log('👤 Role:', user.role);
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
