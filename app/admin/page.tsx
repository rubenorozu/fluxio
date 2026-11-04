'use client';

import { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, ButtonGroup, Form, Badge } from 'react-bootstrap';
import Link from 'next/link';
import { useSession } from '@/context/SessionContext';
import { Role } from '@prisma/client';
import { GroupedReservation } from '@/components/admin/reservations/types';
import ReservationCard from '@/components/admin/reservations/ReservationCard';
import { useRouter } from 'next/navigation';
import {
  Building2,
  CalendarDays,
  BarChart3,
  Settings,
  ChevronRight,
  Clock,
  CheckCircle2,
  Users,
  GraduationCap,
  Boxes,
  Camera,
  MapPin,
  FileSpreadsheet,
  Calendar,
  Sparkles,
  RefreshCw,
  Search,
  ArrowRight,
  ShieldCheck,
  Inbox,
} from 'lucide-react';

interface DashboardStats {
  pendingReservations: number;
  activeWorkshops: number;
  pendingInscriptions: number;
  waitlistInscriptions: number;
  totalSpaces: number;
  totalEquipment: number;
  totalResources: number;
  totalUsers: number;
}

interface AdminModule {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: any;
  color: string;
  badge?: string;
  isHighlight?: boolean;
  visible: boolean;
}

interface AdminCategory {
  id: string;
  title: string;
  description: string;
  icon: any;
  accentColor: string;
  modules: AdminModule[];
}

