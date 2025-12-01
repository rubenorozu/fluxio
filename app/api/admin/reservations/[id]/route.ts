import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { status } = await req.json();

    if (!status) {
      return NextResponse.json({ message: 'Status is required' }, { status: 400 });
    }

    const updatedReservation = await prisma.reservation.update({
      where: { id },
      data: { status },
      include: {
        user: true, // Include user to get their email
      },
    });

    // Create on-site notification
    await prisma.notification.create({
      data: {
        recipientId: updatedReservation.userId,
        message: `Tu solicitud de reserva ha sido ${status.toLowerCase()}`,
      },
    });

    // Simulate sending an email


    return NextResponse.json(updatedReservation);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Something went wrong' }, { status: 500 });
  }
}
