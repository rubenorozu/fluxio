'use client';

import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Table, Spinner } from 'react-bootstrap';
import { useSession } from '@/context/SessionContext';
import { useRouter } from 'next/navigation';
import type { ReservationFormField, ReservationFormConfig } from '@/lib/reservation-form-utils';

export default function ReservationFormConfigPage() {
    const { user, loading: sessionLoading } = useSession();
    const router = useRouter();
    const [config, setConfig] = useState<ReservationFormConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (!sessionLoading && !user) {
            router.push('/login');
        }
    }, [user, sessionLoading, router]);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/reservation-form-config');
            if (response.ok) {
                const data = await response.json();
                setConfig(data);
            } else {
                setError('Error al cargar la configuración');
            }
        } catch (err) {
            setError('Error al cargar la configuración');
        } finally {
            setLoading(false);
        }
    };

    const handleFieldChange = (index: number, field: keyof ReservationFormField, value: any) => {
        if (!config) return;

        const newFields = [...config.fields];
        newFields[index] = { ...newFields[index], [field]: value };
        setConfig({ fields: newFields });
    };

    const handleSave = async () => {
        if (!config) return;

        try {
            setSaving(true);
            setError(null);
            setSuccess(null);

            const response = await fetch('/api/admin/reservation-form-config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            if (response.ok) {
                setSuccess('Configuración guardada exitosamente');
            } else {
                const data = await response.json();
                setError(data.error || 'Error al guardar la configuración');
            }
        } catch (err) {
            setError('Error al guardar la configuración');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (confirm('¿Estás seguro de restaurar la configuración por defecto? Se perderán todos los cambios.')) {
            fetchConfig();
            setSuccess('Configuración restaurada');
        }
    };

    if (sessionLoading || loading) {
        return (
            <Container className="mt-5 text-center">
                <Spinner animation="border" />
                <p>Cargando...</p>
            </Container>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <Container style={{ paddingTop: '100px', paddingBottom: '50px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 style={{ color: '#0076A8' }}>Configuración del Formulario de Reservaciones</h2>
                <div>
                    <Button variant="outline-secondary" onClick={handleReset} className="me-2">
                        Restaurar por Defecto
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={saving}
                        style={{ backgroundColor: '#0076A8', borderColor: '#0076A8' }}
                    >
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </div>
            </div>

            {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
            {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}

            <Card>
                <Card.Body>
                    <p className="text-muted mb-4">
                        Personaliza los campos del formulario de reservaciones. Los cambios se reflejarán en el carrito,
                        panel de administración, correos y PDFs.
                    </p>

                    <Table responsive>
                        <thead>
                            <tr>
                                <th style={{ width: '50px' }}>Orden</th>
                                <th>Campo</th>
                                <th>Etiqueta Personalizada</th>
                                <th style={{ width: '100px' }}>Habilitado</th>
                                <th style={{ width: '100px' }}>Obligatorio</th>
                            </tr>
                        </thead>
                        <tbody>
                            {config?.fields.map((field, index) => (
                                <tr key={field.id}>
                                    <td>
                                        <Form.Control
                                            type="number"
                                            value={field.order}
                                            onChange={(e) => handleFieldChange(index, 'order', parseInt(e.target.value))}
                                            style={{ width: '60px' }}
                                        />
                                    </td>
                                    <td>
                                        <strong>{field.id}</strong>
                                        <br />
                                        <small className="text-muted">{field.type}</small>
                                    </td>
                                    <td>
                                        <Form.Control
                                            type="text"
                                            value={field.label}
                                            onChange={(e) => handleFieldChange(index, 'label', e.target.value)}
                                            placeholder="Etiqueta del campo"
                                        />
                                    </td>
                                    <td className="text-center">
                                        <Form.Check
                                            type="switch"
                                            checked={field.enabled}
                                            onChange={(e) => handleFieldChange(index, 'enabled', e.target.checked)}
                                        />
                                    </td>
                                    <td className="text-center">
                                        <Form.Check
                                            type="switch"
                                            checked={field.required}
                                            onChange={(e) => handleFieldChange(index, 'required', e.target.checked)}
                                            disabled={!field.enabled}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>

                    <Alert variant="info" className="mt-4">
                        <strong>Nota:</strong> Los campos de fecha y hora (Inicio y Fin) no son configurables ya que son esenciales para el sistema.
                    </Alert>
                </Card.Body>
            </Card>
        </Container>
    );
}
