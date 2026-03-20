
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const space = await prisma.space.findFirst({
    where: { name: { contains: 'Estudio de TV' } }
  });

  if (!space) {
    console.log('Space not found');
    return;
  }

  console.log('--- Space Details ---');
  console.log('ID:', space.id);
  console.log('Name:', space.name);
  console.log('Tenant:', space.tenantId);

  const start = new Date('2026-03-20T00:00:00.000Z');
  const end = new Date('2026-03-31T23:59:59.000Z');

  console.log('\n--- Reservations (All) ---');
  const reservations = await prisma.reservation.findMany({
    where: {
      tenantId: space.tenantId,
      spaceId: space.id
    },
    include: { user: true }
  });

  reservations.forEach(r => {
    console.log(`- ID: ${r.id}, Status: ${r.status}, Subject: ${r.subject}, Dates: ${r.startTime.toISOString()} to ${r.endTime.toISOString()}, User: ${r.user.firstName}`);
  });

  console.log('\n--- Recurring Blocks ---');
  const blocks = await prisma.recurringBlock.findMany({
    where: {
      tenantId: space.tenantId,
      spaceId: space.id
    }
  });

  blocks.forEach(b => {
    console.log(`- ID: ${b.id}, Title: ${b.title}, Days: ${b.dayOfWeek}, Range: ${b.startDate.toISOString()} to ${b.endDate.toISOString()}, Times: ${b.startTime} to ${b.endTime}`);
  });
}

main().finally(() => prisma.$disconnect());
