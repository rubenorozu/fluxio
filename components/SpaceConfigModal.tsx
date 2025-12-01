'use client';

import { Modal, Button, Alert, Form, Spinner } from 'react-bootstrap';
import { useState, useEffect } from 'react';

interface Resource {
    id: string;
    name: string;
    isFixedToSpace?: boolean;
}

interface SpaceConfigModalProps {
    show: boolean;
    onHide: () => void;
    spaceName: string | null;
    loading: boolean;
    spaceEquipment: Resource[];
    selectedEquipment: string[];
    onToggleEquipment: (equipmentId: string) => void;
    onAddToCart: () => void;
}

export default function SpaceConfigModal({
    show,
    onHide,
    spaceName,
    loading,
    spaceEquipment,
    selectedEquipment,
    onToggleEquipment,
    onAddToCart,
}: SpaceConfigModalProps) {
    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Configurar Reserva para: {spaceName}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading ? (
                    <div className="text-center">
                        <Spinner animation="border" />
                        <p>Cargando equipos...</p>
                    </div>
                ) : spaceEquipment.length === 0 ? (
                    <Alert variant="info">
                        No hay equipos asociados a este espacio o todos están en mantenimiento.
                    </Alert>
                ) : (
                    <>
                        <p>Selecciona los equipos que deseas incluir con este espacio:</p>
                        {spaceEquipment.map((eq) => (
                            <Form.Check
                                key={eq.id}
                                type="checkbox"
                                id={`equipment-${eq.id}`}
                                label={`${eq.name} ${eq.isFixedToSpace ? '(Fijo al espacio)' : ''}`}
                                checked={selectedEquipment.includes(eq.id)}
                                onChange={() => onToggleEquipment(eq.id)}
                            />
                        ))}
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Cancelar
                </Button>
                <Button variant="primary" onClick={onAddToCart} disabled={loading}>
                    Agregar al Carrito
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
