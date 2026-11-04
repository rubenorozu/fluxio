import { prisma } from '@/lib/prisma';
import { addDays, format, startOfDay, endOfDay } from 'date-fns';

export interface SpaceBitacoraMetrics {
  spaceId: string;
  name: string;
  category: string;
  recurringHours: number;
  nonRecurringHours: number;
  rentalHours: number;
  totalHours: number;
  recurringCount: number;
  reservationCount: number;
  rentalCount: number;
  grid: Record<number, Record<string, string[]>>; // dayOfWeek (1-6) -> '07:00' -> array of strings
}

export interface CategorySummary {
  category: string;
  spacesCount: number;
  recurringHours: number;
  nonRecurringHours: number;
  rentalHours: number;
  totalHours: number;
  spaces: SpaceBitacoraMetrics[];
}

export interface BitacoraReportData {
  startDate: string;
  endDate: string;
  periodLabel: string;
  grandTotal: {
    totalSpaces: number;
    recurringHours: number;
    nonRecurringHours: number;
    rentalHours: number;
    totalHours: number;
  };
  categories: CategorySummary[];
  allSpaces: SpaceBitacoraMetrics[];
}

export const TIME_SLOTS = [
  '07:00 a 08:00',
  '08:00 a 09:00',
  '09:00 a 10:00',
  '10:00 a 11:00',
  '11:00 a 12:00',
  '12:00 a 13:00',
  '13:00 a 14:00',
  '14:00 a 15:00',
  '15:00 a 16:00',
  '16:00 a 17:00',
  '17:00 a 18:00',
  '18:00 a 19:00',
  '19:00 a 20:00',
  '20:00 a 21:00',
  '21:00 a 22:00',
];

export const DAYS_OF_WEEK_MAP: { index: number; label: string }[] = [
  { index: 1, label: 'LUNES' },
  { index: 2, label: 'MARTES' },
  { index: 3, label: 'MIERCOLES' },
  { index: 4, label: 'JUEVES' },
  { index: 5, label: 'VIERNES' },
  { index: 6, label: 'SABADO' },
];

export function getSpaceCategory(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('tv') || n.includes('televisión') || n.includes('fotografía')) {
    return 'Estudios de Producción';
  }
  if (n.includes('radio') || n.includes('audio') || n.includes('cabina')) {
    return 'Cabinas de Audio y Radio';
  }
  if (n.includes('técnicas mixtas')) {
    return 'Laboratorio de Técnicas Mixtas';
  }
  if (n.includes('stop motion')) {
    return 'Laboratorio de Stop Motion';
  }
  if (n.includes('edición') || n.includes('auvd') || n.includes('ftdg')) {
    return 'Salas de Edición y Cómputo';
  }
  return 'Otros Espacios';
}

