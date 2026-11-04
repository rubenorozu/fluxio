'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/context/SessionContext';
import { Spinner, Alert, Container, Badge, Button, Modal } from 'react-bootstrap';
import { CheckCircle2, Clock, AlertTriangle, XCircle, QrCode } from 'lucide-react';

interface Image {
  id: string;
  url: string;
}

interface Inscription {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WAITLIST' | 'PENDING_EXTRAORDINARY';
  checkedIn: boolean;
  checkedInAt: string | null;
  createdAt: string;
  workshop: {
    id: string;
    name: string;
    description: string | null;
    teacher: string | null;
    room: string | null;
    images: Image[];
    type: 'workshop';
  };
}

export default function MyWorkshopsPage() {
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();

  const fetchInscriptions = async () => {
    try {
      const res = await fetch('/api/me/inscriptions');
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al obtener inscripciones');
      }
      const data: Inscription[] = await res.json();
      setInscriptions(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!sessionLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchInscriptions();
    }
  }, [user, sessionLoading, router]);

  const handleCancel = async (inscriptionId: string, workshopName: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas cancelar tu inscripción en "${workshopName}"? Esta acción liberará tu lugar.`)) {
      return;
    }

    setCancelingId(inscriptionId);
    try {
      const res = await fetch(`/api/me/inscriptions/${inscriptionId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'No se pudo cancelar la inscripción');
      }

      alert('Tu inscripción ha sido cancelada.');
      await fetchInscriptions();
    } catch (err: any) {
      alert(err.message || 'Error al cancelar');
    } finally {
      setCancelingId(null);
    }
  };

  if (sessionLoading || loading) {
    return (
      <Container className="mt-5 text-center" style={{ paddingTop: '100px' }}>
        <Spinner animation="border" />
        <p className="mt-2 text-muted">Cargando tus inscripciones...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5" style={{ paddingTop: '100px' }}>
        <Alert variant="danger">Error: {error}</Alert>
      </Container>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '100px', paddingBottom: '60px' }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2 style={{ color: '#0076A8' }} className="fw-bold mb-1">Mis Talleres</h2>
          <p className="text-muted small mb-0">Gestiona tus inscripciones, lista de espera y pases de asistencia.</p>
        </div>
        <Link href="/workshops" className="btn btn-outline-primary btn-sm">
          Explorar Más Talleres
        </Link>
      </div>
      <hr />

      {inscriptions.length === 0 ? (
        <div className="text-center py-5 bg-light rounded-4 border">
          <p className="text-muted fs-5 mb-3">No estás inscrito en ningún taller actualmente.</p>
          <Link href="/workshops" className="btn btn-primary" style={{ backgroundColor: '#0076A8', borderColor: '#0076A8' }}>
            Explorar Talleres Disponibles
          </Link>
        </div>
      ) : (
        <div className="row g-4">
          {inscriptions.map((ins) => {
            const { workshop } = ins;
            const imageUrl = workshop.images && workshop.images.length > 0 ? workshop.images[0].url : '/placeholder.svg';

            return (
              <div key={ins.id} className="col-12 col-md-6 col-lg-4">
                <div className="card h-100 shadow-sm border rounded-3 overflow-hidden d-flex flex-column">
                  <div style={{ position: 'relative', width: '100%', height: '160px' }}>
                    <img
                      src={imageUrl}
                      alt={workshop.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div className="position-absolute top-0 end-0 p-2">
                      {ins.status === 'APPROVED' && (
                        <Badge bg="success" className="px-2 py-1 shadow-sm">
                          Aprobada
                        </Badge>
                      )}
                      {ins.status === 'WAITLIST' && (
                        <Badge bg="info" className="text-dark px-2 py-1 shadow-sm">
                          En Lista de Espera
                        </Badge>
                      )}
                      {ins.status === 'PENDING' && (
                        <Badge bg="warning" className="text-dark px-2 py-1 shadow-sm">
                          Pendiente
                        </Badge>
                      )}
                      {ins.status === 'REJECTED' && (
                        <Badge bg="danger" className="px-2 py-1 shadow-sm">
                          Rechazada
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title fw-bold text-dark text-truncate mb-2" title={workshop.name}>
                      {workshop.name}
                    </h5>

                    {workshop.teacher && (
                      <p className="card-text text-muted small mb-1">
                        <strong>Profesor:</strong> {workshop.teacher}
                      </p>
                    )}
                    {workshop.room && (
                      <p className="card-text text-muted small mb-2">
                        <strong>Aula:</strong> {workshop.room}
                      </p>
                    )}

                    {/* Estado de Asistencia o Espera */}
                    <div className="mt-2 mb-3">
                      {ins.status === 'APPROVED' ? (
                        ins.checkedIn ? (
                          <div className="alert alert-success py-1 px-2 small mb-0 d-flex align-items-center gap-1">
                            <CheckCircle2 size={16} />
                            <span>
                              Asistencia registrada (
                              {new Date(ins.checkedInAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                            </span>
                          </div>
                        ) : (
                          <Link
                            href={`/workshops/${workshop.id}/check-in`}
                            className="btn btn-sm btn-outline-success w-100 d-flex align-items-center justify-content-center gap-1"
                          >
                            <QrCode size={16} />
                            <span>Pase de Asistencia Digital</span>
                          </Link>
                        )
                      ) : ins.status === 'WAITLIST' ? (
                        <div className="alert alert-info py-1 px-2 small mb-0 text-dark">
                          <Clock size={14} className="me-1" />
                          <span>Si se libera un lugar, el sistema te promoverá de forma automática.</span>
                        </div>
                      ) : ins.status === 'PENDING' ? (
                        <div className="alert alert-warning py-1 px-2 small mb-0 text-dark">
                          <Clock size={14} className="me-1" />
                          <span>Esperando aprobación del instructor o administrador.</span>
                        </div>
                      ) : null}
                    </div>

                    {/* Botones de Acción */}
                    <div className="mt-auto d-flex justify-content-between align-items-center pt-2 border-top">
                      <Link href={`/recursos/${workshop.id}`} className="btn btn-link text-decoration-none p-0 small">
                        Ver Detalles
                      </Link>

                      <Button
                        variant="outline-danger"
                        size="sm"
                        disabled={cancelingId === ins.id}
                        onClick={() => handleCancel(ins.id, workshop.name)}
                      >
                        {cancelingId === ins.id ? 'Cancelando...' : 'Cancelar'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
