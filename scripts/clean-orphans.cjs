const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanOrphans() {
  try {
    // We can't access implicit many-to-many tables directly via Prisma Client easily.
    // We will use raw SQL to delete orphaned rows.
    console.log("Cleaning up orphaned relations...");
    
    // Clean _WorkshopResponsibles
    await prisma.$executeRawUnsafe(`
      DELETE FROM "_WorkshopResponsibles"
      WHERE "A" NOT IN (SELECT id FROM "Workshop")
         OR "B" NOT IN (SELECT id FROM "User");
    `);
    
    // Clean _EquipmentResponsibles
    await prisma.$executeRawUnsafe(`
      DELETE FROM "_EquipmentResponsibles"
      WHERE "A" NOT IN (SELECT id FROM "Equipment")
         OR "B" NOT IN (SELECT id FROM "User");
    `);

    // Clean _SpaceResponsibles
    await prisma.$executeRawUnsafe(`
      DELETE FROM "_SpaceResponsibles"
      WHERE "A" NOT IN (SELECT id FROM "Space")
         OR "B" NOT IN (SELECT id FROM "User");
    `);
    
    console.log("Cleanup completed successfully.");
  } catch (error) {
    console.error("Error during cleanup:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanOrphans();
