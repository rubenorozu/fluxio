
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany();
  console.log('--- Tenants ---');
  tenants.forEach(t => console.log(`${t.id}: ${t.name} (${t.slug})`));

  const spaces = await prisma.space.findMany();
  console.log('\n--- All Spaces ---');
  spaces.forEach(s => console.log(`${s.id}: ${s.name} [Tenant: ${s.tenantId}]`));

  const reservations = await prisma.reservation.findMany({
    include: { user: { select: { firstName: true } }, space: { select: { name: true } } }
  });
  console.log('\n--- All Reservations ---');
  reservations.forEach(r => {
    console.log(`- ID: ${r.id}, Space: ${r.space?.name}, Status: ${r.status}, Start: ${r.startTime}, User: ${r.user?.firstName}`);
  });
}

main().finally(() => prisma.$disconnect());
