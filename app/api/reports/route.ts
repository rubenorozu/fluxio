import { NextResponse } from 'next/server';
import { detectTenant } from '@/lib/tenant/detection';
import { getTenantPrisma } from '@/lib/tenant/prisma';
import { getServerSession } from '@/lib/auth';

export async function POST(request: Request) {
  const tenant = await detectTenant();
  if (!tenant) {
    return NextResponse.json({ error: 'Unauthorized Tenant' }, { status: 401 });
  }
  const prisma = getTenantPrisma(tenant.id);

  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { description, resourceId, resourceType, userId } = await request.json();

    if (!description || !resourceId || !resourceType || !userId) {
      return NextResponse.json({ error: 'Faltan datos en la solicitud' }, { status: 400 });
    }

    if (session.user.id !== userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Generate reportIdCode
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const datePart = `${year}${month}${day}`;

    // Fetch user's last name from the database
    const reportingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { lastName: true },
    });

    const userLastName = reportingUser?.lastName?.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) || 'UNKNOWN';

    // Get and increment daily report counter
    const reportCounter = await prisma.reportCounter.upsert({
      where: {
        date_tenantId: {
          date: datePart,
          tenantId: tenant.id
        }
      },
      update: { lastNumber: { increment: 1 } },
      create: { date: datePart, lastNumber: 1, tenantId: tenant.id },
    });

    const sequenceNumber = reportCounter.lastNumber.toString().padStart(4, '0');

    const reportIdCode = `RP_${datePart}_${userLastName}_${sequenceNumber}`;

    let data: any = {
      description,
      userId,
      reportIdCode, // Add the generated code
    };

    if (resourceType === 'space') {
      data.spaceId = resourceId;
    } else if (resourceType === 'equipment') {
      data.equipmentId = resourceId;
    } else if (resourceType === 'workshop') {
      data.workshopId = resourceId;
    } else {
      return NextResponse.json({ error: 'Tipo de recurso inválido' }, { status: 400 });
    }

    const report = await prisma.report.create({ data });

    // Create notifications for admins/responsible users
    try {
      let responsibleUserIds: string[] = [];
      let resourceName = 'un recurso';

      if (resourceType === 'space') {
        const space = await prisma.space.findUnique({
          where: { id: resourceId },
          select: { responsibleUsers: { select: { id: true } }, name: true }
        });
        responsibleUserIds = (space as any)?.responsibleUsers.map((u: any) => u.id) || [];
        resourceName = space?.name || resourceName;
      } else if (resourceType === 'equipment') {
        const equipment = await prisma.equipment.findUnique({
          where: { id: resourceId },
          select: { responsibleUsers: { select: { id: true } }, name: true }
        });
        responsibleUserIds = (equipment as any)?.responsibleUsers.map((u: any) => u.id) || [];
        resourceName = equipment?.name || resourceName;
      } else if (resourceType === 'workshop') {
        const workshop = await prisma.workshop.findUnique({
          where: { id: resourceId },
          select: { responsibleUsers: { select: { id: true } }, name: true }
        });
        responsibleUserIds = (workshop as any)?.responsibleUsers.map((u: any) => u.id) || [];
        resourceName = workshop?.name || resourceName;
      }

      for (const responsibleUserId of responsibleUserIds) {
        await prisma.notification.create({
          data: {
            recipientId: responsibleUserId,
            message: `Nuevo reporte de problema para tu recurso: ${resourceName}`,
          },
        });
      }

      // Also notify Superusers
      const superusers = await prisma.user.findMany({
        where: { role: 'SUPERUSER', tenantId: tenant.id },
        select: { id: true }
      });

      for (const superuser of superusers) {
        if (!responsibleUserIds.includes(superuser.id)) { // Avoid duplicate notification
          await prisma.notification.create({
            data: {
              recipientId: superuser.id,
              message: `Nuevo reporte de problema registrado: ${resourceName}`,
            },
          });
        }
      }
    } catch (notifyError) {
      console.error('Error creating admin notifications for report:', notifyError);
    }

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('Error al crear el reporte:', error);
    return NextResponse.json({ error: 'No se pudo crear el reporte.' }, { status: 500 });
  }
}