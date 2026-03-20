
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenantId = 'cmiyzxlct0000gy04pezgk3u0';
  const blocks = await prisma.recurringBlock.findMany({
    where: { tenantId },
    include: {
        space: true,
        equipment: { include: { equipment: true } }
    }
  });

  console.log(`--- Recurring Blocks for Tenant ${tenantId} ---`);
  blocks.forEach(b => {
    console.log(JSON.stringify({
        id: b.id,
        title: b.title,
        space: b.space?.name,
        equipment: b.equipment.map(e => e.equipment.name),
        dayOfWeek: b.dayOfWeek,
        start: b.startDate,
        end: b.endDate,
        times: `${b.startTime} - ${b.endTime}`
    }));
  });
}

main().finally(() => prisma.$disconnect());