export async function calculateBitacoraReport(params: {
  tenantId?: string;
  startDate: Date;
  endDate: Date;
  spaceIds?: string[];
}): Promise<BitacoraReportData> {
  const { tenantId, startDate, endDate, spaceIds } = params;

  // 1. Fetch spaces
  const spaceWhere: any = {};
  if (tenantId) spaceWhere.tenantId = tenantId;
  if (spaceIds && spaceIds.length > 0) {
    spaceWhere.id = { in: spaceIds };
  }

  const spaces = await prisma.space.findMany({
    where: spaceWhere,
    select: {
      id: true,
      name: true,
      location: { select: { name: true } },
    },
    orderBy: { name: 'asc' },
  });

  const rangeStart = startOfDay(startDate);
  const rangeEnd = endOfDay(endDate);

  // Format period label
  const periodLabel = `${format(rangeStart, 'dd/MM/yyyy')} al ${format(rangeEnd, 'dd/MM/yyyy')}`;

  const allSpacesMetrics: SpaceBitacoraMetrics[] = [];

  for (const sp of spaces) {
    const category = getSpaceCategory(sp.name);

    // Grid initialized for days 1 to 6
    const grid: Record<number, Record<string, string[]>> = {};
    for (const d of DAYS_OF_WEEK_MAP) {
      grid[d.index] = {};
      for (const slot of TIME_SLOTS) {
        grid[d.index][slot] = [];
      }
    }

    // 2. Fetch RecurringBlocks for this space
    const recurringBlocks = await prisma.recurringBlock.findMany({
      where: {
        spaceId: sp.id,
        startDate: { lte: rangeEnd },
        endDate: { gte: rangeStart },
      },
      include: {
        exceptions: true,
      },
    });

    let recurringHours = 0;
    let rentalHours = 0;
    let recurringCount = 0;
    let rentalCount = 0;

    for (const block of recurringBlocks) {
      const isRental = Boolean(block.isRental);
      const daysArray: number[] = typeof block.dayOfWeek === 'string'
        ? JSON.parse(block.dayOfWeek)
        : Array.isArray(block.dayOfWeek)
        ? block.dayOfWeek
        : [];

      const [startHour, startMin] = block.startTime.split(':').map(Number);
      const [endHour, endMin] = block.endTime.split(':').map(Number);
      const slotDuration = Math.max(0, (endHour + endMin / 60) - (startHour + startMin / 60));

      if (isRental) {
        rentalCount++;
      } else {
        recurringCount++;
      }

      // Populate grid timetable
      for (const dayIdx of daysArray) {
        if (grid[dayIdx]) {
          const slotKey = findMatchingSlot(block.startTime);
          const cellText = isRental
            ? `[RENTA] ${block.title}${block.description ? ' - ' + block.description : ''}`
            : `${block.title}${block.description ? ' - ' + block.description : ''}`;

          if (grid[dayIdx][slotKey]) {
            if (!grid[dayIdx][slotKey].includes(cellText)) {
              grid[dayIdx][slotKey].push(cellText);
            }
          }
        }
      }

      // Sum exact hours within [rangeStart, rangeEnd]
      let cur = startOfDay(block.startDate > rangeStart ? block.startDate : rangeStart);
      const blockEnd = endOfDay(block.endDate < rangeEnd ? block.endDate : rangeEnd);

      while (cur <= blockEnd) {
        const curDay = cur.getDay();
        if (daysArray.includes(curDay)) {
          // Check if exception
          const curDateStr = format(cur, 'yyyy-MM-dd');
          const isException = block.exceptions.some(
            ex =>
              format(new Date(ex.exceptionDate), 'yyyy-MM-dd') === curDateStr &&
              ex.exceptionStartTime === block.startTime
          );

          if (!isException) {
            if (isRental) {
              rentalHours += slotDuration;
            } else {
              recurringHours += slotDuration;
            }
          }
        }
        cur = addDays(cur, 1);
      }
    }

    // 3. Fetch non-recurring reservations (Alumnos y Docentes)
    const reservations = await prisma.reservation.findMany({
      where: {
        spaceId: sp.id,
        startTime: { gte: rangeStart },
        endTime: { lte: rangeEnd },
        status: { in: ['APPROVED', 'PARTIALLY_APPROVED'] },
      },
      include: {
        user: { select: { firstName: true, lastName: true, role: true } },
      },
    });

    let nonRecurringHours = 0;
    const reservationCount = reservations.length;

    for (const res of reservations) {
      const diffHours = Math.max(0, (res.endTime.getTime() - res.startTime.getTime()) / 3600000);
      nonRecurringHours += diffHours;

      // Also overlay in grid if relevant
      const resDay = res.startTime.getDay();
      if (grid[resDay]) {
        const timeStr = format(res.startTime, 'HH:mm');
        const slotKey = findMatchingSlot(timeStr);
        const resLabel = `[RESERVA] ${res.subject || res.justification || 'Uso de Espacio'} (${res.user.firstName} ${res.user.lastName})`;
        if (grid[resDay][slotKey] && !grid[resDay][slotKey].includes(resLabel)) {
          grid[resDay][slotKey].push(resLabel);
        }
      }
    }

    const totalHours = Math.round((recurringHours + nonRecurringHours + rentalHours) * 100) / 100;

    allSpacesMetrics.push({
      spaceId: sp.id,
      name: sp.name,
      category,
      recurringHours: Math.round(recurringHours * 100) / 100,
      nonRecurringHours: Math.round(nonRecurringHours * 100) / 100,
      rentalHours: Math.round(rentalHours * 100) / 100,
      totalHours,
      recurringCount,
      reservationCount,
      rentalCount,
      grid,
    });
  }

  // Group by category logically
  const categoriesMap = new Map<string, CategorySummary>();

  for (const m of allSpacesMetrics) {
    if (!categoriesMap.has(m.category)) {
      categoriesMap.set(m.category, {
        category: m.category,
        spacesCount: 0,
        recurringHours: 0,
        nonRecurringHours: 0,
        rentalHours: 0,
        totalHours: 0,
        spaces: [],
      });
    }

    const cat = categoriesMap.get(m.category)!;
    cat.spacesCount += 1;
    cat.recurringHours = Math.round((cat.recurringHours + m.recurringHours) * 100) / 100;
    cat.nonRecurringHours = Math.round((cat.nonRecurringHours + m.nonRecurringHours) * 100) / 100;
    cat.rentalHours = Math.round((cat.rentalHours + m.rentalHours) * 100) / 100;
    cat.totalHours = Math.round((cat.totalHours + m.totalHours) * 100) / 100;
    cat.spaces.push(m);
  }

  const categories = Array.from(categoriesMap.values()).sort((a, b) => a.category.localeCompare(b.category));

  // Compute grand totals
  const grandTotal = {
    totalSpaces: allSpacesMetrics.length,
    recurringHours: Math.round(allSpacesMetrics.reduce((s, x) => s + x.recurringHours, 0) * 100) / 100,
    nonRecurringHours: Math.round(allSpacesMetrics.reduce((s, x) => s + x.nonRecurringHours, 0) * 100) / 100,
    rentalHours: Math.round(allSpacesMetrics.reduce((s, x) => s + x.rentalHours, 0) * 100) / 100,
    totalHours: Math.round(allSpacesMetrics.reduce((s, x) => s + x.totalHours, 0) * 100) / 100,
  };

  return {
    startDate: format(rangeStart, 'yyyy-MM-dd'),
    endDate: format(rangeEnd, 'yyyy-MM-dd'),
    periodLabel,
    grandTotal,
    categories,
    allSpaces: allSpacesMetrics,
  };
}

function findMatchingSlot(timeStr: string): string {
  const [hour] = timeStr.split(':').map(Number);
  const formattedHour = String(hour).padStart(2, '0');
  const nextHour = String(hour + 1).padStart(2, '0');
  const target = `${formattedHour}:00 a ${nextHour}:00`;
  const found = TIME_SLOTS.find(s => s.startsWith(formattedHour));
  return found || target;
}
