import { calculateBitacoraReport } from '../lib/reports/bitacora';
import { generateBitacoraWorkbook } from '../lib/reports/bitacora-excel';
import { prisma } from '../lib/prisma';
import fs from 'fs';

async function main() {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'tuceproa' },
  });

  if (!tenant) {
    console.error('Tenant tuceproa not found');
    return;
  }

  const startDate = new Date(2026, 4, 1); // May 1, 2026
  const endDate = new Date(2026, 7, 31); // Aug 31, 2026

  console.log(`Calculating bitacora report for ${tenant.name} from ${startDate.toISOString()} to ${endDate.toISOString()}...`);

  const report = await calculateBitacoraReport({
    tenantId: tenant.id,
    startDate,
    endDate,
  });

  console.log('\n--- REPORT SUMMARY ---');
  console.log(`Total spaces analyzed: ${report.grandTotal.totalSpaces}`);
  console.log(`Recurring hours (Clases): ${report.grandTotal.recurringHours} hrs`);
  console.log(`Non-recurring hours (Alumnos/Docentes): ${report.grandTotal.nonRecurringHours} hrs`);
  console.log(`Rental hours (Renta de Espacios): ${report.grandTotal.rentalHours} hrs`);
  console.log(`GRAND TOTAL HOURS: ${report.grandTotal.totalHours} hrs`);

  console.log('\n--- CATEGORIES BREAKDOWN ---');
  for (const cat of report.categories) {
    console.log(`[${cat.category}] - ${cat.spacesCount} espacios | Total: ${cat.totalHours} hrs (Recurrentes: ${cat.recurringHours} hrs, No Recurrentes: ${cat.nonRecurringHours} hrs, Rentas: ${cat.rentalHours} hrs)`);
  }

  const buffer = generateBitacoraWorkbook(report);
  const outPath = '/Users/univa/.gemini/antigravity-ide/brain/0b13ed42-adbc-4001-a6a6-c6455047bf85/scratch/test_bitacora.xlsx';
  fs.mkdirSync('/Users/univa/.gemini/antigravity-ide/brain/0b13ed42-adbc-4001-a6a6-c6455047bf85/scratch', { recursive: true });
  fs.writeFileSync(outPath, buffer);
  console.log(`\nSuccessfully saved Excel workbook to ${outPath} (${buffer.length} bytes)`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
