import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Creating platform tenant and moving superuser...');

    // Create platform tenant
    const platformTenant = await prisma.tenant.upsert({
        where: { slug: 'platform' },
        update: {},
        create: {
            slug: 'platform',
            name: 'Platform Admin',
            isActive: true,
        },
    });

    console.log('✅ Platform tenant created:', platformTenant.slug);

    // Create platform tenant config
    await prisma.tenantConfig.upsert({
        where: { tenantId: platformTenant.id },
        update: {
            siteName: 'Fluxio Platform',
            primaryColor: '#145775',
        },
        create: {
            tenantId: platformTenant.id,
            siteName: 'Fluxio Platform',
            primaryColor: '#145775',
            secondaryColor: '#1F2937',
            tertiaryColor: '#F28C00',
        },
    });

    console.log('✅ Platform config created');

    // Hash password
    const hashedPassword = await bcrypt.hash('L@mambanegra1', 10);

    // Create platform superuser
    const platformUser = await prisma.user.upsert({
        where: {
            identifier_tenantId: {
                identifier: 'ruben.oroz',
                tenantId: platformTenant.id
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
            displayId: 'PLATFORM001',
            email: 'ruben.oroz@univa.mx',
            firstName: 'Rubén',
            lastName: 'Orozco',
            password: hashedPassword,
            role: 'SUPERUSER',
            tenantId: platformTenant.id,
            isVerified: true,
        },
    });

    console.log('✅ Platform superuser created');
    console.log('');
    console.log('📋 IMPORTANTE:');
    console.log('   Para acceder a la gestión de organizaciones:');
    console.log('   URL: http://platform.localhost:3000');
    console.log('   Usuario: ruben.oroz');
    console.log('   Password: L@mambanegra1');
    console.log('');
    console.log('   Desde ahí podrás gestionar todas las organizaciones (ceproa, etc.)');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
