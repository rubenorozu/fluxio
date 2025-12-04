'use client';

import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Spinner, Table, Badge } from 'react-bootstrap';

interface DashboardData {
    metrics: {
        totalTenants: number;
        activeTenants: number;
        totalUsers: number;
    };
    recentActivity: {
        tenants: { id: string; name: string; slug: string; createdAt: string }[];
        users: { id: string; email: string; firstName: string; lastName: string; createdAt: string; tenant: { name: string } | null }[];
    };
}

export default function SuperAdminDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/superadmin/dashboard')
            .then((res) => res.json())
            .then((data) => {
                setData(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;
    if (!data) return <div className="text-center p-5">Error loading dashboard</div>;

    return (
        <div>
            <h2 className="mb-4">Dashboard Global</h2>

            <Row className="mb-4">
                <Col md={4}>
                    <Card className="text-center h-100 shadow-sm">
                        <Card.Body>
                            <Card.Title>Total Organizaciones</Card.Title>
                            <h1 className="display-4 text-primary">{data.metrics.totalTenants}</h1>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="text-center h-100 shadow-sm">
                        <Card.Body>
                            <Card.Title>Organizaciones Activas</Card.Title>
                            <h1 className="display-4 text-success">{data.metrics.activeTenants}</h1>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="text-center h-100 shadow-sm">
                        <Card.Body>
                            <Card.Title>Total Usuarios</Card.Title>
                            <h1 className="display-4 text-info">{data.metrics.totalUsers}</h1>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col md={6}>
                    <Card className="shadow-sm">
                        <Card.Header>Organizaciones Recientes</Card.Header>
                        <Card.Body>
                            <Table hover size="sm">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Slug</th>
                                        <th>Fecha</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.recentActivity.tenants.map((t) => (
                                        <tr key={t.id}>
                                            <td>{t.name}</td>
                                            <td>{t.slug}</td>
                                            <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="shadow-sm">
                        <Card.Header>Usuarios Recientes</Card.Header>
                        <Card.Body>
                            <Table hover size="sm">
                                <thead>
                                    <tr>
                                        <th>Usuario</th>
                                        <th>Org</th>
                                        <th>Fecha</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.recentActivity.users.map((u) => (
                                        <tr key={u.id}>
                                            <td>{u.firstName} {u.lastName}</td>
                                            <td>{u.tenant?.name || <Badge bg="secondary">Global</Badge>}</td>
                                            <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
