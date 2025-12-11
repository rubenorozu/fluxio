'use client';

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';

export default function LandingConfigPage() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const [config, setConfig] = useState({
        contactEmail: 'contacto@fluxiorsv.com',
        demoTrialDays: 7,
        formFields: {
            requirePhone: true,
            requireCompany: true,
            requirePosition: false,
            requireSize: true,
            requireMessage: false
        },
        autoResponse: true,
        autoResponseMessage: 'Gracias por tu interés en Fluxio RSV. Nos pondremos en contacto contigo pronto.'
    });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            const response = await fetch('/api/admin/landing-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            if (!response.ok) throw new Error('Error al guardar configuración');

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="py-4">
            <Row>
                <Col>
                    <h1 className="mb-4">Configuración de Landing Page</h1>

                    {success && (
                        <Alert variant="success" dismissible onClose={() => setSuccess(false)}>
                            Configuración guardada exitosamente
                        </Alert>
                    )}

                    {error && (
                        <Alert variant="danger" dismissible onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}

                    {/* Botón destacado para Pricing Plans */}
                    <Card className="mb-4 border-primary">
                        <Card.Body className="d-flex justify-content-between align-items-center">
                            <div>
                                <h5 className="mb-1">💰 Planes de Pricing</h5>
                                <p className="text-muted mb-0">
                                    Configura los precios y características de los planes que se muestran en la landing page
                                </p>
                            </div>
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={() => window.location.href = '/admin/pricing-plans'}
                            >
                                Editar Planes →
                            </Button>
                        </Card.Body>
                    </Card>

                    <form onSubmit={handleSave}>
                        <Card className="mb-4">
                            <Card.Header>
                                <h5 className="mb-0">Configuración General</h5>
                            </Card.Header>
                            <Card.Body>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email de Contacto</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={config.contactEmail}
                                        onChange={(e) => setConfig({ ...config, contactEmail: e.target.value })}
                                        placeholder="contacto@tuempresa.com"
                                    />
                                    <Form.Text className="text-muted">
                                        Los formularios de demo se enviarán a este email
                                    </Form.Text>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Días de Demo Gratuito</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="1"
                                        max="30"
                                        value={config.demoTrialDays}
                                        onChange={(e) => setConfig({ ...config, demoTrialDays: parseInt(e.target.value) })}
                                    />
                                    <Form.Text className="text-muted">
                                        Duración del período de prueba (1-30 días)
                                    </Form.Text>
                                </Form.Group>
                            </Card.Body>
                        </Card>

                        <Card className="mb-4">
                            <Card.Header>
                                <h5 className="mb-0">Campos del Formulario</h5>
                            </Card.Header>
                            <Card.Body>
                                <Form.Check
                                    type="checkbox"
                                    label="Teléfono (requerido)"
                                    checked={config.formFields.requirePhone}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        formFields: { ...config.formFields, requirePhone: e.target.checked }
                                    })}
                                    className="mb-2"
                                />
                                <Form.Check
                                    type="checkbox"
                                    label="Nombre de la institución (requerido)"
                                    checked={config.formFields.requireCompany}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        formFields: { ...config.formFields, requireCompany: e.target.checked }
                                    })}
                                    className="mb-2"
                                />
                                <Form.Check
                                    type="checkbox"
                                    label="Cargo/Puesto (requerido)"
                                    checked={config.formFields.requirePosition}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        formFields: { ...config.formFields, requirePosition: e.target.checked }
                                    })}
                                    className="mb-2"
                                />
                                <Form.Check
                                    type="checkbox"
                                    label="Tamaño de institución (requerido)"
                                    checked={config.formFields.requireSize}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        formFields: { ...config.formFields, requireSize: e.target.checked }
                                    })}
                                    className="mb-2"
                                />
                                <Form.Check
                                    type="checkbox"
                                    label="Mensaje/Necesidades (requerido)"
                                    checked={config.formFields.requireMessage}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        formFields: { ...config.formFields, requireMessage: e.target.checked }
                                    })}
                                    className="mb-2"
                                />
                            </Card.Body>
                        </Card>

                        <Card className="mb-4">
                            <Card.Header>
                                <h5 className="mb-0">Respuesta Automática</h5>
                            </Card.Header>
                            <Card.Body>
                                <Form.Check
                                    type="checkbox"
                                    label="Enviar respuesta automática al usuario"
                                    checked={config.autoResponse}
                                    onChange={(e) => setConfig({ ...config, autoResponse: e.target.checked })}
                                    className="mb-3"
                                />

                                {config.autoResponse && (
                                    <Form.Group>
                                        <Form.Label>Mensaje de Respuesta Automática</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            value={config.autoResponseMessage}
                                            onChange={(e) => setConfig({ ...config, autoResponseMessage: e.target.value })}
                                        />
                                    </Form.Group>
                                )}
                            </Card.Body>
                        </Card>

                        <div className="d-flex gap-2">
                            <Button type="submit" variant="primary" disabled={loading}>
                                {loading ? 'Guardando...' : 'Guardar Configuración'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline-secondary"
                                onClick={() => window.location.href = '/admin'}
                            >
                                Cancelar
                            </Button>
                        </div>
                    </form>
                </Col>
            </Row>
        </Container>
    );
}
