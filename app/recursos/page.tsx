import { detectTenant } from '@/lib/tenant/detection';
import { getTenantPrisma } from '@/lib/tenant/prisma';
import ResourcesClient from '@/components/ResourcesClient';

export const dynamic = 'force-dynamic';

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

export default async function ResourcesPage() {
  const tenant = await detectTenant();

  if (!tenant) {
    return <div>Organización no encontrada</div>;
  }

  const prisma = getTenantPrisma(tenant.id);

  // Fetch data directly from DB
  const [spaces, equipment] = await Promise.all([
    prisma.space.findMany({
      where: {
        status: 'AVAILABLE',
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
    }),
    prisma.equipment.findMany({
      where: {
        isFixedToSpace: false,
        status: 'AVAILABLE',
      },
      select: {
        id: true,
        name: true,
        description: true,
        images: true,
        reservationLeadTime: true,
        isFixedToSpace: true,
      },
    }),
  ]);

  // Transform to Resource type
  const resources: Resource[] = [
    ...spaces.map((s) => ({
      ...s,
      images: (s as any).images as Image[],
      type: 'space' as const,
      _count: { equipments: s.equipments.length },
      equipments: undefined,
    })),
    ...equipment.map((e) => ({
      ...e,
      images: e.images as Image[],
      type: 'equipment' as const
    })),
  ];

  return <ResourcesClient initialResources={resources} />;
}