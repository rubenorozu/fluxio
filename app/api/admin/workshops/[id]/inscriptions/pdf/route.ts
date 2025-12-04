import { NextResponse } from 'next/server';
import { detectTenant } from '@/lib/tenant/detection';
import { getTenantPrisma } from '@/lib/tenant/prisma';
import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

interface Params {
  params: { id: string };
}

export async function GET(request: Request, { params }: Params) {
  // Auth check - support both cookies and query param token
  const { searchParams } = new URL(request.url);
  const cookieStore = cookies();
  let token = cookieStore.get('session')?.value;

  const queryToken = searchParams.get('token');
  if (queryToken) token = queryToken;

  if (!token) {
    return NextResponse.json({ error: 'Acceso denegado. No se encontró la sesión.' }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload || (payload.role !== 'SUPERUSER' && payload.role !== 'ADMIN_RESOURCE')) {
    return NextResponse.json({ error: 'Acceso denegado.' }, { status: 403 });
  }

  const tenant = await detectTenant();
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }
  const prisma = getTenantPrisma(tenant.id);

  try {
    const { id } = params;

    const workshop = await prisma.workshop.findUnique({
      where: { id },
      include: {
        responsibleUser: { select: { firstName: true, lastName: true } },
        sessions: true,
        inscriptions: {
          where: { status: 'APPROVED' },
          include: {
            user: { select: { firstName: true, lastName: true, email: true, identifier: true } },
          },
          orderBy: {
            user: { lastName: 'asc' },
          },
        },
      },
    });

    if (!workshop) {
      return NextResponse.json({ error: 'Taller no encontrado.' }, { status: 404 });
    }

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Cargar Logos
    const fluxioLogo2Bytes = await fs.readFile(path.join(process.cwd(), 'public/assets/FluxioRSV2.png'));
    const fluxioLogoBytes = await fs.readFile(path.join(process.cwd(), 'public/assets/FluxioRSV.png'));
    const fluxioLogo2 = await pdfDoc.embedPng(fluxioLogo2Bytes);
    const fluxioLogo = await pdfDoc.embedPng(fluxioLogoBytes);
    const fluxioLogo2Dims = fluxioLogo2.scale(0.25 * 0.6);
    const fluxioLogoDims = fluxioLogo.scale(0.25 * 0.4);

    const tableLeft = 50;
    const tableRight = 792 - 50;
    const rowHeight = 18;
    const footerStartY = 100;
    const tableBottom = footerStartY + rowHeight;

    // --- Helper function to draw page elements ---
    const drawPageElements = (page: PDFPage) => {
      const { width, height } = page.getSize();
      const tableTop = height - 120;
      // --- Encabezado ---
      page.drawImage(fluxioLogo2, { x: 50, y: height - 60, width: fluxioLogo2Dims.width, height: fluxioLogo2Dims.height });

      const teacherName = workshop.teacher || (workshop.responsibleUser ? `${workshop.responsibleUser.firstName} ${workshop.responsibleUser.lastName}` : 'N/A');
      const teacherText = `MAESTRO/A: ${teacherName}`.toUpperCase();
      const teacherTextWidth = boldFont.widthOfTextAtSize(teacherText, 10);
      page.drawText(teacherText, {
        x: width - 50 - teacherTextWidth,
        y: height - 55,
        font: boldFont,
        size: 10,
      });

      page.drawLine({ start: { x: 50, y: height - 70 }, end: { x: width - 50, y: height - 70 }, thickness: 2, color: rgb(0.01, 0.47, 0.75) });

      page.drawText(`Taller: ${workshop.name}`, {
        x: 50,
        y: height - 90,
        font: boldFont,
        size: 14,
      });

      // --- Pie de Página ---
      page.drawImage(fluxioLogo, {
        x: width - 50 - fluxioLogoDims.width,
        y: height - 60,
        width: fluxioLogoDims.width,
        height: fluxioLogoDims.height
      });

      // --- Formatted Schedule ---
      const scheduleText = workshop.sessions.length > 0
        ? workshop.sessions.reduce((acc, session) => {
          const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
          const day = dayNames[session.dayOfWeek];
          const time = `${session.timeStart} - ${session.timeEnd}`;
          if (!acc[time]) {
            acc[time] = { days: [], room: session.room };
          }
          acc[time].days.push(day);
          return acc;
        }, {} as Record<string, { days: string[], room: string | null }>)
        : {};

      let scheduleY = 60;
      Object.entries(scheduleText).forEach(([time, { days, room }]) => {
        const daysString = days.join(', ');
        const roomString = room ? ` (Salón: ${room})` : '';
        page.drawText(`${daysString} de ${time}${roomString}`, { x: 50, y: scheduleY, font: font, size: 9 });
        scheduleY -= 12;
      });

      page.drawText('HORARIO', { x: 50, y: 80, font: boldFont, size: 10 });
      page.drawLine({ start: { x: 50, y: 75 }, end: { x: width - 50 - fluxioLogoDims.width - 10, y: 75 }, thickness: 0.5 });

      // Draw table header and grid
      const headerY = tableTop - 13;
      page.drawText('No.', { x: tableLeft + 5, y: headerY, font: boldFont, size: 10 });
      page.drawText('ALUMNO', { x: tableLeft + 40, y: headerY, font: boldFont, size: 10 });
      page.drawText('MATRÍCULA', { x: 350, y: headerY, font: boldFont, size: 10 });
      const headerLineY = tableTop - rowHeight;
      page.drawLine({ start: { x: tableLeft, y: headerLineY }, end: { x: tableRight, y: headerLineY }, thickness: 1 });

      // Table container and vertical lines
      page.drawRectangle({
        x: tableLeft,
        y: tableBottom,
        width: tableRight - tableLeft,
        height: tableTop - tableBottom,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });
      page.drawLine({ start: { x: tableLeft + 30, y: tableTop }, end: { x: tableLeft + 30, y: tableBottom }, thickness: 0.5 });
      page.drawLine({ start: { x: 340, y: tableTop }, end: { x: 340, y: tableBottom }, thickness: 0.5 });

      // Attendance lines
      const attendanceStart = 440;
      const attendanceColWidth = 20;
      for (let i = 0; i < 15; i++) {
        const x = attendanceStart + (i * attendanceColWidth);
        if (x > tableRight) break;
        page.drawLine({ start: { x, y: tableTop }, end: { x, y: tableBottom }, thickness: 0.5 });
      }
    };

    let page = pdfDoc.addPage([792, 612]); // Landscape
    drawPageElements(page);

    // --- Tabla de Inscritos ---
    const tableTop = page.getHeight() - 120;
    let inscriptionIndex = 0;
    const numberOfRows = 20; // Approx rows per page

    do {
      for (let i = 0; i < numberOfRows; i++) {
        const yPos = tableTop - rowHeight - (i * rowHeight);
        if (yPos < tableBottom) break;

        const inscription = workshop.inscriptions[inscriptionIndex];
        if (inscription) {
          const matricula = inscription.user.identifier || inscription.user.email.split('@')[0];
          const fullName = `${inscription.user.lastName}, ${inscription.user.firstName}`;

          page.drawText(`${inscriptionIndex + 1}`, { x: tableLeft + 5, y: yPos - 12, font: font, size: 9 });
          page.drawText(fullName.toUpperCase(), { x: tableLeft + 40, y: yPos - 12, font: font, size: 9 });
          page.drawText(matricula, { x: 350, y: yPos - 12, font: font, size: 9 });
        }

        const lineY = tableTop - rowHeight - ((i + 1) * rowHeight);
        if (lineY >= tableBottom) {
          page.drawLine({ start: { x: tableLeft, y: lineY }, end: { x: tableRight, y: lineY }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
        }
        if (inscription) {
          inscriptionIndex++;
        }
      }

      if (inscriptionIndex < workshop.inscriptions.length) {
        page = pdfDoc.addPage([792, 612]);
        drawPageElements(page);
      }
    } while (inscriptionIndex < workshop.inscriptions.length);


    const pdfBytes = await pdfDoc.save();

    const asciiName = workshop.name.replace(/\s/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return new Response(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Inscritos_${asciiName}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Error al generar el PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
    return NextResponse.json({ error: `No se pudo generar el PDF: ${errorMessage}` }, { status: 500 });
  }
}