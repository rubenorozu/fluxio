'use client';

import { useState, useEffect } from 'react';
import Hero from '@/components/Hero';
import Carousel from '@/components/Carousel';
import { Spinner, Form } from 'react-bootstrap';
import { useCart } from '@/context/CartContext';
import SpaceConfigModal from '@/components/SpaceConfigModal';
import { shuffleArray } from '@/lib/utils';

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

interface HomeClientProps {
    initialResources: Resource[];
    howItWorks?: string | null;
    siteName?: string | null;
}

export default function HomeClient({ initialResources, howItWorks, siteName }: HomeClientProps) {
    const { addToCart } = useCart();
    const [allResources, setAllResources] = useState<Resource[]>(initialResources);
    const [filter, setFilter] = useState<'all' | 'space' | 'equipment' | 'workshop'>('all');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false); // Changed initial loading to false as we have data
    const [showSpaceConfigModal, setShowSpaceConfigModal] = useState(false);
    const [configuringSpaceId, setConfiguringSpaceId] = useState<string | null>(null);
    const [configuringSpaceName, setConfiguringSpaceName] = useState<string | null>(null);
    const [spaceEquipment, setSpaceEquipment] = useState<Resource[]>([]);
    const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
    const [isSingleSelection, setIsSingleSelection] = useState(false);

    // Parse howItWorks steps or use default
    const steps = howItWorks
        ? JSON.parse(howItWorks)
        : [
            { title: "Paso 1", description: "Explora los recursos disponibles." },
            { title: "Paso 2", description: "Selecciona el espacio o equipo que necesitas." },
            { title: "Paso 3", description: "Configura tu reserva y añádela al carrito." },
            { title: "Paso 4", description: "Confirma tu solicitud y espera la aprobación." }
        ];

    // Effect to shuffle resources on mount only if needed, or we can rely on server shuffle
    useEffect(() => {
        // Optional: Shuffle on client mount if we want random order every refresh
        // setAllResources(shuffleArray(initialResources));
        // For now, let's trust the server order or shuffle here once
        setAllResources(shuffleArray(initialResources));
    }, [initialResources]);

    const handleConfigureSpace = async (spaceId: string) => {
        const space = allResources.find(r => r.id === spaceId && r.type === 'space');
        if (!space) return;

        setConfiguringSpaceId(spaceId);
        setConfiguringSpaceName(space.name);
        setIsSingleSelection(!space.requiresSpaceReservationWithEquipment);
        setLoading(true);
        try {
            const res = await fetch(`/api/spaces/${spaceId}/equipment`);
            if (!res.ok) {
                throw new Error('Error al cargar equipos del espacio.');
            }
            const equipmentData: Resource[] = await res.json();
            setSpaceEquipment(equipmentData);

            // Pre-select fixed equipment ONLY if the space requires reservation with equipment (container spaces like computer labs)
            // For spaces with optional equipment (like TV studio), start with nothing selected
            if (space.requiresSpaceReservationWithEquipment) {
                setSelectedEquipment(equipmentData.filter(eq => eq.isFixedToSpace).map(eq => eq.id));
            } else {
                setSelectedEquipment([]); // Start with nothing selected for optional equipment
            }

            setShowSpaceConfigModal(true);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Error al cargar equipos del espacio.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseSpaceConfigModal = () => {
        setShowSpaceConfigModal(false);
        setConfiguringSpaceId(null);
        setConfiguringSpaceName(null);
        setSpaceEquipment([]);
        setSelectedEquipment([]);
    };

    const handleToggleEquipmentSelection = (equipmentId: string) => {
        if (isSingleSelection) {
            setSelectedEquipment([equipmentId]);
        } else {
            setSelectedEquipment(prev =>
                prev.includes(equipmentId) ? prev.filter(id => id !== equipmentId) : [...prev, equipmentId]
            );
        }
    };

    const handleAddSpaceAndEquipmentToCart = () => {
        if (!configuringSpaceId) return;

        const space = allResources.find(r => r.id === configuringSpaceId && r.type === 'space');



        // If space does NOT require equipment (optional equipment), add the space itself
        // If space REQUIRES equipment (like computer labs), only add the selected equipment
        if (space && !space.requiresSpaceReservationWithEquipment) {

            addToCart(space);
        }

        // Add selected equipment
        spaceEquipment.forEach(eq => {
            if (selectedEquipment.includes(eq.id)) {

                addToCart(eq);
            }
        });

        handleCloseSpaceConfigModal();
    };

    const filteredResources = allResources.filter(resource => {
        if (filter === 'all') return true;
        return resource.type === filter;
    });

    return (
        <div className="pt-5 mt-4">
            <div className="container">
                <Hero siteName={siteName} />

                <div className="mt-4">
                    <div className="d-flex flex-column flex-md-row justify-content-center justify-content-md-between align-items-center mb-3">
                        <h2 className="text-primary mb-2 mb-md-0">Recursos disponibles</h2>
                        <div className="btn-group">
                            <button className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setFilter('all')}>Todos</button>
                            <button className={`btn ${filter === 'space' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setFilter('space')}>Espacios</button>
                            <button className={`btn ${filter === 'equipment' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setFilter('equipment')}>Equipos</button>
                        </div>
                    </div>

                    <Carousel resources={filteredResources} onConfigureSpace={handleConfigureSpace} />
                </div>

                <SpaceConfigModal
                    show={showSpaceConfigModal}
                    onHide={handleCloseSpaceConfigModal}
                    spaceName={configuringSpaceName}
                    loading={loading}
                    spaceEquipment={spaceEquipment}
                    selectedEquipment={selectedEquipment}
                    onToggleEquipment={handleToggleEquipmentSelection}
                    onAddToCart={handleAddSpaceAndEquipmentToCart}
                />
            </div>
        </div>
    );
}
