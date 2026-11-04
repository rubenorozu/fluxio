import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { detectTenant } from '@/lib/tenant/detection';
import { inscribeToWorkshop } from '@/lib/workshops/inscriptions';

export async function POST(req: Request) {
  const tenant = await detectTenant();
  if (!tenant) {
    return NextResponse.json({ error: 'Unauthorized Tenant' }, { status: 401 });
  }

  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Debes iniciar sesión para inscribirte.' }, { status: 401 });
  }

  try {
    const { workshopId, isExtraordinary } = await req.json();

    if (!workshopId) {
      return NextResponse.json({ error: 'ID del taller es obligatorio.' }, { status: 400 });
    }

    const result = await inscribeToWorkshop({
      workshopId,
      userId: session.user.id,
      tenantId: tenant.id,
      isExtraordinary: Boolean(isExtraordinary),
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error al crear la inscripción:', error);
    const message = error.message || 'No se pudo procesar la inscripción.';
    const isConflict = message.includes('Ya estás');
    const isFull = message.includes('capacidad máxima') || message.includes('lista de espera se encuentra llena');

    return NextResponse.json(
      {
        error: message,
        limitReached: message.includes('inscripciones activas'),
      },
      { status: isConflict ? 409 : isFull ? 400 : 403 }
    );
  }
}
