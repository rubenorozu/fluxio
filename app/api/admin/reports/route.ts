import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { normalizeText } from '@/lib/search-utils';

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session || (session.user.role !== 'SUPERUSER' && session.user.role !== 'ADMIN_RESOURCE')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const searchTerm = searchParams.get('search') || '';

    const skip = (page - 1) * pageSize;

    // When searching, fetch more results and filter in memory for accent-insensitive search
    const fetchLimit = searchTerm ? 1000 : pageSize;
    const effectiveSkip = searchTerm ? 0 : skip;

    const whereClause: any = {};
    if (searchTerm) {
      whereClause.OR = [
        { description: { contains: searchTerm } },
        { space: { name: { contains: searchTerm } } },
        { equipment: { name: { contains: searchTerm } } },
        { workshop: { name: { contains: searchTerm } } },
        { user: { firstName: { contains: searchTerm } } },
        { user: { lastName: { contains: searchTerm } } },
      ];
    }

    const [reports, totalReports] = await prisma.$transaction([
      prisma.report.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc',
        },
        skip: effectiveSkip,
        take: fetchLimit,
        select: {
          id: true,
          reportIdCode: true,
          description: true,
          createdAt: true,
          status: true,
          space: {
            select: {
              name: true,
            },
          },
          equipment: {
            select: {
              name: true,
            },
          },
          workshop: {
            select: {
              name: true,
            },
          },
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.report.count({ where: whereClause }),
    ]);

    // Filter in memory for accent-insensitive search
    let filteredReports = reports;
    if (searchTerm) {
      const normalizedSearch = normalizeText(searchTerm);
      filteredReports = reports.filter(report => {
        const userName = report.user ? `${report.user.firstName} ${report.user.lastName}` : '';
        const searchableText = [
          report.description || '',
          report.space?.name || '',
          report.equipment?.name || '',
          report.workshop?.name || '',
          userName,
        ].join(' ');
        return normalizeText(searchableText).includes(normalizedSearch);
      });
    }

    const formattedReports = filteredReports.map(report => ({
      ...report,
      resource: report.space || report.equipment || report.workshop,
    }));

    return NextResponse.json({
      reports: formattedReports,
      totalReports: searchTerm ? filteredReports.length : totalReports,
      currentPage: page,
      pageSize,
    });
  } catch (error) {
    console.error('Error al obtener los reportes:', error);
    return NextResponse.json({ error: 'No se pudieron obtener los reportes.' }, { status: 500 });
  }
}
