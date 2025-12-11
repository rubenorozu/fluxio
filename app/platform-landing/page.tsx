'use client';

import { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import Image from 'next/image';
import styles from './LandingPage.module.css';

import { useSession } from '@/context/SessionContext';

export default function PlatformLandingPage() {
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [userCountry, setUserCountry] = useState<string>('US');
    const [isLoadingCountry, setIsLoadingCountry] = useState(true);
    const [pricingPlans, setPricingPlans] = useState<any[]>([]);
    const [isLoadingPlans, setIsLoadingPlans] = useState(true);
    const { user, loading } = useSession();

    // Detectar país del usuario al cargar
    useEffect(() => {
        async function detectCountry() {
            try {
                const response = await fetch('https://ipapi.co/json/');
                if (response.ok) {
                    const data = await response.json();
                    setUserCountry(data.country_code || 'US');
                }
            } catch (error) {
                console.error('Error detecting country:', error);
                setUserCountry('US');
            } finally {
                setIsLoadingCountry(false);
            }
        }
        detectCountry();
    }, []);

    // Cargar planes de pricing
    useEffect(() => {
        async function fetchPlans() {
            try {
                const response = await fetch('/api/admin/pricing-plans');
                if (response.ok) {
                    const data = await response.json();
                    if (data.plans && Array.isArray(data.plans)) {
                        setPricingPlans(data.plans);
                    } else {
                        // Usar planes por defecto si no hay configurados
                        setPricingPlans(defaultPricingPlans);
                    }
                } else {
                    setPricingPlans(defaultPricingPlans);
                }
            } catch (error) {
                console.error('Error fetching plans:', error);
                setPricingPlans(defaultPricingPlans);
            } finally {
                setIsLoadingPlans(false);
            }
        }
        fetchPlans();
    }, []);

    // Función para convertir precios
    const convertPrice = (usdPrice: number) => {
        if (userCountry === 'MX') {
            return Math.round(usdPrice * 18); // 1 USD ≈ 18 MXN
        }
        return usdPrice;
    };

    // Función para obtener símbolo de moneda
    const getCurrency = () => {
        return userCountry === 'MX' ? 'MXN' : 'USD';
    };

    return (
        <div className={styles.landingPage}>
            {/* Header con Logo */}
            <header className={styles.landingHeader}>
                <Container>
                    <div className="d-flex justify-content-between align-items-center py-2">
                        <Image
                            src="/assets/FluxioRSV_bco.svg"
                            alt="Fluxio RSV"
                            width={300}
                            height={90}
                            style={{ width: 'auto', height: '75px' }}
                        />
                    </div>
                </Container>
            </header>

            {/* Hero Section */}
            <section className={styles.hero}>
                <Container>
                    <Row className="align-items-center py-5">
                        <Col lg={6} className="text-center text-lg-start">
                            <h1 className={styles.heroTitle}>
                                Gestiona tus <span className={styles.highlight}>Recursos</span> de forma Inteligente
                            </h1>
                            <p className={styles.heroSubtitle}>
                                Fluxio RSV es la plataforma todo-en-uno para gestionar espacios, equipos y talleres en tu institución.
                            </p>
                            <div className="d-flex gap-3 justify-content-center justify-content-lg-start mt-4">
                                <a
                                    href="#pricing"
                                    className={styles.ctaPrimary}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        const element = document.getElementById('pricing');
                                        if (element) {
                                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    Ver Planes
                                </a>
                                <a
                                    href="#contact"
                                    className={styles.ctaSecondary}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        const element = document.getElementById('contact');
                                        if (element) {
                                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    Solicitar Demo
                                </a>
                            </div>
                        </Col>
                        <Col lg={6} className="mt-5 mt-lg-0">
                            <div className={styles.heroImage}>
                                <Image
                                    src="/screenshots/Imagen_S.png"
                                    alt="Dashboard Preview"
                                    width={1542}
                                    height={1048}
                                    className="rounded shadow-lg"
                                    priority
                                    style={{ width: '100%', height: 'auto' }}
                                />
                            </div>
                        </Col>
                    </Row>

                    {/* Placeholders para imágenes adicionales */}
                    <Row className="g-3 mt-5">
                        <Col md={4}>
                            <div className={styles.heroImagePlaceholder}>
                                <Image
                                    src="/screenshots/Imagen_A.png"
                                    alt="Característica A"
                                    width={600}
                                    height={350}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }}
                                />
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className={styles.heroImagePlaceholder}>
                                <Image
                                    src="/screenshots/Imagen_B.png"
                                    alt="Característica B"
                                    width={600}
                                    height={350}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }}
                                />
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className={styles.heroImagePlaceholder}>
                                <Image
                                    src="/screenshots/Imagen_C.png"
                                    alt="Característica C"
                                    width={600}
                                    height={350}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }}
                                />
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* Problem/Solution */}
            <section className={styles.problemSection}>
                <Container>
                    <Row className="text-center mb-5">
                        <Col>
                            <h2 className={styles.sectionTitle}>Optimiza tu Gestión</h2>
                            <p className={styles.sectionSubtitle}>
                                Fluxio RSV automatiza todo el proceso de reservas, inscripciones y reportes
                            </p>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* Features */}
            <section className={styles.featuresSection}>
                <Container>
                    <Row className="text-center mb-5">
                        <Col>
                            <h2 className={styles.sectionTitle}>Todo lo que Necesitas en un Solo Lugar</h2>
                        </Col>
                    </Row>
                    <Row className="g-4">
                        {features.map((feature, index) => (
                            <Col key={index} md={6} lg={4}>
                                <Card className={styles.featureCard}>
                                    <Card.Body className="text-center p-4">
                                        <div className={styles.featureIcon}>{feature.icon}</div>
                                        <h3 className={styles.featureTitle}>{feature.title}</h3>
                                        <p className={styles.featureDescription}>{feature.description}</p>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>

            {/* Screenshots */}
            <section className={styles.screenshotsSection} id="demo">
                <Container>
                    <Row className="text-center mb-5">
                        <Col>
                            <h2 className={styles.sectionTitle}>Interfaz Intuitiva y Poderosa</h2>
                            <p className={styles.sectionSubtitle}>Diseñada para ser fácil de usar y altamente funcional</p>
                        </Col>
                    </Row>
                    <div className={styles.screenshotsGrid}>
                        {screenshots.map((screenshot, index) => (
                            <div key={index} className={styles.screenshotCard}>
                                <Image
                                    src={screenshot.image}
                                    alt={screenshot.title}
                                    width={1170}
                                    height={720}
                                    className={styles.screenshotImage}
                                    style={{ width: '100%', height: 'auto' }}
                                />
                            </div>
                        ))}
                    </div>
                </Container>
            </section>

            {/* Pricing */}
            <section className={styles.pricingSection} id="pricing">
                <Container>
                    <Row className="text-center mb-5">
                        <Col>
                            <h2 className={styles.sectionTitle}>Planes Flexibles para tu Institución</h2>
                            <p className={styles.sectionSubtitle}>Elige el plan que mejor se adapte a tus necesidades</p>
                            {!isLoadingCountry && (
                                <p className="text-muted mt-2">
                                    <small>
                                        * Precios mostrados en {getCurrency()}. Facturación anual, cargo una vez al año.
                                        {userCountry === 'MX' && ' (Tipo de cambio: 1 USD = 18 MXN aprox.)'}
                                    </small>
                                </p>
                            )}
                        </Col>
                    </Row>
                    <Row className="g-4 justify-content-center">
                        {pricingPlans.map((plan, index) => (
                            <Col key={index} lg={4} md={6}>
                                <Card
                                    className={`${styles.pricingCard} ${plan.featured ? styles.featuredPlan : ''}`}
                                    onClick={() => setSelectedPlan(plan.name)}
                                >
                                    {plan.featured && <div className={styles.popularBadge}>Más Popular</div>}
                                    <Card.Body className="p-4">
                                        <h3 className={styles.planName}>{plan.name}</h3>
                                        <div className={styles.planPrice}>
                                            {plan.price === 'Personalizado' ? (
                                                <span className={styles.customPrice}>{plan.price}</span>
                                            ) : (
                                                <>
                                                    {isLoadingCountry ? (
                                                        <span className={styles.amount}>...</span>
                                                    ) : (
                                                        <>
                                                            <span className={styles.currency}>$</span>
                                                            <span className={styles.amount}>
                                                                {convertPrice(parseInt(plan.price))}
                                                            </span>
                                                            <span className={styles.currency}> {getCurrency()}</span>
                                                            <span className={styles.period}>{plan.period}</span>
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        {plan.billing && (
                                            <p className={styles.billingNote}>{plan.billing}</p>
                                        )}
                                        {!isLoadingCountry && plan.price !== 'Personalizado' && (
                                            <p className={`${styles.billingNote} mt-2`}>
                                                Total anual: ${convertPrice(parseInt(plan.price)) * 12} {getCurrency()}
                                            </p>
                                        )}
                                        <ul className={styles.featureList}>
                                            {plan.features.map((feature, idx) => (
                                                <li key={idx}>
                                                    <span className={styles.checkmark}>✓</span> {feature}
                                                </li>
                                            ))}
                                        </ul>
                                        <Button
                                            className={`w-100 mt-4 ${plan.featured ? styles.ctaPrimary : styles.ctaSecondary}`}
                                            size="lg"
                                            href="#contact"
                                        >
                                            {plan.cta}
                                        </Button>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>

            {/* Contact Form */}
            <section className={styles.ctaSection} id="contact">
                <Container>
                    <Row className="justify-content-center">
                        <Col lg={8}>
                            <div className="text-center mb-5">
                                <h2 className={styles.ctaTitle}>Solicita tu Demo Gratuito de 7 Días</h2>
                                <p className={styles.ctaSubtitle}>
                                    Completa el formulario y nos pondremos en contacto contigo para configurar tu demo personalizado
                                </p>
                            </div>

                            <form className={styles.contactForm}>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <input
                                            type="text"
                                            className={styles.formInput}
                                            placeholder="Nombre completo *"
                                            required
                                        />
                                    </Col>
                                    <Col md={6}>
                                        <input
                                            type="email"
                                            className={styles.formInput}
                                            placeholder="Email corporativo *"
                                            required
                                        />
                                    </Col>
                                    <Col md={6}>
                                        <input
                                            type="tel"
                                            className={styles.formInput}
                                            placeholder="Teléfono *"
                                            required
                                        />
                                    </Col>
                                    <Col md={6}>
                                        <input
                                            type="text"
                                            className={styles.formInput}
                                            placeholder="Nombre de la institución *"
                                            required
                                        />
                                    </Col>
                                    <Col md={6}>
                                        <input
                                            type="text"
                                            className={styles.formInput}
                                            placeholder="Cargo/Puesto"
                                        />
                                    </Col>
                                    <Col md={6}>
                                        <select className={styles.formInput} required>
                                            <option value="">Tamaño de la institución *</option>
                                            <option value="1-50">1-50 usuarios</option>
                                            <option value="51-200">51-200 usuarios</option>
                                            <option value="201-500">201-500 usuarios</option>
                                            <option value="500+">Más de 500 usuarios</option>
                                        </select>
                                    </Col>
                                    <Col xs={12}>
                                        <textarea
                                            className={styles.formTextarea}
                                            rows={4}
                                            placeholder="Cuéntanos sobre tus necesidades y qué te gustaría probar en el demo"
                                        ></textarea>
                                    </Col>
                                    <Col xs={12} className="text-center mt-4">
                                        <button type="submit" className={styles.ctaPrimary}>
                                            Solicitar Demo Gratuito
                                        </button>
                                    </Col>
                                </Row>
                            </form>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* Footer */}
            <footer className={styles.footer}>
                <Container>
                    <Row>
                        <Col className="text-center">
                            <p className="mb-0">&copy; 2026 Fluxio RSV. Todos los derechos reservados.</p>
                        </Col>
                    </Row>
                </Container>
            </footer>
        </div>
    );
}

const features = [
    {
        icon: '🏛️',
        title: 'Gestión de Espacios',
        description: 'Administra salones, auditorios, áreas comunes y salas de juntas con calendarios inteligentes'
    },
    {
        icon: '🔧',
        title: 'Control de Equipos',
        description: 'Rastrea préstamos de equipos con comunicación directa a tu área de vigilancia'
    },
    {
        icon: '🎓',
        title: 'Talleres y Eventos',
        description: 'Organiza talleres y cursos de capacitación con inscripciones, aprobaciones y seguimiento'
    },
    {
        icon: '👤',
        title: 'Gestión de Usuarios',
        description: 'Administra usuarios y sus privilegios de acceso con roles personalizados'
    },
    {
        icon: '📋',
        title: 'Reportes y Exportación',
        description: 'Genera listas de asistencia para talleres y descarga inventarios de equipos y espacios'
    },
    {
        icon: '🎨',
        title: 'Personalización Total',
        description: 'Colores, logos y configuraciones adaptadas a tu marca'
    }
];

const screenshots = [
    {
        title: 'Dashboard Administrativo',
        description: 'Vista completa de todas las operaciones en tiempo real',
        image: '/screenshots/Imagen_1.png'
    },
    {
        title: 'Gestión de Recursos',
        description: 'Interfaz intuitiva para administrar espacios y equipos',
        image: '/screenshots/Imagen_2.png'
    },
    {
        title: 'Calendario de Reservas',
        description: 'Visualiza y gestiona todas las reservas en un solo lugar',
        image: '/screenshots/Imagen_3.png'
    },
    {
        title: 'Reportes Detallados',
        description: 'Genera informes profesionales con un solo clic',
        image: '/screenshots/Imagen_4.png'
    }
];

const defaultPricingPlans = [
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
