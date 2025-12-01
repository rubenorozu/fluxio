import { prisma } from '@/lib/prisma';
import HomeClient from '@/components/HomeClient';
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
  type: 'space' | 'equipment';
  reservationLeadTime?: number | null;
  isFixedToSpace?: boolean;
  requiresSpaceReservationWithEquipment?: boolean;
  _count?: {
    equipments?: number;
  };
}

export const metadata: Metadata = {
  title: 'Recursos Disponibles | Tu Ceproa',
  description: 'Explora y reserva espacios y equipos disponibles en Tu Ceproa.',
};

export const dynamic = 'force-dynamic'; // Ensure we get fresh data

export default async function Home() {
  // Fetch data directly from DB
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
    }),
  ]);

  // Transform to Resource type and add equipment count
  const resources: Resource[] = [
    ...spaces.map((s) => ({
      ...s,
      images: s.images as Image[],
      type: 'space' as const,
      _count: { equipments: s.equipments.length },
      equipments: undefined, // Remove equipments from final object
    })),
    ...equipment.map((e) => ({ ...e, images: e.images as Image[], type: 'equipment' as const })),
  ];

  return <HomeClient initialResources={resources} />;
}
