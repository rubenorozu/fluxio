import ExcelJS from 'exceljs';
import { BitacoraReportData, DAYS_OF_WEEK_MAP, TIME_SLOTS } from './bitacora';

// Palette Definitions
const COLORS = {
  univaNavy: 'FF145775',
  univaNavyDark: 'FF0D3B50',
  univaGold: 'FFFF9500',
  univaGoldSoft: 'FFFEF3C7',
  univaGoldText: 'FF92400E',
  slateDark: 'FF1E293B',
  slateHeader: 'FF334155',
  slateLight: 'FFF1F5F9',
  slateBorder: 'FFCBD5E1',
  white: 'FFFFFFFF',
  // Event fills
  classFill: 'FFE0F2FE',       // Soft Sky Blue
  classText: 'FF0369A1',       // Dark Sky Blue
  classBorder: 'FFBAE6FD',
  rentalFill: 'FFF3E8FF',      // Soft Purple
  rentalText: 'FF6B21A8',      // Dark Purple
  rentalBorder: 'FFDDD6FE',
  reservationFill: 'FFDCFCE7', // Soft Emerald
  reservationText: 'FF15803D', // Dark Emerald
  reservationBorder: 'FFBBF7D0',
};

const BORDER_THIN = {
  top: { style: 'thin' as const, color: { argb: COLORS.slateBorder } },
  bottom: { style: 'thin' as const, color: { argb: COLORS.slateBorder } },
  left: { style: 'thin' as const, color: { argb: COLORS.slateBorder } },
  right: { style: 'thin' as const, color: { argb: COLORS.slateBorder } },
};

const BORDER_DOUBLE_BOTTOM = {
  top: { style: 'thin' as const, color: { argb: COLORS.slateBorder } },
  bottom: { style: 'double' as const, color: { argb: COLORS.univaNavy } },
  left: { style: 'thin' as const, color: { argb: COLORS.slateBorder } },
  right: { style: 'thin' as const, color: { argb: COLORS.slateBorder } },
};

