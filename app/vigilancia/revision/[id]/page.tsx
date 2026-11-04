'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ShieldCheck, 
  ArrowLeft, 
  User, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Barcode, 
  AlertCircle,
  FileText,
  RefreshCw
} from 'lucide-react';

interface InspectionItem {
  id: string;
  name: string;
  fixedAssetId: string;
  serialNumber: string;
  checkedOutAt: string | null;
  checkedInAt: string | null;
  checkedOutByName: string | null;
  checkedInByName: string | null;
}

interface InspectionData {
  displayId: string;
  cartSubmissionId: string;
  status: 'PENDING_CHECKOUT' | 'CHECKED_OUT' | 'CHECKED_IN';
  reservationStatus: string;
  startTime: string;
  endTime: string;
  user: {
    name: string;
    email: string;
    identifier: string;
    phoneNumber: string;
  };
  items: InspectionItem[];
}

export default function VigilanciaRevisionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [data, setData] = useState<InspectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchInspectionData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/vigilancia/reservations/${encodeURIComponent(id)}`);
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('No tienes permisos de Vigilancia para ver este reporte.');
        }
        if (res.status === 404) {
          throw new Error(`No se encontró la reservación con folio ${id}.`);
        }
        throw new Error('Error al cargar la información de la reservación.');
      }
      const json: InspectionData = await res.json();
      setData(json);

      // Pre-check items if already checked out or in
      const initialChecked: Record<string, boolean> = {};
      json.items.forEach(item => {
        initialChecked[item.id] = false;
      });
      setCheckedItems(initialChecked);
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspectionData();
  }, [id]);

  const handleToggleItem = (itemId: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleSelectAll = () => {
    if (!data) return;
    const allChecked = data.items.every(item => checkedItems[item.id]);
    const nextState: Record<string, boolean> = {};
    data.items.forEach(item => {
      nextState[item.id] = !allChecked;
    });
    setCheckedItems(nextState);
  };

  const handleConfirmAction = async (action: 'checkout' | 'checkin') => {
    if (!data) return;

    const actionText = action === 'checkout' ? 'SALIDA' : 'RETORNO / DEVOLUCIÓN';
    const checkedCount = Object.values(checkedItems).filter(Boolean).length;

    if (checkedCount === 0) {
      alert('Por favor verifica y marca al menos un equipo en la lista de inspección.');
      return;
    }

    if (!confirm(`¿Confirmas el registro de ${actionText} para los ${checkedCount} equipo(s) verificados?`)) {
      return;
    }

    setActionLoading(true);
    setActionSuccess(null);
    try {
      const targetItems = data.items.filter(item => checkedItems[item.id]);
      const promises = targetItems.map(item =>
        fetch(`/api/reservations/${item.id}/${action}`, { method: 'POST' })
      );

      const responses = await Promise.all(promises);
      const failed = responses.filter(r => !r.ok);

      if (failed.length > 0) {
        throw new Error(`Falló el registro para ${failed.length} de ${targetItems.length} equipos.`);
      }

      setActionSuccess(`¡Registro de ${actionText} completado exitosamente!`);
      await fetchInspectionData();
    } catch (err: any) {
      alert(`Error al registrar: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center" style={{ minHeight: '60vh', marginTop: '70px' }}>
        <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }} />
        <h5 className="text-slate-700 fw-semibold">Consultando inspección de equipo...</h5>
        <p className="text-muted small">Validando código QR con base de datos de CEPROA</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container py-5" style={{ maxWidth: '580px', marginTop: '70px' }}>
        <div className="card shadow-sm border-0 rounded-4 p-4 text-center">
          <div className="d-inline-flex align-items-center justify-content-center bg-danger bg-opacity-10 text-danger rounded-circle p-3 mx-auto mb-3" style={{ width: '64px', height: '64px' }}>
            <AlertCircle size={32} />
          </div>
          <h4 className="fw-bold text-danger mb-2">No se pudo verificar el folio</h4>
          <p className="text-muted mb-4">{error || 'La solicitud no existe o ha expirado.'}</p>
          <div className="d-flex gap-2 justify-content-center">
            <button onClick={() => fetchInspectionData()} className="btn btn-outline-secondary rounded-pill px-4 d-flex align-items-center gap-2">
              <RefreshCw size={16} />
              Reintentar
            </button>
            <Link href="/vigilancia/dashboard" className="btn btn-primary rounded-pill px-4" style={{ backgroundColor: '#145775', borderColor: '#145775' }}>
              Ir a Vigilancia
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const allItemsChecked = data.items.length > 0 && data.items.every(i => checkedItems[i.id]);
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;

  return (
    <div className="container py-4" style={{ maxWidth: '680px', marginTop: '60px' }}>
      {/* Top Navigation */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <Link href="/vigilancia/dashboard" className="btn btn-link text-decoration-none text-muted p-0 d-flex align-items-center gap-1">
          <ArrowLeft size={18} />
          <span className="fw-medium small">Panel de Vigilancia</span>
        </Link>
        <span className="badge px-3 py-2 rounded-pill bg-light text-muted border fw-semibold">
          Folio: {data.displayId}
        </span>
      </div>

      {/* Header Banner */}
      <div
        className="rounded-4 p-4 mb-4 text-white shadow-sm position-relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #145775 0%, #0D3B50 100%)',
          borderLeft: '5px solid #FF9500',
        }}
      >
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="d-flex align-items-center gap-2">
            <div className="p-2 rounded-3 bg-white bg-opacity-10">
              <ShieldCheck size={24} className="text-warning" />
            </div>
            <div>
              <span className="text-uppercase fw-bold tracking-wide" style={{ fontSize: '0.72rem', color: '#FF9500', letterSpacing: '0.8px' }}>
                Caseta de Control & Vigilancia
              </span>
              <h4 className="fw-bold mb-0 text-white" style={{ fontSize: '1.25rem' }}>
                Inspección de Salida de Equipo
              </h4>
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="mt-3 pt-3 border-top border-white border-opacity-10 d-flex align-items-center justify-content-between">
          <span className="small text-white-50">Estado de la solicitud:</span>
          {data.status === 'PENDING_CHECKOUT' && (
            <span className="badge rounded-pill bg-warning text-dark px-3 py-2 fw-bold">
              🟡 Pendiente de Salida
            </span>
          )}
          {data.status === 'CHECKED_OUT' && (
            <span className="badge rounded-pill bg-info text-white px-3 py-2 fw-bold" style={{ backgroundColor: '#0284C7' }}>
              🔵 En Tránsito (Equipo Retirado)
            </span>
          )}
          {data.status === 'CHECKED_IN' && (
            <span className="badge rounded-pill bg-success text-white px-3 py-2 fw-bold">
              🟢 Devuelto y Completado
            </span>
          )}
        </div>
      </div>

      {actionSuccess && (
        <div className="alert alert-success rounded-3 shadow-sm border-0 d-flex align-items-center gap-2 mb-4">
          <CheckCircle2 size={20} className="text-success flex-shrink-0" />
          <span className="fw-medium">{actionSuccess}</span>
        </div>
      )}

      {/* Applicant Card */}
      <div className="card shadow-sm border-0 rounded-4 p-4 mb-3 bg-white">
        <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#0F172A' }}>
          <User size={18} className="text-primary" />
          Datos del Solicitante Responsable
        </h6>
        <div className="row g-3">
          <div className="col-12 col-sm-6">
            <small className="text-muted d-block">Nombre completo</small>
            <span className="fw-bold text-dark">{data.user.name}</span>
          </div>
          <div className="col-6 col-sm-6">
            <small className="text-muted d-block">Matrícula / Nómina</small>
            <span className="badge bg-light text-dark border px-2 py-1 fw-bold">
              {data.user.identifier}
            </span>
          </div>
          <div className="col-6 col-sm-6">
            <small className="text-muted d-block">Teléfono de contacto</small>
            {data.user.phoneNumber !== 'N/A' ? (
              <a href={`tel:${data.user.phoneNumber}`} className="text-decoration-none fw-semibold d-flex align-items-center gap-1 text-primary">
                <Phone size={14} />
                {data.user.phoneNumber}
              </a>
            ) : (
              <span className="text-muted">No registrado</span>
            )}
          </div>
          <div className="col-12 col-sm-6">
            <small className="text-muted d-block">Horario Autorizado</small>
            <span className="small text-muted d-flex align-items-center gap-1">
              <Calendar size={13} />
              {new Date(data.startTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} a {new Date(data.endTime).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {/* Equipment Checklist */}
      <div className="card shadow-sm border-0 rounded-4 p-4 mb-4 bg-white">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h6 className="fw-bold mb-0 text-slate-800" style={{ color: '#0F172A' }}>
              Equipos Autorizados en la Hoja ({data.items.length})
            </h6>
            <small className="text-muted">
              Coteja el activo fijo y serie antes de permitir la salida
            </small>
          </div>
          <button
            type="button"
            onClick={handleSelectAll}
            className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1"
            style={{ fontSize: '0.78rem' }}
          >
            {allItemsChecked ? 'Desmarcar todos' : 'Marcar todos'}
          </button>
        </div>

        <div className="d-flex flex-column gap-3">
          {data.items.map((item, idx) => {
            const isChecked = !!checkedItems[item.id];
            return (
              <div
                key={item.id}
                onClick={() => handleToggleItem(item.id)}
                className={`p-3 rounded-3 border transition-all cursor-pointer ${
                  isChecked ? 'border-primary bg-primary bg-opacity-10' : 'border-light bg-light'
                }`}
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  borderWidth: isChecked ? '1.5px' : '1px',
                }}
              >
                <div className="d-flex align-items-start gap-3">
                  <input
                    type="checkbox"
                    className="form-check-input mt-1 flex-shrink-0"
                    checked={isChecked}
                    onChange={() => {}} // Handled by parent div
                    style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                  />
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-1">
                      <span className="fw-bold text-dark" style={{ fontSize: '0.98rem' }}>
                        {idx + 1}. {item.name}
                      </span>
                      {item.checkedInAt ? (
                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1 rounded-pill small">
                          ✓ Devuelto
                        </span>
                      ) : item.checkedOutAt ? (
                        <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 px-2 py-1 rounded-pill small">
                          ↗ En uso (Retirado)
                        </span>
                      ) : (
                        <span className="badge bg-secondary bg-opacity-10 text-secondary border px-2 py-1 rounded-pill small">
                          Por verificar
                        </span>
                      )}
                    </div>

                    <div className="d-flex flex-wrap gap-2 mt-2">
                      <span className="badge bg-white text-dark border px-2 py-1 d-inline-flex align-items-center gap-1 font-monospace">
                        <Barcode size={13} className="text-primary" />
                        Activo: <strong>{item.fixedAssetId}</strong>
                      </span>
                      {item.serialNumber && item.serialNumber !== 'N/A' && (
                        <span className="badge bg-white text-muted border px-2 py-1 font-monospace">
                          Serie: {item.serialNumber}
                        </span>
                      )}
                    </div>

                    {item.checkedOutAt && (
                      <div className="small text-muted mt-2 pt-2 border-top">
                        <span>Retirado: {new Date(item.checkedOutAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                        {item.checkedOutByName && <span> por <strong>{item.checkedOutByName}</strong></span>}
                      </div>
                    )}
                    {item.checkedInAt && (
                      <div className="small text-success mt-1">
                        <span>Devuelto: {new Date(item.checkedInAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                        {item.checkedInByName && <span> recibido por <strong>{item.checkedInByName}</strong></span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Footer Button */}
      <div className="card shadow-sm border-0 rounded-4 p-3 bg-white mb-4">
        {data.status === 'PENDING_CHECKOUT' && (
          <button
            type="button"
            disabled={actionLoading || checkedCount === 0}
            onClick={() => handleConfirmAction('checkout')}
            className="btn btn-lg w-100 rounded-pill py-3 fw-bold text-white shadow-sm d-flex align-items-center justify-content-center gap-2"
            style={{
              backgroundColor: checkedCount > 0 ? '#15803D' : '#94A3B8',
              borderColor: checkedCount > 0 ? '#15803D' : '#94A3B8',
              transition: 'all 0.2s ease',
            }}
          >
            <CheckCircle2 size={22} />
            <span>
              {actionLoading
                ? 'Registrando salida...'
                : `CONFIRMAR SALIDA (${checkedCount} de ${data.items.length} equipos)`}
            </span>
          </button>
        )}

        {data.status === 'CHECKED_OUT' && (
          <button
            type="button"
            disabled={actionLoading || checkedCount === 0}
            onClick={() => handleConfirmAction('checkin')}
            className="btn btn-lg w-100 rounded-pill py-3 fw-bold text-white shadow-sm d-flex align-items-center justify-content-center gap-2"
            style={{
              backgroundColor: checkedCount > 0 ? '#145775' : '#94A3B8',
              borderColor: checkedCount > 0 ? '#145775' : '#94A3B8',
              transition: 'all 0.2s ease',
            }}
          >
            <CheckCircle2 size={22} />
            <span>
              {actionLoading
                ? 'Registrando devolución...'
                : `CONFIRMAR REGRESO / DEVOLUCIÓN (${checkedCount} equipos)`}
            </span>
          </button>
        )}

        {data.status === 'CHECKED_IN' && (
          <div className="text-center py-2">
            <span className="badge bg-success bg-opacity-10 text-success p-2 px-4 rounded-pill fw-semibold">
              ✓ Esta solicitud ya fue completada y devuelta en su totalidad.
            </span>
          </div>
        )}

        <div className="d-flex align-items-center justify-content-between mt-3 pt-2 border-top">
          <Link
            href={`/api/admin/reservations/${data.cartSubmissionId}/exit-sheet`}
            target="_blank"
            className="btn btn-sm btn-link text-muted text-decoration-none d-flex align-items-center gap-1"
          >
            <FileText size={15} />
            Ver Hoja de Salida (PDF)
          </Link>
          <button
            type="button"
            onClick={fetchInspectionData}
            className="btn btn-sm btn-link text-muted text-decoration-none d-flex align-items-center gap-1"
          >
            <RefreshCw size={14} />
            Actualizar datos
          </button>
        </div>
      </div>
    </div>
  );
}
