'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, ButtonGroup, Spinner, Alert } from 'react-bootstrap';
import { QrCode, Download, Copy, Check, ExternalLink, ScreenShare } from 'lucide-react';

interface WorkshopQrModalProps {
  show: boolean;
  onHide: () => void;
  workshopId: string;
  workshopName: string;
}

export default function WorkshopQrModal({
  show,
  onHide,
  workshopId,
  workshopName,
}: WorkshopQrModalProps) {
  const [type, setType] = useState<'public' | 'checkin'>('public');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!show || !workshopId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/workshops/${workshopId}/qr?type=${type}`)
      .then((res) => {
        if (!res.ok) throw new Error('Error al generar QR');
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setQrDataUrl(data.qrDataUrl);
          setTargetUrl(data.targetUrl);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Error al obtener código QR');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [show, workshopId, type]);

  const handleCopyLink = async () => {
    if (!targetUrl) return;
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      alert('Enlace copiado al portapapeles');
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const downloadLink = document.createElement('a');
    downloadLink.href = qrDataUrl;
    const sanitizedName = workshopName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    downloadLink.download = `QR_${type === 'checkin' ? 'Asistencia' : 'Difusion'}_${sanitizedName}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2" style={{ fontSize: '1.2rem', color: '#1F2937' }}>
          <QrCode size={22} className="text-primary" />
          <span>Descargar Códigos QR (Administración)</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center p-4">
        <h6 className="fw-bold mb-3 text-secondary">{workshopName}</h6>

        {/* Selector de tipo de QR */}
        <ButtonGroup className="mb-3 w-100 shadow-sm">
          <Button
            variant={type === 'public' ? 'primary' : 'outline-primary'}
            onClick={() => setType('public')}
            className="d-flex align-items-center justify-content-center gap-1"
          >
            <ExternalLink size={16} />
            Difusión y Registro
          </Button>
          <Button
            variant={type === 'checkin' ? 'primary' : 'outline-primary'}
            onClick={() => setType('checkin')}
            className="d-flex align-items-center justify-content-center gap-1"
          >
            <ScreenShare size={16} />
            Pase de Asistencia
          </Button>
        </ButtonGroup>

        <p className="text-muted small mb-3">
          {type === 'public'
            ? 'Para colocar en afiches, folletos o redes. Lleva a los alumnos a la página de información e inscripción.'
            : 'Para que los alumnos asistentes escaneen el día del evento y registren su asistencia en su teléfono.'}
        </p>

        {error && <Alert variant="danger">{error}</Alert>}

        {loading ? (
          <div className="py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 text-muted small">Generando código QR...</p>
          </div>
        ) : qrDataUrl ? (
          <div className="d-flex flex-column align-items-center">
            <div
              className="p-3 bg-white rounded-3 shadow-sm border mb-3"
              style={{ display: 'inline-block' }}
            >
              <img
                src={qrDataUrl}
                alt="Código QR del taller"
                style={{ width: '220px', height: '220px', objectFit: 'contain' }}
              />
            </div>

            <div className="input-group mb-3">
              <input
                type="text"
                readOnly
                value={targetUrl}
                className="form-control form-control-sm text-muted bg-light"
              />
              <button
                className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                onClick={handleCopyLink}
                title="Copiar link"
              >
                {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>
        ) : null}
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between">
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
        <div className="d-flex gap-2">
          {type === 'checkin' && (
            <Button
              variant="outline-primary"
              href={`/admin/workshops/${workshopId}/proyeccion`}
              target="_blank"
              className="d-flex align-items-center gap-1"
            >
              <ScreenShare size={16} />
              Modo Proyector
            </Button>
          )}
          <Button
            variant="success"
            onClick={handleDownloadQr}
            disabled={!qrDataUrl || loading}
            className="d-flex align-items-center gap-1"
          >
            <Download size={16} />
            Descargar PNG
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}

