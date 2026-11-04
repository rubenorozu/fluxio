'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  LogIn,
  MapPin,
  Calendar,
  User,
  ShieldCheck,
} from 'lucide-react';

interface WorkshopInfo {
  id: string;
  name: string;
  teacher: string | null;
  room: string | null;
  startDate: string | null;
  endDate: string | null;
}

interface InscriptionInfo {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WAITLIST' | 'PENDING_EXTRAORDINARY';
  checkedIn: boolean;
  checkedInAt: string | null;
  user: {
    firstName: string;
    lastName: string;
    identifier: string | null;
    email: string;
  };
}

export default function WorkshopCheckInPage() {
  const params = useParams();
  const router = useRouter();
  const workshopId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [authenticated, setAuthenticated] = useState<boolean>(true);
  const [workshop, setWorkshop] = useState<WorkshopInfo | null>(null);
  const [inscription, setInscription] = useState<InscriptionInfo | null>(null);
  const [checkInResult, setCheckInResult] = useState<{
    success: boolean;
    alreadyCheckedIn?: boolean;
    checkedInAt?: string;
    message?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cargar estado inicial
  useEffect(() => {
    if (!workshopId) return;

    fetch(`/api/workshops/${workshopId}/check-in`)
      .then(async (res) => {
        if (res.status === 401) {
          setAuthenticated(false);
          setLoading(false);
          return null;
        }
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Error al consultar estado del taller');
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setAuthenticated(true);
        setWorkshop(data.workshop);
        setInscription(data.inscription);

        // Si ya tenía asistencia registrada previamente
        if (data.inscription?.checkedIn) {
          setCheckInResult({
            success: true,
            alreadyCheckedIn: true,
            checkedInAt: data.inscription.checkedInAt,
            message: 'Tu asistencia ya fue registrada previamente.',
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Error de conexión');
        setLoading(false);
      });
  }, [workshopId]);

  // Realizar check-in
  const handlePerformCheckIn = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/workshops/${workshopId}/check-in`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok && !data.success) {
        throw new Error(data.message || data.error || 'No se pudo registrar la asistencia');
      }

      setCheckInResult({
        success: true,
        alreadyCheckedIn: data.alreadyCheckedIn,
        checkedInAt: data.checkedInAt,
        message: data.message,
      });

      if (inscription) {
        setInscription({
          ...inscription,
          checkedIn: true,
          checkedInAt: data.checkedInAt || new Date().toISOString(),
        });
      }
    } catch (err: any) {
      setError(err.message || 'Error al registrar asistencia');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light p-4">
        <div className="spinner-border text-primary mb-3" role="status" />
        <p className="text-muted fw-semibold">Verificando tu registro...</p>
      </div>
    );
  }

  // Caso: Usuario no autenticado
  if (!authenticated) {
    const loginUrl = `/login?callbackUrl=${encodeURIComponent(`/workshops/${workshopId}/check-in`)}`;
    return (
      <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center p-3">
        <div className="card shadow-sm border-0 rounded-4 text-center p-4" style={{ maxWidth: '420px', width: '100%' }}>
          <div className="mx-auto mb-3 p-3 bg-primary bg-opacity-10 rounded-circle text-primary" style={{ width: '64px', height: '64px' }}>
            <LogIn size={28} />
          </div>
          <h4 className="fw-bold mb-2">Pase de Asistencia</h4>
          <p className="text-muted small mb-4">
            Para registrar tu asistencia en el taller, inicia sesión con tu cuenta institucional.
          </p>
          <Link href={loginUrl} className="btn btn-primary btn-lg rounded-pill fw-semibold w-100 shadow-sm d-flex align-items-center justify-content-center gap-2">
            <span>Iniciar Sesión</span>
            <ArrowRight size={18} />
          </Link>
          <div className="mt-3">
            <Link href="/" className="text-secondary small text-decoration-none">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center p-3" style={{ paddingTop: '80px', paddingBottom: '40px' }}>
      <div className="card shadow-lg border-0 rounded-4 overflow-hidden" style={{ maxWidth: '480px', width: '100%' }}>
        {/* Cabecera del Taller */}
        <div className="bg-primary text-white p-4 text-center position-relative" style={{ backgroundColor: '#157557' }}>
          <span className="badge bg-white text-primary rounded-pill px-3 py-1 mb-2 fw-semibold text-uppercase" style={{ fontSize: '0.75rem' }}>
            Pase de Asistencia Digital
          </span>
          <h2 className="h4 fw-bold mb-1">{workshop?.name || 'Taller'}</h2>
          {workshop?.teacher && (
            <p className="small mb-0 opacity-75">
              Profesor: <strong>{workshop.teacher}</strong>
            </p>
          )}
          {workshop?.room && (
            <p className="small mb-0 opacity-75">
              Aula: <strong>{workshop.room}</strong>
            </p>
          )}
        </div>

        {/* Contenido según el Estado */}
        <div className="card-body p-4 text-center">
          {error && (
            <div className="alert alert-danger rounded-3 text-start small d-flex align-items-start gap-2 mb-4">
              <AlertCircle size={20} className="flex-shrink-0 mt-1" />
              <div>{error}</div>
            </div>
          )}

          {/* CASO 1: Asistencia confirmada (Nueva o Previa) */}
          {checkInResult?.success ? (
            <div>
              <div className="mx-auto mb-3 p-3 bg-success bg-opacity-10 rounded-circle text-success" style={{ width: '80px', height: '80px' }}>
                <CheckCircle2 size={48} />
              </div>
              <h3 className="h5 fw-bold text-success mb-1">
                {checkInResult.alreadyCheckedIn ? '¡Ya estabas registrado!' : '¡Asistencia Registrada con Éxito!'}
              </h3>
              <p className="text-muted small mb-4">
                {checkInResult.alreadyCheckedIn
                  ? `Tu asistencia ya había sido registrada a las ${new Date(checkInResult.checkedInAt || Date.now()).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} hrs.`
                  : 'Tu asistencia ha quedado registrada correctamente en el sistema.'}
              </p>

              {/* Ficha del Alumno */}
              {inscription?.user && (
                <div className="bg-light p-3 rounded-3 border text-start mb-4">
                  <div className="d-flex align-items-center gap-2 mb-2 text-primary fw-semibold small">
                    <ShieldCheck size={18} />
                    <span>Comprobante de Asistencia</span>
                  </div>
                  <div className="small text-secondary mb-1">
                    <strong>Alumno:</strong> {inscription.user.firstName} {inscription.user.lastName}
                  </div>
                  {inscription.user.identifier && (
                    <div className="small text-secondary mb-1">
                      <strong>Matrícula:</strong> {inscription.user.identifier}
                    </div>
                  )}
                  <div className="small text-secondary">
                    <strong>Hora de Check-in:</strong>{' '}
                    {new Date(checkInResult.checkedInAt || Date.now()).toLocaleTimeString('es-MX', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}{' '}
                    hrs
                  </div>
                </div>
              )}

              <Link href="/my-workshops" className="btn btn-outline-primary rounded-pill w-100 fw-semibold">
                Ver mis talleres
              </Link>
            </div>
          ) : !inscription ? (
            /* CASO 2: Usuario NO inscrito */
            <div>
              <div className="mx-auto mb-3 p-3 bg-danger bg-opacity-10 rounded-circle text-danger" style={{ width: '70px', height: '70px' }}>
                <AlertCircle size={38} />
              </div>
              <h4 className="h5 fw-bold text-danger mb-2">No estás inscrito</h4>
              <p className="text-muted small mb-4">
                No encontramos una inscripción para tu cuenta en este taller. Solo los alumnos con registro confirmado pueden registrar asistencia.
              </p>
              <div className="d-grid gap-2">
                <Link href={`/recursos/${workshopId}`} className="btn btn-primary rounded-pill fw-semibold">
                  Ver información del taller
                </Link>
                <Link href="/my-workshops" className="btn btn-outline-secondary rounded-pill">
                  Mis talleres
                </Link>
              </div>
            </div>
          ) : inscription.status === 'WAITLIST' ? (
            /* CASO 3: Usuario en LISTA DE ESPERA */
            <div>
              <div className="mx-auto mb-3 p-3 bg-warning bg-opacity-10 rounded-circle text-warning" style={{ width: '70px', height: '70px' }}>
                <Clock size={38} />
              </div>
              <h4 className="h5 fw-bold text-dark mb-2">Estás en Lista de Espera</h4>
              <p className="text-muted small mb-4">
                Tu registro se encuentra en lista de espera. Solo los alumnos con cupo confirmado (`APROBADO`) pueden registrar asistencia.
                Si un cupo se libera, el sistema te promoverá automáticamente y te avisará por correo.
              </p>
              <Link href="/my-workshops" className="btn btn-outline-primary rounded-pill w-100">
                Consultar mis talleres
              </Link>
            </div>
          ) : inscription.status === 'PENDING' ? (
            /* CASO 4: Inscripción pendiente */
            <div>
              <div className="mx-auto mb-3 p-3 bg-secondary bg-opacity-10 rounded-circle text-secondary" style={{ width: '70px', height: '70px' }}>
                <Clock size={38} />
              </div>
              <h4 className="h5 fw-bold text-dark mb-2">Inscripción Pendiente</h4>
              <p className="text-muted small mb-4">
                Tu inscripción aún está pendiente de aprobación por el administrador o instructor.
              </p>
              <Link href="/my-workshops" className="btn btn-outline-primary rounded-pill w-100">
                Mis talleres
              </Link>
            </div>
          ) : (
            /* CASO 5: Inscrito y Aprobado, listo para confirmar check-in */
            <div>
              <div className="mx-auto mb-3 p-3 bg-success bg-opacity-10 rounded-circle text-success" style={{ width: '70px', height: '70px' }}>
                <User size={38} />
              </div>
              <h4 className="h5 fw-bold mb-1">
                Hola, {inscription.user.firstName}
              </h4>
              <p className="text-muted small mb-4">
                Tu inscripción está <strong>confirmada</strong>. Presiona el botón para registrar tu asistencia presencial.
              </p>

              <button
                onClick={handlePerformCheckIn}
                disabled={submitting}
                className="btn btn-success btn-lg rounded-pill w-100 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 mb-3"
                style={{ minHeight: '52px' }}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" />
                    <span>Registrando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={20} />
                    <span>Confirmar Mi Asistencia</span>
                  </>
                )}
              </button>

              <p className="text-muted text-xs mb-0" style={{ fontSize: '0.75rem' }}>
                Este registro es único y quedará guardado con tu usuario institucional.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

