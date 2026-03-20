
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenantId = 'cmiyzxlct0000gy04pezgk3u0';
  const reservations = await prisma.reservation.findMany({
    where: { tenantId },
    include: {
        user: true,
        space: true,
        equipment: true
    }
  });

  console.log(`--- Reservations for Tenant ${tenantId} ---`);
  reservations.forEach(r => {
    console.log(JSON.stringify({
        id: r.id,
        space: r.space?.name,
        equipment: r.equipment?.name,
        subject: r.subject,
        status: r.status,
        start: r.startTime,
        user: r.user.firstName
    }));
  });
}

main().finally(() => prisma.$disconnect());
