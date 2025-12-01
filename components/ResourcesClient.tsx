'use client';

import { useState, useMemo } from 'react';
import ResourceCard from '@/components/ResourceCard';
import { Form, Spinner } from 'react-bootstrap';
import { useCart } from '@/context/CartContext';
import SpaceConfigModal from '@/components/SpaceConfigModal';

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
    _count?: {
        equipments?: number;
    };
}

interface ResourcesClientProps {
    initialResources: Resource[];
}

export default function ResourcesClient({ initialResources }: ResourcesClientProps) {
    const { addToCart } = useCart();
    const [filter, setFilter] = useState<'all' | 'space' | 'equipment'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state
    const [showSpaceConfigModal, setShowSpaceConfigModal] = useState(false);
    const [configuringSpaceId, setConfiguringSpaceId] = useState<string | null>(null);
    const [configuringSpaceName, setConfiguringSpaceName] = useState<string | null>(null);
    const [spaceEquipment, setSpaceEquipment] = useState<Resource[]>([]);
    const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
    const [loadingEquipment, setLoadingEquipment] = useState(false);
    const [error, setError] = useState('');

    // Filter logic
    const filteredResources = useMemo(() => {
        return initialResources.filter(resource => {
            const matchesType = filter === 'all' || resource.type === filter;
            const matchesSearch = searchTerm === '' ||
                resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (resource.description && resource.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                resource.id.toLowerCase().includes(searchTerm.toLowerCase());

            return matchesType && matchesSearch;
        });
    }, [initialResources, filter, searchTerm]);

    const handleConfigureSpace = async (spaceId: string) => {
        const space = initialResources.find(r => r.id === spaceId && r.type === 'space');
        if (!space) return;

        setConfiguringSpaceId(spaceId);
        setConfiguringSpaceName(space.name);
        setLoadingEquipment(true);

        try {
            const res = await fetch(`/api/spaces/${spaceId}/equipment`);
            if (!res.ok) throw new Error('Error al cargar equipos');

            const equipmentData: Resource[] = await res.json();
            setSpaceEquipment(equipmentData);

            // Logic for pre-selection
            if (space.requiresSpaceReservationWithEquipment) {
                setSelectedEquipment(equipmentData.filter(eq => eq.isFixedToSpace).map(eq => eq.id));
            } else {
                setSelectedEquipment([]);
            }

            setShowSpaceConfigModal(true);
        } catch (err) {
            setError('Error al cargar equipos del espacio.');
        } finally {
            setLoadingEquipment(false);
        }
    };

    const handleCloseModal = () => {
        setShowSpaceConfigModal(false);
        setConfiguringSpaceId(null);
        setConfiguringSpaceName(null);
        setSpaceEquipment([]);
        setSelectedEquipment([]);
    };

    const handleToggleEquipment = (equipmentId: string) => {
        setSelectedEquipment(prev =>
            prev.includes(equipmentId) ? prev.filter(id => id !== equipmentId) : [...prev, equipmentId]
        );
    };

    const handleAddToCart = () => {
        if (!configuringSpaceId) return;
        const space = initialResources.find(r => r.id === configuringSpaceId);

        if (space && !space.requiresSpaceReservationWithEquipment) {
            addToCart(space);
        }

        spaceEquipment.forEach(eq => {
            if (selectedEquipment.includes(eq.id)) {
                addToCart(eq);
            }
        });

        handleCloseModal();
    };

    return (
        <div className="container" style={{ paddingTop: '80px' }}>
            <div className="d-flex flex-column flex-md-row justify-content-md-between align-items-md-center mb-4">
                <h2 style={{ color: '#0076A8' }} className="mb-3 mb-md-0 text-center text-md-start w-100 w-md-auto">Recursos Disponibles</h2>
                <div className="d-flex flex-column flex-md-row align-items-center w-100 w-md-auto">
                    <Form.Control
                        type="text"
                        placeholder="Buscar recursos por nombre, descripción o ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%' }}
                        className="mb-3 mb-md-0 me-md-3"
                    />
                    <div className="btn-group w-100 w-md-auto">
                        <button className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setFilter('all')}>Todos</button>
                        <button className={`btn ${filter === 'space' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setFilter('space')}>Espacios</button>
                        <button className={`btn ${filter === 'equipment' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setFilter('equipment')}>Equipos</button>
                    </div>
                </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}
            <hr />

            <div className="row mx-auto">
                {filteredResources.length > 0 ? (
                    filteredResources.map(resource => (
                        <div className="col-5-per-row mb-2" key={resource.id}>
                            <ResourceCard resource={resource} type={resource.type} onConfigureSpace={handleConfigureSpace} />
                        </div>
                    ))
                ) : (
                    <p>No hay recursos que coincidan con el filtro.</p>
                )}
            </div>

            <SpaceConfigModal
                show={showSpaceConfigModal}
                onHide={handleCloseModal}
                spaceName={configuringSpaceName}
                loading={loadingEquipment}
                spaceEquipment={spaceEquipment}
                selectedEquipment={selectedEquipment}
                onToggleEquipment={handleToggleEquipment}
                onAddToCart={handleAddToCart}
            />
        </div>
    );
}
