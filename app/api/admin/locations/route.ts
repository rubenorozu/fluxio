import { Role } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { detectTenant } from '@/lib/tenant/detection';
import { getTenantPrisma } from '@/lib/tenant/prisma';

// GET: Listar todas las ubicaciones
export async function GET(request: Request) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
  }

  const userRole = session.user.role;

  if (userRole !== Role.SUPERUSER && userRole !== Role.ADMIN_RESOURCE && userRole !== Role.ADMIN_RESERVATION) {
    return NextResponse.json({ error: 'Acceso denegado.' }, { status: 403 });
  }

  const tenant = await detectTenant();
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }
  const prisma = getTenantPrisma(tenant.id);

  try {
    const locations = await prisma.location.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(locations, { status: 200 });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json({ message: 'Something went wrong while fetching locations' }, { status: 500 });
  }
}

// POST: Crear nueva ubicación
export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session || (session.user.role !== Role.SUPERUSER && session.user.role !== Role.ADMIN_RESOURCE)) {
    return NextResponse.json({ error: 'Acceso denegado. Se requieren privilegios de Superusuario o Administrador de Recursos.' }, { status: 403 });
  }

  const tenant = await detectTenant();
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }
  const prisma = getTenantPrisma(tenant.id);

  try {
    const body = await request.json();
    const { name, zone, description } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'El nombre de la ubicación es obligatorio.' }, { status: 400 });
    }

    const newLocation = await prisma.location.create({
      data: {
        name: name.trim(),
        zone: zone ? zone.trim() : null,
        description: description ? description.trim() : null,
        tenantId: tenant.id,
      },
    });

    return NextResponse.json(newLocation, { status: 201 });
  } catch (error) {
    console.error('Error creando ubicación:', error);
    return NextResponse.json({ error: 'No se pudo crear la ubicación.' }, { status: 500 });
  }
}