export async function generateBitacoraWorkbook(data: BitacoraReportData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema de Reservas — UNIVA';
  workbook.lastModifiedBy = 'Administración CEPROA';
  workbook.created = new Date();
  workbook.modified = new Date();

  // -------------------------------------------------------------
  // HOJA 1: DASHBOARD GENERAL (Resumen Ejecutivo)
  // -------------------------------------------------------------
  const wsDash = workbook.addWorksheet('DASHBOARD GENERAL', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 3 }],
  });

  // Column Widths
  wsDash.columns = [
    { width: 44 }, // A: Espacio
    { width: 28 }, // B: Horas Recurrentes
    { width: 34 }, // C: Horas NO Recurrentes
    { width: 26 }, // D: Horas Renta
    { width: 22 }, // E: Total Horas
    { width: 16 }, // F: % Ocupación
  ];

  // Header Row 1: Title
  wsDash.mergeCells('A1:F1');
  const row1 = wsDash.getCell('A1');
  row1.value = 'UNIVERSIDAD DEL VALLE DE ATEMAJAC';
  row1.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: COLORS.white } };
  row1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.univaNavy } };
  row1.alignment = { horizontal: 'center', vertical: 'middle' };
  wsDash.getRow(1).height = 32;

  // Header Row 2: Subtitle
  wsDash.mergeCells('A2:F2');
  const row2 = wsDash.getCell('A2');
  row2.value = 'CEPROA — BITÁCORA CUATRIMESTRAL Y MÉTRICAS DE USO DE ESPACIOS';
  row2.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: COLORS.univaGold } };
  row2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.univaNavyDark } };
  row2.alignment = { horizontal: 'center', vertical: 'middle' };
  wsDash.getRow(2).height = 24;

  // Header Row 3: Period
  wsDash.mergeCells('A3:F3');
  const row3 = wsDash.getCell('A3');
  row3.value = `PERÍODO REPORTADO: ${data.periodLabel.toUpperCase()} | TOTAL ESPACIOS ANALIZADOS: ${data.grandTotal.totalSpaces}`;
  row3.font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FFE2E8F0' } };
  row3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.univaNavyDark } };
  row3.alignment = { horizontal: 'center', vertical: 'middle' };
  wsDash.getRow(3).height = 20;

  // Spacer
  wsDash.getRow(4).height = 14;

  // KPI CARDS BANNER (Rows 5..7)
  // Card 1: Horas Recurrentes (A5..A7)
  // Card 2: Horas No Recurrentes (B5..C7)
  // Card 3: Horas Renta (D5..D7)
  // Card 4: Gran Total (E5..F7)

  // Card 1
  wsDash.getCell('A5').value = 'HORAS RECURRENTES';
  wsDash.getCell('A5').font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: COLORS.classText } };
  wsDash.getCell('A5').alignment = { horizontal: 'center', vertical: 'middle' };
  wsDash.getCell('A5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.classFill } };

  wsDash.getCell('A6').value = `${data.grandTotal.recurringHours} hrs`;
  wsDash.getCell('A6').font = { name: 'Segoe UI', size: 18, bold: true, color: { argb: COLORS.classText } };
  wsDash.getCell('A6').alignment = { horizontal: 'center', vertical: 'middle' };
  wsDash.getCell('A6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.classFill } };

  wsDash.getCell('A7').value = 'Clases asignadas cuatrimestre';
  wsDash.getCell('A7').font = { name: 'Segoe UI', size: 8, italic: true, color: { argb: 'FF64748B' } };
  wsDash.getCell('A7').alignment = { horizontal: 'center', vertical: 'middle' };
  wsDash.getCell('A7').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.classFill } };

  ['A5', 'A6', 'A7'].forEach(c => (wsDash.getCell(c).border = BORDER_THIN));

  // Card 2 (Merge B & C)
  wsDash.mergeCells('B5:C5');
  wsDash.mergeCells('B6:C6');
  wsDash.mergeCells('B7:C7');

  wsDash.getCell('B5').value = 'HORAS NO RECURRENTES';
  wsDash.getCell('B5').font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: COLORS.reservationText } };
  wsDash.getCell('B5').alignment = { horizontal: 'center', vertical: 'middle' };
  wsDash.getCell('B5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.reservationFill } };

  wsDash.getCell('B6').value = `${data.grandTotal.nonRecurringHours} hrs`;
  wsDash.getCell('B6').font = { name: 'Segoe UI', size: 18, bold: true, color: { argb: COLORS.reservationText } };
  wsDash.getCell('B6').alignment = { horizontal: 'center', vertical: 'middle' };
  wsDash.getCell('B6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.reservationFill } };

  wsDash.getCell('B7').value = 'Solicitudes adicionales (Alumnos/Docentes)';
  wsDash.getCell('B7').font = { name: 'Segoe UI', size: 8, italic: true, color: { argb: 'FF64748B' } };
  wsDash.getCell('B7').alignment = { horizontal: 'center', vertical: 'middle' };
  wsDash.getCell('B7').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.reservationFill } };

  ['B5', 'C5', 'B6', 'C6', 'B7', 'C7'].forEach(c => (wsDash.getCell(c).border = BORDER_THIN));

  // Card 3
  wsDash.getCell('D5').value = 'HORAS RENTA DE ESPACIO';
  wsDash.getCell('D5').font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: COLORS.rentalText } };
  wsDash.getCell('D5').alignment = { horizontal: 'center', vertical: 'middle' };
  wsDash.getCell('D5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.rentalFill } };

  wsDash.getCell('D6').value = `${data.grandTotal.rentalHours} hrs`;
  wsDash.getCell('D6').font = { name: 'Segoe UI', size: 18, bold: true, color: { argb: COLORS.rentalText } };
  wsDash.getCell('D6').alignment = { horizontal: 'center', vertical: 'middle' };
  wsDash.getCell('D6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.rentalFill } };

  wsDash.getCell('D7').value = 'Rentas externas / comerciales';
  wsDash.getCell('D7').font = { name: 'Segoe UI', size: 8, italic: true, color: { argb: 'FF64748B' } };
  wsDash.getCell('D7').alignment = { horizontal: 'center', vertical: 'middle' };
  wsDash.getCell('D7').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.rentalFill } };

  ['D5', 'D6', 'D7'].forEach(c => (wsDash.getCell(c).border = BORDER_THIN));

  // Card 4 (Merge E & F)
  wsDash.mergeCells('E5:F5');
  wsDash.mergeCells('E6:F6');
  wsDash.mergeCells('E7:F7');

  wsDash.getCell('E5').value = 'GRAN TOTAL GENERAL';
  wsDash.getCell('E5').font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: COLORS.white } };
  wsDash.getCell('E5').alignment = { horizontal: 'center', vertical: 'middle' };
  wsDash.getCell('E5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.univaNavy } };

  wsDash.getCell('E6').value = `${data.grandTotal.totalHours} hrs`;
  wsDash.getCell('E6').font = { name: 'Segoe UI', size: 18, bold: true, color: { argb: COLORS.univaGold } };
  wsDash.getCell('E6').alignment = { horizontal: 'center', vertical: 'middle' };
  wsDash.getCell('E6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.univaNavy } };

  wsDash.getCell('E7').value = `100% de ocupación registrada`;
  wsDash.getCell('E7').font = { name: 'Segoe UI', size: 8, italic: true, color: { argb: 'FFE2E8F0' } };
  wsDash.getCell('E7').alignment = { horizontal: 'center', vertical: 'middle' };
  wsDash.getCell('E7').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.univaNavy } };

  ['E5', 'F5', 'E6', 'F6', 'E7', 'F7'].forEach(c => (wsDash.getCell(c).border = BORDER_THIN));

  wsDash.getRow(5).height = 20;
  wsDash.getRow(6).height = 30;
  wsDash.getRow(7).height = 18;
  wsDash.getRow(8).height = 16; // Spacer

  let currentRow = 9;

  // Render Categorized Tables
  for (const cat of data.categories) {
    // Category Banner
    wsDash.mergeCells(`A${currentRow}:F${currentRow}`);
    const catCell = wsDash.getCell(`A${currentRow}`);
    catCell.value = `CATEGORÍA: ${cat.category.toUpperCase()} (${cat.spacesCount} ${cat.spacesCount === 1 ? 'espacio' : 'espacios'})`;
    catCell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: COLORS.white } };
    catCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.slateHeader } };
    catCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    wsDash.getRow(currentRow).height = 26;
    currentRow++;

    // Table Column Headers
    const headers = [
      'Espacio',
      'Horas Recurrentes (Clases)',
      'Horas NO Recurrentes (Alumnos/Docentes)',
      'Horas Renta de Espacio',
      'Total Horas',
      '% del Total',
    ];

    const hRow = wsDash.getRow(currentRow);
    hRow.values = headers;
    hRow.height = 24;
    hRow.eachCell((cell, colNum) => {
      cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: COLORS.slateDark } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.slateLight } };
      cell.alignment = { horizontal: colNum === 1 ? 'left' : 'center', vertical: 'middle' };
      cell.border = BORDER_THIN;
    });
    currentRow++;

    // Data rows
    cat.spaces.forEach((sp, idx) => {
      const dRow = wsDash.getRow(currentRow);
      const pct = data.grandTotal.totalHours > 0 ? (sp.totalHours / data.grandTotal.totalHours) : 0;

      dRow.values = [
        sp.name,
        sp.recurringHours,
        sp.nonRecurringHours,
        sp.rentalHours,
        sp.totalHours,
        pct,
      ];
      dRow.height = 22;

      const isEven = idx % 2 === 0;
      const rowBg = isEven ? COLORS.white : 'FFF8FAFC';

      dRow.eachCell((cell, colNum) => {
        cell.font = { name: 'Segoe UI', size: 9.5, color: { argb: COLORS.slateDark } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
        cell.border = BORDER_THIN;

        if (colNum === 1) {
          cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
          cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: COLORS.slateDark } };
        } else if (colNum === 6) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.numFmt = '0.0%';
        } else {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.numFmt = '#,##0.0';
        }
      });
      currentRow++;
    });

    // Subtotal row
    const subRow = wsDash.getRow(currentRow);
    const catPct = data.grandTotal.totalHours > 0 ? (cat.totalHours / data.grandTotal.totalHours) : 0;
    subRow.values = [
      `SUBTOTAL ${cat.category.toUpperCase()}`,
      cat.recurringHours,
      cat.nonRecurringHours,
      cat.rentalHours,
      cat.totalHours,
      catPct,
    ];
    subRow.height = 24;
    subRow.eachCell((cell, colNum) => {
      cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: COLORS.univaNavy } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      cell.border = BORDER_THIN;

      if (colNum === 1) {
        cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      } else if (colNum === 6) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.numFmt = '0.0%';
      } else {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.numFmt = '#,##0.0';
      }
    });
    currentRow += 2; // Spacer after subtotal
  }

  // Grand Total Row
  const gtRow = wsDash.getRow(currentRow);
  gtRow.values = [
    'GRAN TOTAL GENERAL INSTITUCIONAL',
    data.grandTotal.recurringHours,
    data.grandTotal.nonRecurringHours,
    data.grandTotal.rentalHours,
    data.grandTotal.totalHours,
    1,
  ];
  gtRow.height = 28;
  gtRow.eachCell((cell, colNum) => {
    cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: COLORS.white } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.univaNavy } };
    cell.border = BORDER_DOUBLE_BOTTOM;

    if (colNum === 1) {
      cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    } else if (colNum === 6) {
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.numFmt = '0.0%';
    } else {
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.numFmt = '#,##0.0';
    }
  });

  // -------------------------------------------------------------
  // HOJAS 2..N: UN ESPACIO POR HOJA (Malla de Bitácora Estilizada)
  // -------------------------------------------------------------
  const usedSheetNames = new Set<string>(['DASHBOARD GENERAL']);

  for (const sp of data.allSpaces) {
    let cleanName = sp.name
      .replace(/[\\/?*\[\]:]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 30);

    if (usedSheetNames.has(cleanName)) {
      let counter = 2;
      while (usedSheetNames.has(`${cleanName.slice(0, 27)}_${counter}`)) {
        counter++;
      }
      cleanName = `${cleanName.slice(0, 27)}_${counter}`;
    }
    usedSheetNames.add(cleanName);

    const ws = workbook.addWorksheet(cleanName, {
      views: [{ showGridLines: true, state: 'frozen', xSplit: 1, ySplit: 4 }],
    });

    // Column widths
    ws.columns = [
      { width: 18 }, // A: HORA
      { width: 34 }, // B: LUNES
      { width: 34 }, // C: MARTES
      { width: 34 }, // D: MIERCOLES
      { width: 34 }, // E: JUEVES
      { width: 34 }, // F: VIERNES
      { width: 34 }, // G: SABADO
      { width: 4 },  // H: Espaciador
      { width: 32 }, // I: Métrica label
      { width: 22 }, // J: Valor
    ];

    // Row 1: Space Name
    ws.mergeCells('A1:G1');
    const titleCell = ws.getCell('A1');
    titleCell.value = sp.name.toUpperCase();
    titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: COLORS.white } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.univaNavy } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 32;

    // Row 2: Period
    ws.mergeCells('A2:G2');
    const periodCell = ws.getCell('A2');
    periodCell.value = `PERÍODO: ${data.periodLabel.toUpperCase()} | CATEGORÍA: ${sp.category.toUpperCase()}`;
    periodCell.font = { name: 'Segoe UI', size: 10.5, bold: true, color: { argb: COLORS.univaGold } };
    periodCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.univaNavyDark } };
    periodCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(2).height = 22;

    // Row 3: Spacer
    ws.getRow(3).height = 10;

    // Row 4: Grid Headers & Metrics Header
    const row4 = ws.getRow(4);
    row4.values = [
      'HORA',
      'LUNES',
      'MARTES',
      'MIERCOLES',
      'JUEVES',
      'VIERNES',
      'SABADO',
      '',
      'RESUMEN DE HORAS',
      'VALOR',
    ];
    row4.height = 26;

    // Style A4..G4
    for (let c = 1; c <= 7; c++) {
      const cell = row4.getCell(c);
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: COLORS.white } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.slateHeader } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = BORDER_THIN;
    }

    // Style I4..J4
    ws.mergeCells('I4:J4');
    const kpiHead = ws.getCell('I4');
    kpiHead.value = 'RESUMEN DEL ESPACIO';
    kpiHead.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: COLORS.white } };
    kpiHead.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.univaNavy } };
    kpiHead.alignment = { horizontal: 'center', vertical: 'middle' };
    ['I4', 'J4'].forEach(c => (ws.getCell(c).border = BORDER_THIN));

    // Rows 5..19 (Time Slots & KPI Card on the Right)
    TIME_SLOTS.forEach((slot, idx) => {
      const rNum = 5 + idx;
      const row = ws.getRow(rNum);
      row.height = 38;

      // Col A: Hour
      const hCell = row.getCell(1);
      hCell.value = slot;
      hCell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: COLORS.slateDark } };
      hCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.slateLight } };
      hCell.alignment = { horizontal: 'center', vertical: 'middle' };
      hCell.border = BORDER_THIN;

      // Cols B..G: Days of Week
      DAYS_OF_WEEK_MAP.forEach((d, dIdx) => {
        const cell = row.getCell(2 + dIdx);
        const items = sp.grid[d.index]?.[slot] || [];

        if (items.length > 0) {
          cell.value = items.join('\n');
          cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 };

          const isRental = items.some(i => i.startsWith('[RENTA]'));
          const isReservation = items.some(i => i.startsWith('[RESERVA]'));

          if (isRental) {
            cell.font = { name: 'Segoe UI', size: 8.5, bold: true, color: { argb: COLORS.rentalText } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.rentalFill } };
          } else if (isReservation) {
            cell.font = { name: 'Segoe UI', size: 8.5, bold: true, color: { argb: COLORS.reservationText } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.reservationFill } };
          } else {
            cell.font = { name: 'Segoe UI', size: 8.5, color: { argb: COLORS.classText } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.classFill } };
          }
        } else {
          cell.value = '-';
          cell.font = { name: 'Segoe UI', size: 9, color: { argb: 'FF94A3B8' } };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.white } };
        }
        cell.border = BORDER_THIN;
      });

      // Side KPI Card on rows 5..12
      const kpiItems = [
        { label: 'Categoría:', val: sp.category, bold: false, color: COLORS.slateDark, bg: COLORS.white },
        { label: 'Horas Recurrentes (Clases):', val: `${sp.recurringHours} hrs`, bold: true, color: COLORS.classText, bg: COLORS.classFill },
        { label: 'Horas NO Recurrentes (Alumnos):', val: `${sp.nonRecurringHours} hrs`, bold: true, color: COLORS.reservationText, bg: COLORS.reservationFill },
        { label: 'Horas Renta de Espacio:', val: `${sp.rentalHours} hrs`, bold: true, color: COLORS.rentalText, bg: COLORS.rentalFill },
        { label: 'TOTAL HORAS REGISTRADAS:', val: `${sp.totalHours} hrs`, bold: true, color: COLORS.univaNavy, bg: 'FFE2E8F0' },
        { label: 'Bloqueos de Clases (Recurrentes):', val: sp.recurringCount, bold: false, color: COLORS.slateDark, bg: COLORS.white },
        { label: 'Reservas Alumnos / Docentes:', val: sp.reservationCount, bold: false, color: COLORS.slateDark, bg: COLORS.white },
        { label: 'Eventos de Renta:', val: sp.rentalCount, bold: false, color: COLORS.slateDark, bg: COLORS.white },
      ];

      if (idx < kpiItems.length) {
        const item = kpiItems[idx];
        const lblCell = row.getCell(9);
        const valCell = row.getCell(10);

        lblCell.value = item.label;
        lblCell.font = { name: 'Segoe UI', size: 9, bold: item.bold, color: { argb: item.color } };
        lblCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: item.bg } };
        lblCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        lblCell.border = BORDER_THIN;

        valCell.value = item.val;
        valCell.font = { name: 'Segoe UI', size: 9.5, bold: item.bold, color: { argb: item.color } };
        valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: item.bg } };
        valCell.alignment = { horizontal: 'center', vertical: 'middle' };
        valCell.border = BORDER_THIN;
      }
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
