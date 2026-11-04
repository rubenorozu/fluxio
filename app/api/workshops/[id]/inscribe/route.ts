import { NextResponse, NextRequest } from 'next/server';
import { detectTenant } from '@/lib/tenant/detection';
import { getServerSession } from '@/lib/auth';
import { inscribeToWorkshop } from '@/lib/workshops/inscriptions';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const tenant = await detectTenant();
  if (!tenant) {
    return NextResponse.json({ error: 'Unauthorized Tenant' }, { status: 401 });
  }

  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ message: 'No autenticado. Inicia sesión para inscribirte.' }, { status: 401 });
  }

  const userId = session.user.id;
  const workshopId = params.id;

  let isExtraordinary = false;
  try {
    const body = await request.json().catch(() => ({}));
    if (body && body.isExtraordinary) {
      isExtraordinary = true;
    }
  } catch {
    // Body optional
  }

  try {
    const result = await inscribeToWorkshop({
      workshopId,
      userId,
      tenantId: tenant.id,
      isExtraordinary,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Error al inscribirse en el taller:', error);
    const message = error.message || 'Algo salió mal al inscribirse en el taller.';
    const isConflict = message.includes('Ya estás');
    const isFull = message.includes('capacidad máxima') || message.includes('lista de espera se encuentra llena');

    return NextResponse.json(
      {
        message,
        error: message,
        limitReached: message.includes('inscripciones activas'),
      },
      { status: isConflict ? 409 : isFull ? 400 : 403 }
    );
  }
}
