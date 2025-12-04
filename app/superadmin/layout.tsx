import React from 'react';
import { getServerSession } from '@/lib/auth';
import { Role } from '@prisma/client';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Container, Row, Col, Nav } from 'react-bootstrap';

export default async function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession();

    // Only allow SUPERUSER
    // We removed the tenantId restriction because Superusers might belong to 'default', 'platform', or have no tenant.
    // The Role.SUPERUSER check is sufficient security.
    if (!session || session.user.role !== Role.SUPERUSER) {
        redirect('/');
    }

    return (
        <div className="d-flex flex-column min-vh-100">
            <header className="bg-dark text-white p-3">
                <Container fluid>
                    <div className="d-flex justify-content-between align-items-center">
                        <h3 className="mb-0">Panel Super-Admin</h3>
                        <Link href="/" className="text-white text-decoration-none">Volver al sitio</Link>
                    </div>
                </Container>
            </header>
            <Container fluid className="flex-grow-1">
                <Row className="h-100">
                    <Col md={2} className="bg-light p-3 border-end">
                        <div className="nav flex-column">
                            <Link href="/superadmin/tenants" className="nav-link text-dark">Organizaciones</Link>
                            <Link href="/superadmin/users" className="nav-link text-dark">Usuarios Globales</Link>
                            <Link href="/superadmin/settings" className="nav-link text-dark">Configuración Global</Link>
                        </div>
                    </Col>
                    <Col md={10} className="p-4">
                        {children}
                    </Col>
                </Row>
            </Container>
        </div>
    );
}
