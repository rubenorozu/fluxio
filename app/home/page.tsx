import { getTenantPrisma } from '@/lib/tenant/prisma';
import { detectTenant } from '@/lib/tenant/detection';
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
        title: `Inicio | ${siteName}`,
        description: `Explora y reserva espacios y equipos disponibles en ${siteName}.`,
    };
}

export const dynamic = 'force-dynamic'; // Ensure we get fresh data

export default async function HomePage() {
    console.log('Internal Home page rendering...');
    // Detect tenant
    const tenant = await detectTenant();

    if (!tenant) {
        return <div>Organización no encontrada</div>;
    }

    const prisma = getTenantPrisma(tenant.id);

    // Fetch data directly from DB using tenant-aware prisma
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
                isFixedToSpace: true,
                requiresSpaceReservationWithEquipment: true,
                capacity: true,
                _count: {
                    select: {
                        equipments: true,
                    },
                },
            },
        }),
        prisma.equipment.findMany({
            where: {
                status: 'AVAILABLE',
                isFixedToSpace: false,
            },
            select: {
                id: true,
                name: true,
                description: true,
                images: true,
                reservationLeadTime: true,
                isFixedToSpace: true,
                requiresSpaceReservationWithEquipment: true,
            },
        }),
    ]);

    // Combine and format resources
    const initialResources: Resource[] = [
        ...spaces.map((s: any) => ({
            ...s,
            type: 'space' as const,
            images: s.images ? JSON.parse(s.images as string) : [],
        })),
        ...equipment.map((e: any) => ({
            ...e,
            type: 'equipment' as const,
            images: e.images ? JSON.parse(e.images as string) : [],
        })),
    ];

    return (
        <HomeClient
            initialResources={initialResources}
            howItWorks={tenant.config?.howItWorks ?? null}
            siteName={tenant.config?.siteName ?? null}
        />
    );
}
