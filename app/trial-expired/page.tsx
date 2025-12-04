'use client';

import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import Link from 'next/link';

export default function TrialExpiredPage() {
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
                                    fill="#ff9500"
                                    className="bi bi-hourglass-bottom"
                                    viewBox="0 0 16 16"
                                >
                                    <path d="M2 1.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-1v1a4.5 4.5 0 0 1-2.557 4.06c-.29.139-.443.377-.443.59v.7c0 .213.154.451.443.59A4.5 4.5 0 0 1 12.5 13v1h1a.5.5 0 0 1 0 1h-11a.5.5 0 1 1 0-1h1v-1a4.5 4.5 0 0 1 2.557-4.06c.29-.139.443-.377.443-.59v-.7c0-.213-.154-.451-.443-.59A4.5 4.5 0 0 1 3.5 3V2h-1a.5.5 0 0 1-.5-.5zm2.5.5v1a3.5 3.5 0 0 0 1.989 3.158c.533.256 1.011.791 1.011 1.491v.702s.18.149.5.149.5-.15.5-.15v-.7c0-.701.478-1.236 1.011-1.492A3.5 3.5 0 0 0 11.5 3V2h-7z" />
                                </svg>
                            </div>
                            <h1 className="display-6 fw-bold text-danger mb-3">
                                Período de Prueba Expirado
                            </h1>
                            <p className="lead text-muted mb-4">
                                Tu período de prueba gratuito ha finalizado. Para continuar usando Fluxio RSV,
                                por favor contacta con nuestro equipo para actualizar tu plan.
                            </p>
                            <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                                <Button
                                    variant="primary"
                                    size="lg"
                                    href="mailto:contacto@fluxiorsv.com?subject=Actualizar Plan - Trial Expirado"
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
