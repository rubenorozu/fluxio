const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function enableRls() {
  try {
    const tables = await prisma.$queryRawUnsafe(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);

    for (const row of tables) {
      const table = row.table_name;
      if (table !== '_prisma_migrations') {
        await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
        console.log(`Enabled RLS on table: ${table}`);
      }
    }
    console.log('Successfully enabled Row-Level Security on all public tables.');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

enableRls();
