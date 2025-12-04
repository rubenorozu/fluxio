import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando migración a multi-tenant...');

  // 1. Crear tenant por defecto
  const defaultTenant = await prisma.tenant.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      name: 'Organización Principal',
      slug: 'default',
      isActive: true,
    },
  });

  console.log(`✅ Tenant creado: ${defaultTenant.name} (${defaultTenant.slug})`);

  // 2. Asignar todos los usuarios existentes al tenant por defecto
  const usersUpdated = await prisma.user.updateMany({
    where: { tenantId: null },
    data: { tenantId: defaultTenant.id },
  });
  console.log(`✅ ${usersUpdated.count} usuarios asignados al tenant`);

  // 3. Asignar todos los espacios existentes al tenant por defecto
  const spacesUpdated = await prisma.space.updateMany({
    where: { tenantId: null },
    data: { tenantId: defaultTenant.id },
  });
  console.log(`✅ ${spacesUpdated.count} espacios asignados al tenant`);

  // 4. Asignar todos los equipos existentes al tenant por defecto
  const equipmentUpdated = await prisma.equipment.updateMany({
    where: { tenantId: null },
    data: { tenantId: defaultTenant.id },
  });
  console.log(`✅ ${equipmentUpdated.count} equipos asignados al tenant`);

  // 5. Asignar todos los talleres existentes al tenant por defecto
  const workshopsUpdated = await prisma.workshop.updateMany({
    where: { tenantId: null },
    data: { tenantId: defaultTenant.id },
  });
  console.log(`✅ ${workshopsUpdated.count} talleres asignados al tenant`);

  // 6. Asignar todas las reservaciones existentes al tenant por defecto
  const reservationsUpdated = await prisma.reservation.updateMany({
    where: { tenantId: null },
    data: { tenantId: defaultTenant.id },
  });
  console.log(`✅ ${reservationsUpdated.count} reservaciones asignadas al tenant`);

  // 7. Asignar todos los proyectos existentes al tenant por defecto
  const projectsUpdated = await prisma.project.updateMany({
    where: { tenantId: null },
    data: { tenantId: defaultTenant.id },
  });
  console.log(`✅ ${projectsUpdated.count} proyectos asignados al tenant`);

  // 8. Asignar todos los reportes existentes al tenant por defecto
  const reportsUpdated = await prisma.report.updateMany({
    where: { tenantId: null },
    data: { tenantId: defaultTenant.id },
  });
  console.log(`✅ ${reportsUpdated.count} reportes asignados al tenant`);

  // 9. Asignar todos los bloques recurrentes existentes al tenant por defecto
  const recurringBlocksUpdated = await prisma.recurringBlock.updateMany({
    where: { tenantId: null },
    data: { tenantId: defaultTenant.id },
  });
  console.log(`✅ ${recurringBlocksUpdated.count} bloques recurrentes asignados al tenant`);

  // 10. Asignar todas las inscripciones existentes al tenant por defecto
  const inscriptionsUpdated = await prisma.inscription.updateMany({
    where: { tenantId: null },
    data: { tenantId: defaultTenant.id },
  });
  console.log(`✅ ${inscriptionsUpdated.count} inscripciones asignadas al tenant`);

  console.log('\n🎉 Migración completada exitosamente!');
  console.log(`\nTenant ID: ${defaultTenant.id}`);
  console.log(`Tenant Slug: ${defaultTenant.slug}`);
}

main()
  .catch((e) => {
    console.error('❌ Error durante la migración:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
