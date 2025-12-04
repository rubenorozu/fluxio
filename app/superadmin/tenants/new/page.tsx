'use client';

import React, { useState } from 'react';
import { Form, Button, Alert, Card, Spinner } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewTenantPage() {
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/superadmin/tenants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, slug, adminName, adminEmail, adminPassword }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create tenant');
            }

            router.push('/superadmin/tenants');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Auto-generate slug from name
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setName(val);
        setSlug(val.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20));
    };

    return (
        <div className="d-flex justify-content-center">
            <Card style={{ width: '100%', maxWidth: '600px' }}>
                <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                        <h4 className="mb-0">Nueva Organización</h4>
                        <Link href="/superadmin/tenants" className="btn btn-outline-secondary btn-sm">Cancelar</Link>
                    </div>
                </Card.Header>
                <Card.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Nombre de la Organización</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Ej. Universidad del Valle"
                                value={name}
                                onChange={handleNameChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Slug (Identificador de Subdominio)</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Ej. univalle"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                required
                                pattern="[a-z0-9]+"
                                title="Solo letras minúsculas y números"
                            />
                            <Form.Text className="text-muted">
                                Este será el subdominio: <strong>{slug || 'ejemplo'}.localhost:3000</strong>
                            </Form.Text>
                        </Form.Group>

                        <hr />
                        <h5>Usuario Administrador Inicial</h5>
                        <Form.Group className="mb-3">
                            <Form.Label>Nombre del Administrador</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Ej. Juan Pérez"
                                value={adminName}
                                onChange={(e) => setAdminName(e.target.value)}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Correo Electrónico</Form.Label>
                            <Form.Control
                                type="email"
                                placeholder="admin@institucion.com"
                                value={adminEmail}
                                onChange={(e) => setAdminEmail(e.target.value)}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Contraseña</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Contraseña segura"
                                value={adminPassword}
                                onChange={(e) => setAdminPassword(e.target.value)}
                            />
                        </Form.Group>

                        <Button variant="primary" type="submit" disabled={loading} className="w-100">
                            {loading ? <Spinner animation="border" size="sm" /> : 'Crear Organización'}
                        </Button>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
}
