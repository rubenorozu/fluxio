
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const blocks = await prisma.recurringBlock.findMany({
    where: { title: { contains: 'Iluminación' } }
  });
  console.log(JSON.stringify(blocks, null, 2));
}

main().finally(() => prisma.$disconnect());
