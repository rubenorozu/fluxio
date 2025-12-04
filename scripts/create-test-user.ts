import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('👤 Creando usuario de prueba para CEPROA...');

    // Get ceproa tenant
    const tenant = await prisma.tenant.findUnique({
        where: { slug: 'ceproa' }
    });

    if (!tenant) {
        throw new Error('Tenant ceproa not found');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('test123', 10);

    // Create test user
    const user = await prisma.user.upsert({
        where: {
            identifier_tenantId: {
                identifier: 'test.user',
                tenantId: tenant.id
            }
        },
        update: {
            email: 'test.user@ceproa.com',
            password: hashedPassword,
            role: 'USER',
            isVerified: true,
        },
        create: {
            identifier: 'test.user',
            displayId: 'TEST001',
            email: 'test.user@ceproa.com',
            firstName: 'Usuario',
            lastName: 'Prueba',
            password: hashedPassword,
            role: 'USER',
            tenantId: tenant.id,
            isVerified: true,
        },
    });

    console.log('✅ Usuario de prueba creado:');
    console.log('   Email:', user.email);
    console.log('   Identifier:', user.identifier);
    console.log('   Password: test123');
    console.log('');
    console.log('🌐 Accede en: http://ceproa.localhost:3000');
    console.log('   Usuario: test.user');
    console.log('   Password: test123');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
