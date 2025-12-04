import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'ceproa' },
    update: {},
    create: {
      slug: 'ceproa',
      name: 'CEPROA',
      isActive: true,
    },
  });

  console.log('✅ Tenant created:', tenant.slug);

  // Create tenant config with logo and colors
  await prisma.tenantConfig.upsert({
    where: { tenantId: tenant.id },
    update: {
      topLogoUrl: '/assets/Fluxio RSV.svg',
      topLogoHeight: 50,
      primaryColor: '#145775',
      secondaryColor: '#1F2937',
      tertiaryColor: '#F28C00',
      inscriptionPendingColor: '#17A2B8',
      inscriptionApprovedColor: '#28A745',
      siteName: 'CEPROA',
    },
    create: {
      tenantId: tenant.id,
      topLogoUrl: '/assets/Fluxio RSV.svg',
      topLogoHeight: 50,
      primaryColor: '#145775',
      secondaryColor: '#1F2937',
      tertiaryColor: '#F28C00',
      inscriptionPendingColor: '#17A2B8',
      inscriptionApprovedColor: '#28A745',
      siteName: 'CEPROA',
    },
  });

  console.log('✅ Tenant config created with logo and colors');

  // Create superuser
  const hashedPassword = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: {
      identifier_tenantId: {
        identifier: 'admin',
        tenantId: tenant.id
      }
    },
    update: {},
    create: {
      identifier: 'admin',
      displayId: 'ADMIN001',
      email: 'admin@ceproa.com',
      firstName: 'Administrador',
      lastName: 'Sistema',
      password: hashedPassword,
      role: 'SUPERUSER',
      tenantId: tenant.id,
      isVerified: true,
    },
  });

  console.log('✅ Superuser created (admin / admin123)');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });