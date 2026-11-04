import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateQrDataUrl, getWorkshopPublicUrl, getWorkshopCheckInUrl } from '@/lib/workshops/qrcode';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const workshopId = params.id;

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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'public'; // 'public' | 'checkin'

    const targetUrl = type === 'checkin'
      ? getWorkshopCheckInUrl(workshopId)
      : getWorkshopPublicUrl(workshopId);

    const qrDataUrl = await generateQrDataUrl(targetUrl, { width: 400 });

    return NextResponse.json({
      workshop,
      type,
      targetUrl,
      qrDataUrl,
    });
  } catch (error: any) {
    console.error('Error generando QR de taller:', error);
    return NextResponse.json({ error: 'No se pudo generar el código QR.' }, { status: 500 });
  }
}

