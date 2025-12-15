import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // We use global prisma for transaction, but manually handle tenantId
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { detectTenant } from '@/lib/tenant/detection';
import { generateDisplayId } from '@/lib/displayId';
import { DEFAULT_FORM_CONFIG, isFieldRequired } from '@/lib/reservation-form-utils';

export const dynamic = 'force-dynamic';

interface UserPayload {
  userId: string;
  role: string;
  iat: number;
  exp: number;
}

export async function GET(req: Request) {
  const tenant = await detectTenant();
  if (!tenant) {
    return NextResponse.json({ message: 'Unauthorized Tenant' }, { status: 401 });
  }

  const cookieStore = cookies();
  const tokenCookie = cookieStore.get('session');

  if (!tokenCookie) {
    return NextResponse.json({ message: 'No autenticado.' }, { status: 401 });
  }

  let userId: string;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify<UserPayload>(tokenCookie.value, secret);
    userId = payload.userId;
  } catch (err) {
    return NextResponse.json({ message: 'La sesión no es válida.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  const where: any = {
    userId,
    tenantId: tenant.id // Ensure we only fetch for this tenant
  };

  if (start && end) {
    where.startTime = { gte: new Date(start) };
    where.endTime = { lte: new Date(end) };
  }

  try {
    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        space: {
          select: { name: true }
        },
        equipment: {
          select: { name: true }
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(reservations);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const tenant = await detectTenant();
  if (!tenant) {
    return NextResponse.json({ message: 'Unauthorized Tenant' }, { status: 401 });
  }

  const cookieStore = cookies();
  const tokenCookie = cookieStore.get('session');

  if (!tokenCookie) {
    return NextResponse.json({ message: 'No autenticado.' }, { status: 401 });
  }

  let userId: string;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify<UserPayload>(tokenCookie.value, secret);
    userId = payload.userId;
  } catch (err) {
    return NextResponse.json({ message: 'La sesión no es válida.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { items, startTime, endTime, justification, subject, coordinator, teacher, ...otherFields } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ message: 'El carrito está vacío.' }, { status: 400 });
    }

    if (!startTime || !endTime) {
      return NextResponse.json({ message: 'Las fechas son obligatorias.' }, { status: 400 });
    }

    // Obtener configuración del tenant
    const tenantConfig = await prisma.tenantConfig.findUnique({
      where: { tenantId: tenant.id },
      select: { reservationFormConfig: true }
    });

    // Typesafe cast for json
    const formConfig = (tenantConfig?.reservationFormConfig || DEFAULT_FORM_CONFIG) as any;

    // Validar campos requeridos dinámicamente
    // Si formConfig tiene campos marcados como required, debemos asegurar que vengan
    // Si la BD requiere justification pero el config no (raro), ponemos un default

    // Lista de campos que sabemos manejar explícitamente y mapear al modelo Prisma
    // Otros campos dinámicos (si hubiera futuramente) se manejarían diferente

    // Verificamos si los campos 'core' son requeridos en la configuración
    const isSubjectReq = isFieldRequired('subject', formConfig);
    const isTeacherReq = isFieldRequired('teacher', formConfig);
    const isCoordinatorReq = isFieldRequired('coordinator', formConfig);
    const isJustificationReq = isFieldRequired('justification', formConfig);

    const missingFields = [];
    if (isSubjectReq && !subject) missingFields.push('Área');
    if (isTeacherReq && !teacher) missingFields.push('Proyecto');
    if (isCoordinatorReq && !coordinator) missingFields.push('Supervisor');
    if (isJustificationReq && !justification) missingFields.push('Justificación');

    if (missingFields.length > 0) {
      return NextResponse.json({
        message: `Faltan campos requeridos: ${missingFields.join(', ')}`
      }, { status: 400 });
    }

    const createdReservations = await prisma.$transaction(async (tx) => {
      // Pass tenantId to generateDisplayId
      const displayId = await generateDisplayId(tx, userId, tenant.id);
      const cartSubmissionId = crypto.randomUUID();

      const reservationPromises = items.map((item: { id: string, type: string }) => {
        const data: any = {
          displayId,
          cartSubmissionId,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          // Usar valores del body o defaults seguros si el campo estaba deshabilitado
          justification: justification || 'N/A', // Required in DB
          subject: subject || null,              // Optional in DB
          coordinator: coordinator || null,      // Optional in DB
          teacher: teacher || null,              // Optional in DB
          status: 'PENDING',
          userId: userId,
          tenantId: tenant.id, // Explicitly set tenantId
        };

        if (item.type === 'space') {
          data.spaceId = item.id;
        } else {
          data.equipmentId = item.id;
        }

        return tx.reservation.create({ data });
      });

      return Promise.all(reservationPromises);
    });

    return NextResponse.json(createdReservations, { status: 201 });

  } catch (error) {
    console.error("Error creating user reservation batch:", error);
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
  }
}
