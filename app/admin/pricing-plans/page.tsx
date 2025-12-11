'use client';

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';

interface PricingPlan {
    name: string;
    price: string;
    currency: string;
    period: string;
    billing: string;
    featured: boolean;
    cta: string;
    features: string[];
}

const defaultPlans: PricingPlan[] = [
    {
        name: 'Básico',
        price: '49',
        currency: 'USD',
        period: '/mes',
        billing: 'Facturación anual',
        featured: false,
        cta: 'Comenzar',
        features: [
            'Hasta 100 usuarios',
            '25 recursos (espacios + equipos)',
            '10GB almacenamiento',
            'Soporte por email',
            'Personalización de marca',
            'Reportes básicos'
        ]
    },
    {
        name: 'Profesional',
        price: '149',
        currency: 'USD',
        period: '/mes',
        billing: 'Facturación anual',
        featured: true,
        cta: 'Más Popular',
        features: [
            'Hasta 500 usuarios',
            '100 recursos (espacios + equipos)',
            '50GB almacenamiento',
            'Soporte prioritario',
            'Reportes avanzados',
            'Personalización completa',
            'Dominio personalizado',
            'API access',
            'Talleres ilimitados'
        ]
    },
    {
        name: 'Enterprise',
        price: '299',
        currency: 'USD',
        period: '/mes',
        billing: 'Facturación anual',
        featured: false,
        cta: 'Contactar',
        features: [
            'Usuarios ilimitados',
            'Recursos ilimitados',
            'Almacenamiento ilimitado',
            'Soporte prioritario',
            'Dominio personalizado',
            'Onboarding personalizado',
            'SLA garantizado',
            'Servidor dedicado (opcional)',
            'Desarrollo a medida',
            'Integraciones personalizadas'
        ]
    }
];

export default function PricingPlansConfig() {
    const [plans, setPlans] = useState<PricingPlan[]>(defaultPlans);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchPlans();
    }, []);

    async function fetchPlans() {
        try {
            const response = await fetch('/api/admin/pricing-plans');
            if (response.ok) {
                const data = await response.json();
                if (data.plans) {
                    setPlans(data.plans);
                }
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        setSaving(true);
        setMessage(null);

        try {
            const response = await fetch('/api/admin/pricing-plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plans })
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Planes guardados exitosamente' });
            } else {
                throw new Error('Error al guardar');
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error al guardar los planes' });
        } finally {
            setSaving(false);
        }
    }

    function updatePlan(index: number, field: keyof PricingPlan, value: any) {
        const newPlans = [...plans];
        newPlans[index] = { ...newPlans[index], [field]: value };
        setPlans(newPlans);
    }

    function updateFeature(planIndex: number, featureIndex: number, value: string) {
        const newPlans = [...plans];
        newPlans[planIndex].features[featureIndex] = value;
        setPlans(newPlans);
    }

    function addFeature(planIndex: number) {
        const newPlans = [...plans];
        newPlans[planIndex].features.push('Nueva característica');
        setPlans(newPlans);
    }

    function removeFeature(planIndex: number, featureIndex: number) {
        const newPlans = [...plans];
        newPlans[planIndex].features.splice(featureIndex, 1);
        setPlans(newPlans);
    }

    if (loading) {
        return <div className="p-5 text-center">Cargando...</div>;
    }

    return (
        <Container fluid className="p-4">
            <Row className="mb-4">
                <Col>
                    <h2>Configuración de Planes de Pricing</h2>
                    <p className="text-muted">
                        Configura los planes que se mostrarán en la landing page. Los precios se convertirán automáticamente a MXN para visitantes de México.
                    </p>
                </Col>
            </Row>

            {message && (
                <Alert variant={message.type === 'success' ? 'success' : 'danger'} dismissible onClose={() => setMessage(null)}>
                    {message.text}
                </Alert>
            )}

            <Row className="g-4">
                {plans.map((plan, planIndex) => (
                    <Col key={planIndex} lg={4}>
                        <Card>
                            <Card.Header className="bg-primary text-white">
                                <h5 className="mb-0">Plan {planIndex + 1}</h5>
                            </Card.Header>
                            <Card.Body>
                                <Form.Group className="mb-3">
                                    <Form.Label>Nombre del Plan</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={plan.name}
                                        onChange={(e) => updatePlan(planIndex, 'name', e.target.value)}
                                    />
                                </Form.Group>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Precio (USD)</Form.Label>
                                            <Form.Control
                                                type="number"
                                                value={plan.price}
                                                onChange={(e) => updatePlan(planIndex, 'price', e.target.value)}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Periodo</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={plan.period}
                                                onChange={(e) => updatePlan(planIndex, 'period', e.target.value)}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3">
                                    <Form.Label>Texto de Facturación</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={plan.billing}
                                        onChange={(e) => updatePlan(planIndex, 'billing', e.target.value)}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Botón CTA</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={plan.cta}
                                        onChange={(e) => updatePlan(planIndex, 'cta', e.target.value)}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Check
                                        type="checkbox"
                                        label="Plan destacado (Más Popular)"
                                        checked={plan.featured}
                                        onChange={(e) => updatePlan(planIndex, 'featured', e.target.checked)}
                                    />
                                </Form.Group>

                                <Form.Label>Características</Form.Label>
                                {plan.features.map((feature, featureIndex) => (
                                    <div key={featureIndex} className="d-flex gap-2 mb-2">
                                        <Form.Control
                                            type="text"
                                            value={feature}
                                            onChange={(e) => updateFeature(planIndex, featureIndex, e.target.value)}
                                        />
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => removeFeature(planIndex, featureIndex)}
                                        >
                                            ✕
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => addFeature(planIndex)}
                                    className="mt-2"
                                >
                                    + Agregar Característica
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row className="mt-4">
                <Col>
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </Col>
            </Row>
        </Container>
    );
}
