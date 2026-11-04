import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { Role } from '@prisma/client';
import { calculateBitacoraReport } from '@/lib/reports/bitacora';
import { generateBitacoraWorkbook } from '@/lib/reports/bitacora-excel';

export async function GET(request: Request) {
  try {
    const session = await getServerSession({ validateTenant: true });

    const allowedRoles: Role[] = [Role.SUPERUSER, Role.ADMIN_RESOURCE, Role.ADMIN_RESERVATION];
    if (!session || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Acceso denegado.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);

    // If spacesOnly requested, return all spaces with categories directly
    if (searchParams.get('spacesOnly') === 'true') {
      const { prisma } = await import('@/lib/prisma');
      const { getSpaceCategory } = await import('@/lib/reports/bitacora');
      const rawSpaces = await prisma.space.findMany({
        where: session.user.tenantId ? { tenantId: session.user.tenantId } : {},
        select: {
          id: true,
          name: true,
          location: { select: { name: true } },
        },
        orderBy: { name: 'asc' },
      });

      const spaces = rawSpaces.map(s => ({
        id: s.id,
        name: s.name,
        category: getSpaceCategory(s.name),
        locationName: s.location?.name || null,
      }));

      return NextResponse.json({ spaces });
    }

    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const spaceIdsParam = searchParams.get('spaceIds');
    const format = searchParams.get('format') || 'json';

    // Default dates if missing: Current cuatrimestre or last 4 months
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (startDateParam) {
      const [y, m, d] = startDateParam.split('-').map(Number);
      startDate = new Date(y, m - 1, d);
    } else {
      // Default to start of current month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    if (endDateParam) {
      const [y, m, d] = endDateParam.split('-').map(Number);
      endDate = new Date(y, m - 1, d);
    } else {
      // Default to end of current month + 3 months
      endDate = new Date(now.getFullYear(), now.getMonth() + 4, 0);
    }

    const spaceIds = spaceIdsParam
      ? spaceIdsParam.split(',').map(s => s.trim()).filter(Boolean)
      : undefined;

    const data = await calculateBitacoraReport({
      tenantId: session.user.tenantId || undefined,
      startDate,
      endDate,
      spaceIds,
    });

    if (format === 'excel') {
      const buffer = await generateBitacoraWorkbook(data);
      const filename = `BITACORA_ESPACIOS_${data.startDate}_al_${data.endDate}.xlsx`;

      return new NextResponse(buffer as any, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error al generar bitácora cuatrimestral:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno al generar bitácora' },
      { status: 500 }
    );
  }
}
