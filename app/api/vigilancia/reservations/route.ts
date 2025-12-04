import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { detectTenant } from '@/lib/tenant/detection';
import { getTenantPrisma } from '@/lib/tenant/prisma';
import { Role } from '@prisma/client';

// GET /api/vigilancia/reservations
// Fetches all approved equipment reservations for the vigilancia dashboard.
export async function GET(request: NextRequest) {
  const tenant = await detectTenant();
  if (!tenant) {
    return NextResponse.json({ error: 'Unauthorized Tenant' }, { status: 401 });
  }
  const prisma = getTenantPrisma(tenant.id);

  const session = await getServerSession();

  // 1. Authorization: Only SUPERUSER and VIGILANCIA can access.
  const allowedRoles = [Role.SUPERUSER, Role.VIGILANCIA];
  if (!session || !allowedRoles.some(role => role === session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // 2. Fetch the specific reservations needed for the dashboard.
    const reservations = await prisma.reservation.findMany({
      where: {
        status: 'APPROVED',
        equipmentId: { not: null }, // Ensures it's an equipment reservation
      },
      include: {
        // Include details needed for the dashboard display
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        equipment: {
          select: { name: true, fixedAssetId: true },
        },
        checkedOutByUser: {
          select: {
            firstName: true,
            lastName: true,
          }
        },
        checkedInByUser: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc', // Show newest requests first
      },
    });

    return NextResponse.json(reservations);

  } catch (error) {
    console.error("Error fetching reservations for vigilancia view:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