export default function AdminDashboardPage() {
  const { user, loading: sessionLoading } = useSession();
  const router = useRouter();

  // Estados de reservaciones
  const [groupedReservations, setGroupedReservations] = useState<GroupedReservation[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all' | 'partially_approved'>('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const pageSize = 10;

  // Estadísticas KPI
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Cargar estadísticas KPI
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/dashboard-stats');
      if (res.ok) {
        const data: DashboardStats = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error al cargar KPIs del dashboard:', err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionLoading && user) {
      fetchStats();
    }
  }, [sessionLoading, user, fetchStats]);

  // Cargar reservaciones
  const fetchReservations = async (
    statusFilter: 'pending' | 'approved' | 'rejected' | 'all' | 'partially_approved',
    page: number = 1,
    searchQuery: string = ''
  ) => {
    setLoadingReservations(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/reservations?status=${statusFilter}&page=${page}&pageSize=${pageSize}&search=${searchQuery}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cargar las reservaciones.');
      }
      const result = await response.json();
      setGroupedReservations(result.data);
      setTotalPages(result.pagination.pageCount);
      setTotalItems(result.pagination.total);
      setCurrentPage(result.pagination.page);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado');
      }
    } finally {
      setLoadingReservations(false);
    }
  };

  useEffect(() => {
    if (!sessionLoading && user?.role === Role.CALENDAR_VIEWER) {
      router.push('/admin/calendars');
    }
  }, [sessionLoading, user, router]);

  useEffect(() => {
    if (
      !sessionLoading &&
      user &&
      (user.role === Role.SUPERUSER ||
        user.role === Role.ADMIN_RESERVATION ||
        user.role === Role.ADMIN_RESOURCE)
    ) {
      const handler = setTimeout(() => {
        fetchReservations(filter, currentPage, searchTerm);
      }, 400);

      return () => clearTimeout(handler);
    }
  }, [sessionLoading, user, filter, currentPage, searchTerm]);

  const handleApproveReject = useCallback(
    async (reservationId: string, action: 'approve' | 'reject') => {
      if (action === 'reject' && !window.confirm(`¿Estás seguro de que quieres rechazar esta reservación?`)) {
        return;
      }

      try {
        const response = await fetch(`/api/admin/reservations/${reservationId}/${action}`, {
          method: 'POST',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Error al ${action === 'approve' ? 'aprobar' : 'rechazar'} la reservación.`);
        }

        fetchReservations(filter);
        fetchStats(); // Actualizar contadores
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
          alert(`Error: ${err.message}`);
        } else {
          setError('Ocurrió un error inesperado');
          alert('Ocurrió un error inesperado');
        }
      }
    },
    [filter, fetchStats]
  );

  if (sessionLoading || !user || user.role === Role.CALENDAR_VIEWER) {
    return (
      <Container className="mt-5 text-center" style={{ paddingTop: '100px' }}>
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Cargando panel de control...</p>
      </Container>
    );
  }

  const allowedRoles: Role[] = [Role.SUPERUSER, Role.ADMIN_RESERVATION, Role.ADMIN_RESOURCE, Role.CALENDAR_VIEWER];
  if (!allowedRoles.includes(user.role)) {
    return (
      <Container style={{ paddingTop: '100px' }}>
        <Alert variant="danger">Acceso denegado. No tienes permisos para ver esta página.</Alert>
      </Container>
    );
  }

  const isSuperUser = user.role === Role.SUPERUSER;
  const isAdminResource = user.role === Role.ADMIN_RESOURCE;
  const isAdminReservation = user.role === Role.ADMIN_RESERVATION;

  // Definición de Categorías y Módulos
  const categories: AdminCategory[] = [
    {
      id: 'spaces',
      title: 'Espacios e Inventario',
      description: 'Aulas, laboratorios y catálogo de equipo técnico',
      icon: Building2,
      accentColor: '#0284C7',
      modules: [
        {
          id: 'spaces',
          title: 'Espacios y Aulas',
          description: 'Gestión de salones, cabinas y áreas de trabajo.',
          href: '/admin/spaces',
          icon: Building2,
          color: '#0284C7',
          badge: stats ? `${stats.totalSpaces} aulas` : undefined,
          visible: isSuperUser || isAdminResource,
        },
        {
          id: 'equipment',
          title: 'Equipos Técnicos',
          description: 'Inventario y disponibilidad de equipo audiovisual.',
          href: '/admin/equipment',
          icon: Camera,
          color: '#2563EB',
          badge: stats ? `${stats.totalEquipment} ítems` : undefined,
          visible: isSuperUser || isAdminResource,
        },
        {
          id: 'locations',
          title: 'Sedes y Edificios',
          description: 'Ubicaciones físicas, campus y distribución.',
          href: '/admin/locations',
          icon: MapPin,
          color: '#0D9488',
          visible: isSuperUser || isAdminResource,
        },
      ],
    },
    {
      id: 'operations',
      title: 'Operación y Agendas',
      description: 'Calendarios en vivo, talleres académicos y asistencias',
      icon: CalendarDays,
      accentColor: '#157557',
      modules: [
        {
          id: 'calendars',
          title: 'Calendarios en Vivo',
          description: 'Disponibilidad y reservas en tiempo real.',
          href: '/admin/calendars',
          icon: Calendar,
          color: '#157557',
          badge: 'En vivo',
          visible: isSuperUser || isAdminResource || isAdminReservation,
        },
        {
          id: 'workshops',
          title: 'Talleres y Eventos',
          description: 'Creación, cupos, códigos QR y pase de asistencia.',
          href: '/admin/workshops',
          icon: GraduationCap,
          color: '#059669',
          badge: stats ? `${stats.activeWorkshops} activos` : undefined,
          isHighlight: true,
          visible: isSuperUser || isAdminResource,
        },
        {
          id: 'inscriptions',
          title: 'Inscripciones y Espera',
          description: 'Aprobaciones y lista de espera por taller.',
          href: '/admin/inscriptions',
          icon: Users,
          color: '#D97706',
          badge: stats && stats.waitlistInscriptions > 0 ? `${stats.waitlistInscriptions} en espera` : undefined,
          visible: isSuperUser || isAdminResource || isAdminReservation,
        },
      ],
    },
    {
      id: 'reports',
      title: 'Métricas y Auditoría',
      description: 'Bitácoras cuatrimestrales y reportes institucionales',
      icon: BarChart3,
      accentColor: '#EA580C',
      modules: [
        {
          id: 'bitacora',
          title: 'Bitácora Cuatrimestral',
          description: 'Métricas de horas recurrentes y rentas en Excel.',
          href: '/admin/bitacora',
          icon: FileSpreadsheet,
          color: '#EA580C',
          badge: 'Excel Oficial',
          isHighlight: true,
          visible: isSuperUser || isAdminResource,
        },
        {
          id: 'reports',
          title: 'Reportes de Uso',
          description: 'Estadísticas de ocupación y uso general.',
          href: '/admin/reports',
          icon: BarChart3,
          color: '#7C3AED',
          visible: isSuperUser || isAdminResource,
        },
      ],
    },
    {
      id: 'system',
      title: 'Administración del Sistema',
      description: 'Usuarios, permisos y personalización global',
      icon: Settings,
      accentColor: '#475569',
      modules: [
        {
          id: 'users',
          title: 'Usuarios y Permisos',
          description: 'Cuentas institucionales, roles y accesos.',
          href: '/admin/users',
          icon: ShieldCheck,
          color: '#475569',
          badge: stats ? `${stats.totalUsers} usuarios` : undefined,
          visible: isSuperUser,
        },
        {
          id: 'settings',
          title: 'Configuración Institucional',
          description: 'Logos, colores, políticas y avisos.',
          href: '/admin/settings',
          icon: Settings,
          color: '#334155',
          visible: isSuperUser,
        },
      ],
    },
  ];

  const visibleCategories = categories
    .map((cat) => ({ ...cat, visibleModules: cat.modules.filter((m) => m.visible) }))
    .filter((cat) => cat.visibleModules.length > 0);

  const displayedCategories =
    selectedCategory === 'all'
      ? visibleCategories
      : visibleCategories.filter((cat) => cat.id === selectedCategory);

  const currentDateFormatted = new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="admin-dashboard-container" style={{ paddingTop: '95px', paddingBottom: '70px', backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      <style jsx global>{`
        .kpi-compact-card {
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          border-radius: 12px;
          padding: 14px 16px;
        }
        .kpi-compact-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(15, 23, 42, 0.07) !important;
        }
        .admin-modules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 280px));
          gap: 14px;
        }
        @media (max-width: 576px) {
          .admin-modules-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }
        }
        .module-compact-card {
          transition: all 0.15s ease-in-out;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          text-decoration: none !important;
          color: inherit !important;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 116px;
          padding: 14px 16px;
        }
        .module-compact-card:hover {
          transform: translateY(-2px);
          border-color: #94A3B8 !important;
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08) !important;
        }
        .module-card-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: #0F172A;
          margin-bottom: 5px;
          line-height: 1.3;
        }
        .module-card-desc {
          font-size: 0.78rem;
          color: #64748B;
          line-height: 1.4;
          margin-bottom: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .filter-rect-btn {
          border-radius: 0px !important;
          font-weight: 500;
          font-size: 0.82rem;
          padding: 6px 14px;
          white-space: nowrap;
          transition: all 0.15s ease;
        }
      `}</style>

      <Container style={{ maxWidth: '1160px' }} className="px-3">
        {/* ENCABEZADO PRINCIPAL */}
        <div className="bg-white rounded-3 p-3 p-md-4 shadow-xs border mb-3">
          <Row className="align-items-center">
            <Col md={7}>
              <div className="d-flex align-items-center gap-2 mb-1.5">
                <span className="badge bg-primary bg-opacity-10 text-primary px-2.5 py-1 fw-bold rounded-pill" style={{ fontSize: '0.74rem' }}>
                  Panel Administrativo
                </span>
                <span className="text-muted small text-capitalize">• {currentDateFormatted}</span>
              </div>
              <h1 className="h4 fw-bold text-dark mb-1.5">
                Bienvenido, {user.firstName ? `${user.firstName} ${user.lastName}` : user.email}
              </h1>
              <p className="text-muted mb-0" style={{ fontSize: '0.85rem', lineHeight: '1.45' }}>
                Gestiona reservaciones de espacios, equipos, talleres presenciales y métricas institucionales.
              </p>
            </Col>
            <Col md={5} className="text-md-end mt-3 mt-md-0 d-flex gap-2 justify-content-md-end">
              <Link href="/admin/calendars" className="btn btn-sm btn-outline-secondary fw-medium rounded-pill px-3 py-1.5 d-inline-flex align-items-center gap-1.5" style={{ fontSize: '0.82rem' }}>
                <Calendar size={14} />
                <span>Calendario</span>
              </Link>
              <Link href="/admin/workshops" className="btn btn-sm text-white fw-medium rounded-pill px-3 py-1.5 d-inline-flex align-items-center gap-1.5 shadow-xs" style={{ backgroundColor: '#157557', borderColor: '#157557', fontSize: '0.82rem' }}>
                <GraduationCap size={14} />
                <span>Talleres y QR</span>
              </Link>
            </Col>
          </Row>
        </div>

        {/* BARRA DE TARJETAS KPI (MÉTRICAS CLAVE COMPACTAS CON AIRE) */}
        <Row className="g-3 mb-4">
          {/* KPI 1: Reservaciones Pendientes */}
          <Col xs={6} md={3}>
            <div
              className="kpi-compact-card bg-white border shadow-xs h-100 d-flex flex-column justify-content-between"
              style={{ cursor: 'pointer', borderLeft: '3px solid #F59E0B' }}
              onClick={() => {
                setFilter('pending');
                const element = document.getElementById('reservaciones-section');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.6px' }}>
                  Reservas Pendientes
                </span>
                <div className="p-1 rounded-2 bg-warning bg-opacity-10 text-warning d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}>
                  <Clock size={16} />
                </div>
              </div>
              <div className="d-flex align-items-baseline gap-2 mb-1">
                <span className="fs-4 fw-bold text-dark">{stats ? stats.pendingReservations : 0}</span>
                {stats && stats.pendingReservations > 0 ? (
                  <Badge bg="warning" text="dark" style={{ fontSize: '0.68rem', padding: '3px 7px' }}>Por revisar</Badge>
                ) : (
                  <Badge bg="success" style={{ fontSize: '0.68rem', padding: '3px 7px' }}>Al día</Badge>
                )}
              </div>
              <span className="text-secondary" style={{ fontSize: '0.75rem', lineHeight: '1.3' }}>
                {stats && stats.pendingReservations > 0 ? 'Requieren tu aprobación' : 'Sin solicitudes pendientes'}
              </span>
            </div>
          </Col>

          {/* KPI 2: Talleres Activos */}
          <Col xs={6} md={3}>
            <Link href="/admin/workshops" className="text-decoration-none">
              <div className="kpi-compact-card bg-white border shadow-xs h-100 d-flex flex-column justify-content-between" style={{ borderLeft: '3px solid #157557' }}>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.6px' }}>
                    Talleres Activos
                  </span>
                  <div className="p-1 rounded-2 bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}>
                    <GraduationCap size={16} />
                  </div>
                </div>
                <div className="d-flex align-items-baseline gap-2 mb-1">
                  <span className="fs-4 fw-bold text-dark">{stats ? stats.activeWorkshops : 0}</span>
                  <Badge bg="success" style={{ fontSize: '0.68rem', padding: '3px 7px' }}>Con Check-in QR</Badge>
                </div>
                <span className="text-secondary" style={{ fontSize: '0.75rem', lineHeight: '1.3' }}>
                  Inscripciones y asistencia en vivo
                </span>
              </div>
            </Link>
          </Col>

          {/* KPI 3: Inscripciones & Lista de Espera */}
          <Col xs={6} md={3}>
            <Link href="/admin/inscriptions" className="text-decoration-none">
              <div className="kpi-compact-card bg-white border shadow-xs h-100 d-flex flex-column justify-content-between" style={{ borderLeft: '3px solid #0284C7' }}>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.6px' }}>
                    Lista de Espera
                  </span>
                  <div className="p-1 rounded-2 bg-info bg-opacity-10 text-info d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}>
                    <Users size={16} />
                  </div>
                </div>
                <div className="d-flex align-items-baseline gap-2 mb-1">
                  <span className="fs-4 fw-bold text-dark">{stats ? stats.waitlistInscriptions : 0}</span>
                  <Badge bg="info" text="dark" style={{ fontSize: '0.68rem', padding: '3px 7px' }}>En cola</Badge>
                </div>
                <span className="text-secondary" style={{ fontSize: '0.75rem', lineHeight: '1.3' }}>
                  {stats && stats.waitlistInscriptions > 0 ? 'Alumnos esperando cupo' : 'Sin cola de espera'}
                </span>
              </div>
            </Link>
          </Col>

          {/* KPI 4: Recursos en Catálogo */}
          <Col xs={6} md={3}>
            <Link href="/admin/spaces" className="text-decoration-none">
              <div className="kpi-compact-card bg-white border shadow-xs h-100 d-flex flex-column justify-content-between" style={{ borderLeft: '3px solid #475569' }}>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.6px' }}>
                    Recursos Totales
                  </span>
                  <div className="p-1 rounded-2 bg-secondary bg-opacity-10 text-secondary d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}>
                    <Boxes size={16} />
                  </div>
                </div>
                <div className="d-flex align-items-baseline gap-2 mb-1">
                  <span className="fs-4 fw-bold text-dark">{stats ? stats.totalResources : 0}</span>
                  <Badge bg="secondary" style={{ fontSize: '0.68rem', padding: '3px 7px' }}>Activos</Badge>
                </div>
                <span className="text-secondary" style={{ fontSize: '0.75rem', lineHeight: '1.3' }}>
                  {stats ? `${stats.totalSpaces} aulas • ${stats.totalEquipment} equipos` : 'Catálogo institucional'}
                </span>
              </div>
            </Link>
          </Col>
        </Row>

        {/* SECCIÓN DE MÓDULOS DEL SISTEMA (TARJETAS COMPACTAS CON MEJOR LECTURA) */}
        <div className="mb-4">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
            <div>
              <h2 className="h6 fw-bold text-dark mb-0">Módulos de Gestión</h2>
              <p className="text-muted small mb-0" style={{ fontSize: '0.8rem' }}>
                Herramientas organizadas por áreas de trabajo.
              </p>
            </div>

            {/* Selector de Áreas (Sin redondeo, estrictamente en un solo renglón) */}
            <div
              className="d-flex flex-nowrap align-items-center bg-white border shadow-xs"
              style={{
                borderRadius: '0px',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
                padding: '3px',
                gap: '3px',
              }}
            >
              <button
                type="button"
                className={`btn btn-sm text-nowrap rounded-0 ${selectedCategory === 'all' ? 'btn-primary text-white' : 'btn-light text-secondary border-0 bg-transparent'}`}
                style={{ borderRadius: '0px', fontSize: '0.82rem', padding: '6px 14px', fontWeight: 500, whiteSpace: 'nowrap' }}
                onClick={() => setSelectedCategory('all')}
              >
                Todos los Módulos
              </button>
              {visibleCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`btn btn-sm text-nowrap rounded-0 ${selectedCategory === cat.id ? 'btn-primary text-white' : 'btn-light text-secondary border-0 bg-transparent'}`}
                  style={{ borderRadius: '0px', fontSize: '0.82rem', padding: '6px 14px', fontWeight: 500, whiteSpace: 'nowrap' }}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.title}
                </button>
              ))}
            </div>
          </div>

          {/* Grilla Compacta de Módulos */}
          <div className="d-flex flex-column gap-4">
            {displayedCategories.map((category) => {
              const CategoryIcon = category.icon;
              return (
                <div key={category.id}>
                  {selectedCategory === 'all' && (
                    <div className="d-flex align-items-center gap-2 mb-2.5">
                      <div
                        className="p-1 rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ backgroundColor: `${category.accentColor}15`, color: category.accentColor, width: '22px', height: '22px' }}
                      >
                        <CategoryIcon size={13} />
                      </div>
                      <span className="fw-bold text-dark text-uppercase" style={{ fontSize: '0.74rem', letterSpacing: '0.6px' }}>
                        {category.title}
                      </span>
                      <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                        — {category.description}
                      </span>
                    </div>
                  )}

                  <div className="admin-modules-grid">
                    {category.visibleModules.map((module) => {
                      const ModuleIcon = module.icon;
                      return (
                        <Link
                          key={module.id}
                          href={module.href}
                          className="module-compact-card position-relative"
                        >
                          <div className="d-flex align-items-start justify-content-between mb-2.5">
                            <div
                              className="p-1.5 rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
                              style={{ backgroundColor: `${module.color}15`, color: module.color, width: '34px', height: '34px' }}
                            >
                              <ModuleIcon size={18} />
                            </div>
                            {module.badge && (
                              <Badge
                                bg={module.isHighlight ? 'success' : 'light'}
                                text={module.isHighlight ? 'white' : 'secondary'}
                                className="border fw-semibold"
                                style={{ fontSize: '0.68rem', padding: '3px 8px' }}
                              >
                                {module.badge}
                              </Badge>
                            )}
                          </div>
                          <div>
                            <div className="module-card-title text-truncate">
                              {module.title}
                            </div>
                            <p className="module-card-desc">
                              {module.description}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECCIÓN DE BANDEJA DE RESERVACIONES */}
        <div id="reservaciones-section" className="bg-white rounded-3 p-3 p-md-4 shadow-xs border mb-4">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4 pb-3 border-bottom">
            <div>
              <div className="d-flex align-items-center gap-2">
                <h2 className="h5 fw-bold text-dark mb-0">Bandeja de Reservaciones</h2>
                {stats && stats.pendingReservations > 0 && (
                  <Badge bg="danger" className="rounded-pill">
                    {stats.pendingReservations} pendientes
                  </Badge>
                )}
              </div>
              <p className="text-muted small mb-0">
                Revisa, aprueba o gestiona las solicitudes de préstamo de espacios y equipos.
              </p>
            </div>

            {/* Filtros de Estado (Botones rectangulares en un renglón) */}
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <ButtonGroup className="shadow-xs rounded-0">
                <Button
                  variant={filter === 'pending' ? 'primary' : 'outline-primary'}
                  size="sm"
                  className="rounded-0 text-nowrap"
                  onClick={() => setFilter('pending')}
                >
                  Pendientes {stats && stats.pendingReservations > 0 ? `(${stats.pendingReservations})` : ''}
                </Button>
                <Button
                  variant={filter === 'approved' ? 'primary' : 'outline-primary'}
                  size="sm"
                  className="rounded-0 text-nowrap"
                  onClick={() => setFilter('approved')}
                >
                  Aprobadas
                </Button>
                <Button
                  variant={filter === 'partially_approved' ? 'primary' : 'outline-primary'}
                  size="sm"
                  className="rounded-0 text-nowrap"
                  onClick={() => setFilter('partially_approved')}
                >
                  Parciales
                </Button>
                <Button
                  variant={filter === 'rejected' ? 'primary' : 'outline-primary'}
                  size="sm"
                  className="rounded-0 text-nowrap"
                  onClick={() => setFilter('rejected')}
                >
                  Rechazadas
                </Button>
                <Button
                  variant={filter === 'all' ? 'primary' : 'outline-primary'}
                  size="sm"
                  className="rounded-0 text-nowrap"
                  onClick={() => setFilter('all')}
                >
                  Todas
                </Button>
              </ButtonGroup>

              <div className="position-relative" style={{ minWidth: '220px' }}>
                <Search size={15} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                <Form.Control
                  type="text"
                  size="sm"
                  placeholder="Buscar alumno, materia..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="ps-5 rounded-0"
                />
              </div>

              <Button
                variant="outline-secondary"
                size="sm"
                className="rounded-0 p-2"
                onClick={() => fetchReservations(filter, currentPage, searchTerm)}
                title="Refrescar lista"
              >
                <RefreshCw size={14} />
              </Button>
            </div>
          </div>

          {/* ESTADO DE CARGA */}
          {loadingReservations && (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted small">Cargando reservaciones...</p>
            </div>
          )}

          {error && <Alert variant="danger">{error}</Alert>}

          {/* CONTENIDO DE RESERVACIONES O EMPTY STATE PROFESIONAL */}
          {!loadingReservations && !error && (
            groupedReservations.length === 0 ? (
              <div className="text-center py-5 px-3 rounded-4 bg-light border border-dashed my-2">
                <div className="mx-auto mb-3 p-3 rounded-circle bg-success bg-opacity-10 text-success d-inline-flex align-items-center justify-content-center" style={{ width: '68px', height: '68px' }}>
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="h5 fw-bold text-dark mb-1">¡Todo al día en esta bandeja!</h3>
                <p className="text-muted small mb-3" style={{ maxWidth: '440px', margin: '0 auto' }}>
                  No hay reservaciones{' '}
                  <strong>
                    {filter === 'pending'
                      ? 'pendientes de aprobación'
                      : filter === 'approved'
                      ? 'aprobadas'
                      : filter === 'rejected'
                      ? 'rechazadas'
                      : 'en esta categoría'}
                  </strong>
                  . Puedes consultar el calendario o cambiar el filtro.
                </p>
                <div className="d-flex justify-content-center gap-2">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="rounded-pill px-3"
                    onClick={() => setFilter(filter === 'pending' ? 'approved' : 'pending')}
                  >
                    Ver Reservaciones {filter === 'pending' ? 'Aprobadas' : 'Pendientes'}
                  </Button>
                  <Link href="/admin/calendars" className="btn btn-sm btn-primary rounded-pill px-3">
                    Abrir Calendarios
                  </Link>
                </div>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {groupedReservations
                  .filter((group) => group.items && group.items.length > 0)
                  .map((group) => (
                    <ReservationCard
                      key={group.cartSubmissionId}
                      group={group}
                      filter={filter}
                      handleApproveReject={handleApproveReject}
                      currentUser={user}
                    />
                  ))}
              </div>
            )
          )}

          {/* PAGINACIÓN */}
          {!loadingReservations && !error && totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4 pt-3 border-top">
              <ButtonGroup className="shadow-xs">
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                {[...Array(totalPages)].map((_, index) => (
                  <Button
                    key={index + 1}
                    size="sm"
                    variant={currentPage === index + 1 ? 'primary' : 'outline-primary'}
                    onClick={() => setCurrentPage(index + 1)}
                  >
                    {index + 1}
                  </Button>
                ))}
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </ButtonGroup>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
