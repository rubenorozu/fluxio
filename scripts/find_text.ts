
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const searchTerm = 'Iluminación'; // O 'José' o 'Modelos'

  console.log('Searching for:', searchTerm);

  // Search in Workshops
  const workshops = await prisma.workshop.findMany({
    where: { OR: [{ name: { contains: searchTerm } }, { description: { contains: searchTerm } }] }
  });
  console.log('Workshops:', workshops.length);

  // Search in WorkshopSessions
  const sessions = await prisma.workshopSession.findMany({
    where: { OR: [{ room: { contains: searchTerm } }] }
  });
  console.log('WorkshopSessions:', sessions.length);

  // Search in Reservations
  const reservations = await prisma.reservation.findMany({
    where: { OR: [{ justification: { contains: searchTerm } }, { subject: { contains: searchTerm } }] },
    include: { space: true, user: true }
  });
  console.log('Reservations:', reservations.length);
  reservations.forEach(r => console.log(`- Reservation: ${r.justification}, Status: ${r.status}, Space: ${r.space?.name}`));

  // Search in RecurringBlocks
  const blocks = await prisma.recurringBlock.findMany({
    where: { OR: [{ title: { contains: searchTerm } }, { description: { contains: searchTerm } }] },
    include: { space: true }
  });
  console.log('RecurringBlocks:', blocks.length);
  blocks.forEach(b => console.log(`- RecurringBlock: ${b.title}, Space: ${b.space?.name}`));
}

main().finally(() => prisma.$disconnect());
