import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { detectTenant } from '@/lib/tenant/detection';
import { getTenantPrisma } from '@/lib/tenant/prisma';
import { normalizeText } from '@/lib/search-utils';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const userRole = req.headers.get('x-user-role');

    // Only SUPERUSER or ADMIN_RESOURCE should be able to fetch users for assignment
    if (userRole !== 'SUPERUSER' && userRole !== 'ADMIN_RESOURCE') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const tenant = await detectTenant();
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }
    const prisma = getTenantPrisma(tenant.id);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

    const whereClause: Prisma.UserWhereInput = {};

    // When searching, we'll fetch more results and filter in memory for accent-insensitive search
    const fetchLimit = search ? 1000 : pageSize;
    const skip = search ? 0 : (page - 1) * pageSize;

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        displayId: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        identifier: true,
        isVerified: true,
        createdAt: true,
      },
      orderBy: { firstName: 'asc' },
      skip,
      take: fetchLimit,
    });

    // Filter in memory for accent-insensitive search
    let filteredUsers = users;
    if (search) {
      const normalizedSearch = normalizeText(search);
      filteredUsers = users.filter(user => {
        const searchableText = [
          user.firstName || '',
          user.lastName || '',
          user.email || '',
          user.identifier || '',
          user.displayId || '',
        ].join(' ');
        return normalizeText(searchableText).includes(normalizedSearch);
      });
    }

    const totalUsers = search ? filteredUsers.length : await prisma.user.count({ where: whereClause });

    const safeUsers = filteredUsers.map(user => ({
      id: user.id,
      displayId: user.displayId,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      identifier: user.identifier,
      isVerified: user.isVerified,
      createdAt: user.createdAt.toISOString(),
    }));

    return NextResponse.json({ users: safeUsers, totalUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}