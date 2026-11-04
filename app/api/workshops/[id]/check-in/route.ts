import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { registerAttendance } from '@/lib/workshops/inscriptions';
import { prisma } from '@/lib/prisma';

// GET: Consultar estado de check-in del usuario actual
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ authenticated: false, message: 'Inicia sesión para registrar asistencia.' }, { status: 401 });
  }

  const workshopId = params.id;
  const userId = session.user.id;

  try {
    const workshop = await prisma.workshop.findUnique({
      where: { id: workshopId },
      select: {
        id: true,
        name: true,
        teacher: true,
        room: true,
        startDate: true,
        endDate: true,
      },
    });

    if (!workshop) {
      return NextResponse.json({ error: 'Taller no encontrado.' }, { status: 404 });
    }

    const inscription = await prisma.inscription.findUnique({
      where: {
        workshopId_userId: { workshopId, userId },
      },
      include: {
        user: {
          select: { firstName: true, lastName: true, identifier: true, email: true },
        },
      },
    });

    return NextResponse.json({
      authenticated: true,
      workshop,
      inscription: inscription
        ? {
            id: inscription.id,
            status: inscription.status,
            checkedIn: inscription.checkedIn,
            checkedInAt: inscription.checkedInAt,
            user: inscription.user,
          }
        : null,
    });
  } catch (error: any) {
    console.error('Error al consultar estado de check-in:', error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}

// POST: Registrar asistencia
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json(
      { success: false, authenticated: false, message: 'Debes iniciar sesión con tu cuenta institucional para registrar asistencia.' },
      { status: 401 }
    );
  }

  const workshopId = params.id;
  const userId = session.user.id;

  try {
    const result = await registerAttendance({
      workshopId,
      userId,
    });

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error: any) {
    console.error('Error al registrar asistencia:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'No se pudo registrar la asistencia.' },
      { status: 500 }
    );
  }
}

