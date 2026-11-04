'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Users,
  CheckCircle2,
  Clock,
  Maximize2,
  Minimize2,
  RefreshCw,
  Download,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  UserCheck,
  UserX,
  ListOrdered,
} from 'lucide-react';

interface InscriptionItem {
  id: string;
  checkedIn: boolean;
  checkedInAt: string | null;
  status: string;
  waitlistPosition?: number;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    identifier: string | null;
    email: string;
  };
}

interface AttendanceData {
  workshop: {
    id: string;
    name: string;
    teacher: string | null;
    room: string | null;
    startDate: string | null;
    endDate: string | null;
    capacity: number;
    autoApprove: boolean;
    allowWaitlist: boolean;
  };
  stats: {
    capacity: number;
    totalApproved: number;
    totalCheckedIn: number;
    attendanceRate: number;
    totalWaitlist: number;
    totalPending: number;
  };
  approved: InscriptionItem[];
  waitlist: InscriptionItem[];
  pending: InscriptionItem[];
  urls: {
    checkIn: string;
    public: string;
  };
  qr: {
    checkInQrDataUrl: string;
    shareQrDataUrl: string;
  };
}

export default function WorkshopProjectionPage() {
  const params = useParams();
  const router = useRouter();
  const workshopId = params.id as string;

  const [data, setData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'approved' | 'waitlist' | 'all'>('approved');
  const [manualLoadingId, setManualLoadingId] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const containerRef = useRef<HTMLDivElement>(null);

  const fetchAttendanceData = useCallback(async (isSilent = false) => {
    if (!workshopId) return;
    if (!isSilent) setLoading(true);

    try {
      const res = await fetch(`/api/admin/workshops/${workshopId}/attendance`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Error al cargar datos de asistencia');
      }
      const json: AttendanceData = await res.json();
      setData(json);
      setLastRefreshed(new Date());
      setError(null);
    } catch (err: any) {
      if (!isSilent) setError(err.message || 'No se pudo conectar con el servidor');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [workshopId]);

  // Polling automático cada 6 segundos para actualización en vivo
  useEffect(() => {
    fetchAttendanceData(false);
    const interval = setInterval(() => {
      fetchAttendanceData(true);
    }, 6000);

    return () => clearInterval(interval);
  }, [fetchAttendanceData]);

  // Manejo de pantalla completa
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Marcar / Desmarcar asistencia manual (respaldo por si el alumno no trae celular)
  const handleManualCheckIn = async (inscriptionId: string, currentStatus: boolean) => {
    setManualLoadingId(inscriptionId);
    try {
      const res = await fetch(`/api/admin/workshops/${workshopId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inscriptionId,
          action: currentStatus ? 'undo' : 'check-in',
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || 'Error al cambiar asistencia');
      } else {
        await fetchAttendanceData(true);
      }
    } catch (err: any) {
      alert(err.message || 'Error de conexión');
    } finally {
      setManualLoadingId(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-dark text-white">
        <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} />
        <h4 className="fw-light">Cargando pantalla de proyección...</h4>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-dark text-white p-4">
        <AlertCircle size={48} className="text-danger mb-3" />
        <h4 className="mb-2">Error al iniciar proyección</h4>
        <p className="text-secondary">{error}</p>
        <button className="btn btn-outline-light mt-3" onClick={() => router.back()}>
          Volver al panel
        </button>
      </div>
    );
  }

  const { workshop, stats, approved, waitlist, qr } = data!;
  const attendedList = approved.filter((a) => a.checkedIn);
  const pendingAttendanceList = approved.filter((a) => !a.checkedIn);

  return (
    <div
      ref={containerRef}
      className="min-vh-100 bg-dark text-white d-flex flex-column"
      style={{
        backgroundColor: '#0F172A',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Barra Superior */}
      <header className="px-4 py-3 d-flex align-items-center justify-content-between border-bottom border-secondary border-opacity-25 bg-black bg-opacity-30">
        <div className="d-flex align-items-center gap-3">
          <button
            onClick={() => router.back()}
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 text-light border-secondary"
            title="Volver"
          >
            <ArrowLeft size={16} />
            <span className="d-none d-md-inline">Volver</span>
          </button>
          <div>
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-primary text-uppercase px-2 py-1" style={{ fontSize: '0.7rem' }}>
                Registro en Vivo
              </span>
              <span className="text-secondary small">
                Actualizado: {lastRefreshed.toLocaleTimeString('es-MX')}
              </span>
            </div>
            <h1 className="h4 mb-0 fw-bold text-light mt-1 text-truncate" style={{ maxWidth: '600px' }}>
              {workshop.name}
            </h1>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <a
            href={`/api/admin/inscriptions?workshopId=${workshopId}&format=csv`}
            className="btn btn-sm btn-outline-light d-flex align-items-center gap-1"
            title="Descargar reporte oficial en CSV"
          >
            <Download size={16} />
            <span className="d-none d-md-inline">Exportar CSV</span>
          </a>
          <button
            onClick={() => fetchAttendanceData(false)}
            className="btn btn-sm btn-outline-secondary text-light d-flex align-items-center gap-1"
            title="Actualizar datos"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={toggleFullscreen}
            className="btn btn-sm btn-primary d-flex align-items-center gap-1 fw-semibold px-3"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            <span className="d-none d-md-inline">{isFullscreen ? 'Salir' : 'Pantalla Completa'}</span>
          </button>
        </div>
      </header>

      {/* Contenido Principal en 2 Columnas */}
      <div className="flex-grow-1 p-4 d-flex flex-column flex-lg-row gap-4 overflow-hidden">
        {/* Columna Izquierda: QR Gigante y Stats de Proyección */}
        <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center text-center p-4 rounded-4 bg-black bg-opacity-20 border border-secondary border-opacity-25 shadow-lg position-relative">
          {/* Badge Decorativo */}
          <div className="mb-2 d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-primary bg-opacity-20 text-info border border-info border-opacity-30 small">
            <Sparkles size={14} />
            <span>Pase de Asistencia Oficial</span>
          </div>

          <h2 className="display-6 fw-bold text-white mb-1">
            Escanea para registrar tu asistencia
          </h2>
          <p className="text-secondary mb-3 fs-5">
            Apunta la cámara de tu teléfono al código QR en pantalla
          </p>

          {/* Tarjeta del Código QR Gigante */}
          <div
            className="p-3 bg-white rounded-4 shadow-lg mb-3"
            style={{
              transition: 'transform 0.3s ease',
              maxWidth: '380px',
              width: '100%',
            }}
          >
            <img
              src={qr.checkInQrDataUrl}
              alt="QR Pase de Asistencia"
              className="img-fluid rounded-3"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>

          {/* Detalles del Evento */}
          <div className="d-flex flex-wrap justify-content-center gap-3 text-secondary small mb-3">
            {workshop.teacher && (
              <span className="badge bg-dark border border-secondary px-3 py-2 text-light">
                Profesor: <strong className="text-white">{workshop.teacher}</strong>
              </span>
            )}
            {workshop.room && (
              <span className="badge bg-dark border border-secondary px-3 py-2 text-light">
                Aula: <strong className="text-white">{workshop.room}</strong>
              </span>
            )}
          </div>

          {/* Barra de Progreso y Estadísticas en Vivo */}
          <div className="w-100" style={{ maxWidth: '520px' }}>
            <div className="d-flex justify-content-between align-items-center mb-1 text-light">
              <span className="fw-semibold">
                Asistencias Confirmadas: {stats.totalCheckedIn} / {stats.totalApproved}
              </span>
              <span className="badge bg-success fs-6">{stats.attendanceRate}%</span>
            </div>
            <div className="progress" style={{ height: '14px', backgroundColor: '#334155' }}>
              <div
                className="progress-bar progress-bar-striped progress-bar-animated bg-success"
                role="progressbar"
                style={{ width: `${Math.min(100, stats.attendanceRate)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Columna Derecha: Panel Lateral de Gestión y Asistentes */}
        <div
          className="d-flex flex-column rounded-4 bg-black bg-opacity-30 border border-secondary border-opacity-25 shadow-lg p-3"
          style={{ width: '100%', maxWidth: '420px', minWidth: '320px' }}
        >
          {/* Métricas Rápidas */}
          <div className="row g-2 mb-3">
            <div className="col-4">
              <div className="p-2 rounded-3 bg-dark border border-secondary border-opacity-30 text-center">
                <div className="text-secondary small">Asistieron</div>
                <div className="fs-4 fw-bold text-success">{stats.totalCheckedIn}</div>
              </div>
            </div>
            <div className="col-4">
              <div className="p-2 rounded-3 bg-dark border border-secondary border-opacity-30 text-center">
                <div className="text-secondary small">Por Asistir</div>
                <div className="fs-4 fw-bold text-warning">{pendingAttendanceList.length}</div>
              </div>
            </div>
            <div className="col-4">
              <div className="p-2 rounded-3 bg-dark border border-secondary border-opacity-30 text-center">
                <div className="text-secondary small">En Espera</div>
                <div className="fs-4 fw-bold text-info">{stats.totalWaitlist}</div>
              </div>
            </div>
          </div>

          {/* Selector de Pestañas */}
          <div className="btn-group w-100 mb-3" role="group">
            <button
              className={`btn btn-sm ${activeTab === 'approved' ? 'btn-primary' : 'btn-outline-secondary text-light'}`}
              onClick={() => setActiveTab('approved')}
            >
              Inscritos ({approved.length})
            </button>
            <button
              className={`btn btn-sm ${activeTab === 'waitlist' ? 'btn-primary' : 'btn-outline-secondary text-light'}`}
              onClick={() => setActiveTab('waitlist')}
            >
              Lista Espera ({waitlist.length})
            </button>
          </div>

          {/* Lista de Alumnos con Scroll */}
          <div className="flex-grow-1 overflow-auto pe-1" style={{ maxHeight: 'calc(100vh - 280px)' }}>
            {activeTab === 'approved' ? (
              approved.length === 0 ? (
                <div className="text-center py-5 text-secondary">
                  <Users size={32} className="mb-2 opacity-50" />
                  <p className="small mb-0">No hay inscripciones aprobadas para este taller.</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {approved.map((item) => {
                    const isChecked = item.checkedIn;
                    return (
                      <div
                        key={item.id}
                        className={`p-2 rounded-3 border d-flex align-items-center justify-content-between transition-all ${
                          isChecked
                            ? 'bg-success bg-opacity-10 border-success border-opacity-40 text-light'
                            : 'bg-dark border-secondary border-opacity-30 text-secondary'
                        }`}
                      >
                        <div className="d-flex align-items-center gap-2 overflow-hidden">
                          {isChecked ? (
                            <CheckCircle2 size={20} className="text-success flex-shrink-0" />
                          ) : (
                            <Clock size={20} className="text-secondary flex-shrink-0" />
                          )}
                          <div className="text-truncate">
                            <div className="fw-semibold text-light text-truncate" style={{ fontSize: '0.9rem' }}>
                              {item.user.firstName} {item.user.lastName}
                            </div>
                            <div className="small text-secondary text-truncate" style={{ fontSize: '0.75rem' }}>
                              {item.user.identifier || item.user.email}
                              {isChecked && item.checkedInAt && (
                                <span className="text-success ms-1">
                                  • {new Date(item.checkedInAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Botón de Asistencia Manual */}
                        <button
                          onClick={() => handleManualCheckIn(item.id, isChecked)}
                          disabled={manualLoadingId === item.id}
                          className={`btn btn-sm p-1 ms-2 ${
                            isChecked ? 'btn-outline-danger' : 'btn-outline-success'
                          }`}
                          title={isChecked ? 'Quitar asistencia' : 'Registrar asistencia manual'}
                        >
                          {isChecked ? <UserX size={16} /> : <UserCheck size={16} />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )
            ) : waitlist.length === 0 ? (
              <div className="text-center py-5 text-secondary">
                <ListOrdered size={32} className="mb-2 opacity-50" />
                <p className="small mb-0">No hay alumnos en la lista de espera.</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {waitlist.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-2 rounded-3 bg-dark border border-info border-opacity-30 d-flex align-items-center justify-content-between"
                  >
                    <div className="d-flex align-items-center gap-2 overflow-hidden">
                      <span className="badge bg-info text-dark fw-bold rounded-circle px-2 py-1">
                        #{idx + 1}
                      </span>
                      <div className="text-truncate">
                        <div className="fw-semibold text-light text-truncate" style={{ fontSize: '0.9rem' }}>
                          {item.user.firstName} {item.user.lastName}
                        </div>
                        <div className="small text-secondary text-truncate" style={{ fontSize: '0.75rem' }}>
                          {item.user.identifier || item.user.email}
                        </div>
                      </div>
                    </div>
                    <span className="badge bg-secondary bg-opacity-50 text-light small">
                      En espera
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

