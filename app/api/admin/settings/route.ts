import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Keep global prisma for types if needed, but use tenant prisma for logic
import { getServerSession } from '@/lib/auth';
import { Role } from '@prisma/client';
import { detectTenant } from '@/lib/tenant/detection';
import { getTenantPrisma } from '@/lib/tenant/prisma';

export async function GET() {
  try {
    const tenant = await detectTenant();
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }
    const prisma = getTenantPrisma(tenant.id);

    // Fetch SystemSettings (legacy) and TenantConfig
    const [settings, config] = await Promise.all([
      prisma.systemSettings.findMany(),
      prisma.tenantConfig.findUnique({ where: { tenantId: tenant.id } })
    ]);

    const settingsMap: Record<string, string> = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value;
    });

    return NextResponse.json({
      ...settingsMap,
      ...config, // Merge tenant config into response
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Error al cargar la configuración.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session || session.user.role !== Role.SUPERUSER) {
    return NextResponse.json({ error: 'Acceso denegado.' }, { status: 403 });
  }

  const tenant = await detectTenant();
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }
  const prisma = getTenantPrisma(tenant.id);

  console.log('Updating settings for tenant:', tenant.id);

  try {
    const {
      extraordinaryInscriptionLimit,
      reservationLeadTime,
      siteName,
      contactEmail,
      allowedDomains,
      privacyPolicy,
      howItWorks,
      topLogoUrl,
      topLogoHeight, // New field
      bottomLogoUrl,
      faviconUrl,
      primaryColor,
      secondaryColor,
      tertiaryColor,
      inscriptionDefaultColor,
      inscriptionPendingColor,
      inscriptionApprovedColor,
      pdfTopLogoUrl,
      pdfBottomLogoUrl,
      regulationsUrl,
      attachmentFormUrl
    } = await request.json(); // Corrected from req.json() to request.json()

    // Update System Settings (Global)
    if (extraordinaryInscriptionLimit !== undefined) { // Kept original !== undefined check
      await prisma.systemSettings.upsert({
        where: { key: 'extraordinaryInscriptionLimit' },
        update: { value: extraordinaryInscriptionLimit.toString() },
        create: { key: 'extraordinaryInscriptionLimit', value: extraordinaryInscriptionLimit.toString() },
      });
    }

    if (reservationLeadTime !== undefined) { // Kept original !== undefined check
      await prisma.systemSettings.upsert({
        where: { key: 'reservationLeadTime' },
        update: { value: reservationLeadTime.toString() },
        create: { key: 'reservationLeadTime', value: reservationLeadTime.toString() },
      });
    }

    // Helper to safely parse int
    const parseHeight = (val: any) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') return parseInt(val, 10);
      return 50;
    };

    // Update Tenant Config
    await prisma.tenantConfig.upsert({
      where: { tenantId: tenant.id },
      update: {
        siteName,
        contactEmail,
        allowedDomains,
        privacyPolicy,
        howItWorks,
        topLogoUrl,
        topLogoHeight: parseHeight(topLogoHeight), // Safe parse
        bottomLogoUrl,
        faviconUrl,
        primaryColor,
        secondaryColor,
        tertiaryColor,
        inscriptionDefaultColor,
        inscriptionPendingColor,
        inscriptionApprovedColor,
        pdfTopLogoUrl,
        pdfBottomLogoUrl,
        regulationsUrl,
        attachmentFormUrl
      },
      create: {
        tenantId: tenant.id,
        siteName,
        contactEmail,
        allowedDomains,
        privacyPolicy,
        howItWorks,
        topLogoUrl,
        topLogoHeight: parseHeight(topLogoHeight),
        bottomLogoUrl,
        faviconUrl,
        primaryColor,
        secondaryColor,
        tertiaryColor,
        inscriptionDefaultColor,
        inscriptionPendingColor,
        inscriptionApprovedColor,
        pdfTopLogoUrl,
        pdfBottomLogoUrl,
        regulationsUrl,
        attachmentFormUrl
      }
    });

    return NextResponse.json({ message: 'Configuración actualizada correctamente.' });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'No se pudo actualizar la configuración.' }, { status: 500 });
  }
}
