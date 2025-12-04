'use client';

import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import Link from 'next/link';

export default function TenantPausedPage() {
    return (
        <Container className="min-vh-100 d-flex align-items-center justify-content-center">
            <Row>
                <Col md={8} lg={6} className="mx-auto">
                    <Card className="shadow-lg border-0">
                        <Card.Body className="p-5 text-center">
                            <div className="mb-4">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="80"
                                    height="80"
                                    fill="#6c757d"
                                    className="bi bi-pause-circle"
                                    viewBox="0 0 16 16"
                                >
                                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                                    <path d="M5 6.25a1.25 1.25 0 1 1 2.5 0v3.5a1.25 1.25 0 1 1-2.5 0v-3.5zm3.5 0a1.25 1.25 0 1 1 2.5 0v3.5a1.25 1.25 0 1 1-2.5 0v-3.5z" />
                                </svg>
                            </div>
                            <h1 className="display-6 fw-bold text-secondary mb-3">
                                Cuenta Pausada
                            </h1>
                            <p className="lead text-muted mb-4">
                                Esta organización ha sido pausada temporalmente.
                                Por favor contacta con el administrador o con nuestro equipo de soporte para más información.
                            </p>
                            <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                                <Button
                                    variant="primary"
                                    size="lg"
                                    href="mailto:contacto@fluxiorsv.com?subject=Cuenta Pausada - Solicitud de Reactivación"
                                >
                                    Contactar Soporte
                                </Button>
                                <Link href="/login" passHref legacyBehavior>
                                    <Button variant="outline-secondary" size="lg">
                                        Volver al Inicio
                                    </Button>
                                </Link>
                            </div>
                            <hr className="my-4" />
                            <p className="text-muted small">
                                ¿Necesitas ayuda? Escríbenos a{' '}
                                <a href="mailto:contacto@fluxiorsv.com">contacto@fluxiorsv.com</a>
                            </p>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}
