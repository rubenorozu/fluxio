import { getTenantPrisma } from '@/lib/tenant/prisma';
import { detectTenant } from '@/lib/tenant/detection';
import { getServerSession } from '@/lib/auth';
import HomeClient from '@/components/HomeClient';
import PlatformLandingPage from '@/app/platform-landing/page';
import { Metadata } from 'next';

// Define types locally if not available from a shared type file, or reuse from HomeClient if exported
interface Image {
  id: string;
  url: string;
}

interface Resource {
  id: string;
  name: string;
  description?: string | null;
  images: Image[];
  type: 'space' | 'equipment' | 'workshop';
  reservationLeadTime?: number | null;
  isFixedToSpace?: boolean;
  requiresSpaceReservationWithEquipment?: boolean;
  inscriptionsStartDate?: string | null;
  inscriptionsOpen?: boolean;
  capacity?: number;
  _count?: {
    equipments?: number;
    inscriptions?: number;
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await detectTenant();
  const siteName = tenant?.config?.siteName || 'Fluxio RSV';
  return {
    title: `Recursos Disponibles | ${siteName}`,
    description: `Explora y reserva espacios y equipos disponibles en ${siteName}.`,
  };
}

export const dynamic = 'force-dynamic'; // Ensure we get fresh data

export default async function Home() {
  console.log('Home page rendering...');
  // Detect tenant
  const tenant = await detectTenant();

  // If no tenant detected (localhost without subdomain), show landing page
  if (!tenant) {
    return <PlatformLandingPage />;
  }

  // Check if user is logged in and validate tenant
  const session = await getServerSession({
    validateTenant: true,
    currentTenantId: tenant.id
  });

  // If default or platform tenant WITHOUT session, show landing
  // If user is logged in, show resources carousel
  if ((tenant.slug === 'default' || tenant.slug === 'platform') && !session) {
    return <PlatformLandingPage />;
  }

  const prisma = getTenantPrisma(tenant.id);

  // Get carousel resource limit from config (default to 15)
  const resourceLimit = tenant.config?.carouselResourceLimit || 15;

  // Fetch data directly from DB using tenant-aware prisma
  // OPTIMIZATION: Limit resources to avoid loading hundreds of items
  const [spaces, equipment] = await Promise.all([
    prisma.space.findMany({
      where: {
        status: 'AVAILABLE', // Only show available spaces
      },
      select: {
        id: true,
        name: true,
        description: true,
        images: true,
        reservationLeadTime: true,
        requiresSpaceReservationWithEquipment: true,
        equipments: {
          where: {
            status: 'AVAILABLE',
          },
          select: {
            id: true,
          },
        },
      },
      take: resourceLimit,
      orderBy: {
        createdAt: 'desc', // Show newest first
      },
    }),
    prisma.equipment.findMany({
      where: {
        isFixedToSpace: false, // Only show equipment that can be reserved independently
        status: 'AVAILABLE', // Only show available equipment
      },
      select: {
        id: true,
        name: true,
        description: true,
        images: true,
        reservationLeadTime: true,
        isFixedToSpace: true,
      },
      take: resourceLimit,
      orderBy: {
        createdAt: 'desc', // Show newest first
      },
    }),
  ]);

  // Transform to Resource type and add equipment count
  const resources: Resource[] = [
    ...(spaces as any[]).map((s) => ({
      ...s,
      images: s.images as Image[],
      type: 'space' as const,
      _count: { equipments: s.equipments?.length || 0 },
      equipments: undefined, // Remove equipments from final object
    })),
    ...(equipment as any[]).map((e) => ({ ...e, images: e.images as Image[], type: 'equipment' as const })),
  ];

  return <HomeClient initialResources={resources} howItWorks={tenant.config?.howItWorks} siteName={tenant.config?.siteName || 'Fluxio RSV'} />;
}
