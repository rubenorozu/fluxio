'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Table, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { useRouter } from 'next/navigation';

interface Tenant {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    createdAt: string;
    _count: {
        users: number;
    };
    config?: {
        siteName: string | null;
        topLogoUrl: string | null;
    }
}

export default function TenantsPage() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        try {
            const res = await fetch('/api/superadmin/tenants');
            if (!res.ok) throw new Error('Failed to fetch tenants');
            const data = await res.json();
            setTenants(data);
        } catch (err) {
            setError('Error al cargar las organizaciones');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Organizaciones (Tenants)</h2>
                <Link href="/superadmin/tenants/new" passHref>
                    <Button variant="primary">Nueva Organización</Button>
                </Link>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Slug (Subdominio)</th>
                        <th>Estado</th>
                        <th>Usuarios</th>
                        <th>Fecha Creación</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {tenants.map((tenant) => (
                        <tr key={tenant.id}>
                            <td>
                                <div className="d-flex align-items-center">
                                    {tenant.config?.topLogoUrl && (
                                        <img src={tenant.config.topLogoUrl} alt="logo" style={{ height: '24px', marginRight: '8px' }} />
                                    )}
                                    {tenant.name}
                                </div>
                            </td>
                            <td>
                                <a href={`http://${tenant.slug}.localhost:3000`} target="_blank" rel="noopener noreferrer">
                                    {tenant.slug}
                                </a>
                            </td>
                            <td>
                                <Badge bg={tenant.isActive ? 'success' : 'secondary'}>
                                    {tenant.isActive ? 'Activo' : 'Inactivo'}
                                </Badge>
                            </td>
                            <td>{tenant._count.users}</td>
                            <td>{new Date(tenant.createdAt).toLocaleDateString()}</td>
                            <td>
                                <Link href={`/superadmin/tenants/${tenant.id}`} passHref>
                                    <Button variant="outline-primary" size="sm" className="me-2">Editar</Button>
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
}
