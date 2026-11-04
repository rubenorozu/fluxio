import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { cancelInscription } from '@/lib/workshops/inscriptions';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Debes iniciar sesión.' }, { status: 401 });
  }

  try {
    const inscriptionId = params.id;
    const result = await cancelInscription({
      inscriptionId,
      userId: session.user.id,
      isAdmin: false,
    });

    return NextResponse.json(
      { message: 'Inscripción cancelada con éxito.', promoted: result.promotedInscription },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error al cancelar inscripción de usuario:', error);
    return NextResponse.json(
      { error: error.message || 'No se pudo cancelar la inscripción.' },
      { status: 400 }
    );
  }
}

