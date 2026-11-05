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

    // Debug logging
    console.log(`[HOME] Tenant config:`, tenant.config);
    console.log(`[HOME] Carousel limit from config: ${tenant.config?.carouselResourceLimit}`);
    const carouselLimit = tenant.config?.carouselResourceLimit || 15;
    console.log(`[HOME] Carousel limit to use: ${carouselLimit}`);

    // Fetch ALL available resources (without limit) to shuffle them
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
    const parseImages = (imgs: any) => {
        if (Array.isArray(imgs)) return imgs;
        if (typeof imgs === 'string') {
            try { return JSON.parse(imgs); } catch { return []; }
        }
        return [];
    };

    const allResources: Resource[] = [
        ...spaces.map((s: any) => ({
            ...s,
            type: 'space' as const,
            images: parseImages(s.images),
        })),
        ...equipment.map((e: any) => ({
            ...e,
            type: 'equipment' as const,
            images: parseImages(e.images),
        })),
    ];

    // Prioritize resources with photos over those without
    const hasPhoto = (r: Resource) => Array.isArray(r.images) && r.images.length > 0 && Boolean(r.images[0]?.url);
    const withPhotos = allResources.filter(hasPhoto).sort(() => Math.random() - 0.5);
    const withoutPhotos = allResources.filter((r) => !hasPhoto(r)).sort(() => Math.random() - 0.5);

    // Take resources with photos first, fill remainder up to limit with withoutPhotos
    const initialResources = [...withPhotos, ...withoutPhotos].slice(0, carouselLimit);

    // Debug logging
    console.log(`[HOME] Total spaces: ${spaces.length}`);
    console.log(`[HOME] Total equipment: ${equipment.length}`);
    console.log(`[HOME] Total resources before limit: ${allResources.length} (${withPhotos.length} with photos)`);
    console.log(`[HOME] Resources shown in carousel: ${initialResources.length}`);

    return (
        <HomeClient
            initialResources={initialResources}
            howItWorks={tenant.config?.howItWorks ?? null}
            siteName={tenant.config?.siteName ?? null}
        />
    );
}
