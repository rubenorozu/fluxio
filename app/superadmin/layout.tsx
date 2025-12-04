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

    console.log('--- SuperAdmin Layout Debug ---');
    console.log('User ID:', session?.user?.id);
    console.log('Role:', session?.user?.role);
    console.log('TenantID:', session?.user?.tenantId);
    console.log('Is Default?', session?.user?.tenantId === 'default');
    console.log('Condition:', (!session || session.user.role !== Role.SUPERUSER || (session.user.tenantId && session.user.tenantId !== 'default')));

    // Only allow SUPERUSER who is NOT bound to a specific tenant (or is bound to 'default')
    // Assuming global superusers have tenantId as null or 'default'
    if (!session || session.user.role !== Role.SUPERUSER || (session.user.tenantId && session.user.tenantId !== 'default')) {
        console.log('Redirecting to / ...');
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
                        <Nav className="flex-column">
                            <Nav.Link href="/superadmin/tenants" className="text-dark">Organizaciones</Nav.Link>
                            <Nav.Link href="/superadmin/users" className="text-dark">Usuarios Globales</Nav.Link>
                            <Nav.Link href="/superadmin/settings" className="text-dark">Configuración Global</Nav.Link>
                        </Nav>
                    </Col>
                    <Col md={10} className="p-4">
                        {children}
                    </Col>
                </Row>
            </Container>
        </div>
    );
}
