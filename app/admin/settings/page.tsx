'use client';

import { useState, useEffect } from 'react';
import { Container, Form, Button, Spinner, Alert, Row, Col, Tabs, Tab, Table } from 'react-bootstrap';
import { useSession } from '@/context/SessionContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DEFAULT_HOW_IT_WORKS, DEFAULT_PRIVACY_POLICY } from '@/lib/default-content';

export default function AdminSettingsPage() {
  const { user, loading: sessionLoading } = useSession();
  const router = useRouter();
  const [limit, setLimit] = useState('');
  const [reservationLeadTime, setReservationLeadTime] = useState('');

  // New Tenant Config State
  const [siteName, setSiteName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [allowedDomains, setAllowedDomains] = useState('');
  const [privacyPolicy, setPrivacyPolicy] = useState('');
  const [howItWorks, setHowItWorks] = useState(''); // JSON string
  const [topLogoUrl, setTopLogoUrl] = useState('');
  const [topLogoHeight, setTopLogoHeight] = useState(50); // Default 50
  const [bottomLogoUrl, setBottomLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#145775');
  const [secondaryColor, setSecondaryColor] = useState('#1F2937');
  const [tertiaryColor, setTertiaryColor] = useState('#ff9500');
  const [inscriptionDefaultColor, setInscriptionDefaultColor] = useState('#ff9500');
  const [inscriptionPendingColor, setInscriptionPendingColor] = useState('#ff9500');
  const [inscriptionApprovedColor, setInscriptionApprovedColor] = useState('#28A745');
  const [pdfTopLogoUrl, setPdfTopLogoUrl] = useState('');
  const [pdfBottomLogoUrl, setPdfBottomLogoUrl] = useState('');
  const [pdfTopLogoFile, setPdfTopLogoFile] = useState<File | null>(null);
  const [pdfBottomLogoFile, setPdfBottomLogoFile] = useState<File | null>(null);
  const [regulationsUrl, setRegulationsUrl] = useState('');
  const [regulationsFile, setRegulationsFile] = useState<File | null>(null);
  const [attachmentFormUrl, setAttachmentFormUrl] = useState('');
  const [attachmentFormFile, setAttachmentFormFile] = useState<File | null>(null);
  const [carouselResourceLimit, setCarouselResourceLimit] = useState(15);

  // Import states
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!sessionLoading && (!user || user.role !== 'SUPERUSER')) {
      router.push('/admin');
    }
  }, [user, sessionLoading, router]);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/admin/settings');
        if (!response.ok) {
          throw new Error('Error al cargar la configuración.');
        }
        const data = await response.json();
        setLimit(data.extraordinaryInscriptionLimit || '');
        setReservationLeadTime(data.reservationLeadTime || '');

        // Set Tenant Config
        setSiteName(data.siteName || '');
        setContactEmail(data.contactEmail || '');
        setAllowedDomains(data.allowedDomains || '');
        setPrivacyPolicy(data.privacyPolicy || DEFAULT_PRIVACY_POLICY);
        setHowItWorks(data.howItWorks || DEFAULT_HOW_IT_WORKS);
        setTopLogoUrl(data.topLogoUrl || '');
        setTopLogoHeight(data.topLogoHeight || 50); // Set height
        setBottomLogoUrl(data.bottomLogoUrl || '');
        setFaviconUrl(data.faviconUrl || '');
        setPrimaryColor(data.primaryColor || '#3B82F6');
        setSecondaryColor(data.secondaryColor || '#1F2937');
        setTertiaryColor(data.tertiaryColor || '#ff9500');
        setInscriptionDefaultColor(data.inscriptionDefaultColor || '#ff9500');
        setInscriptionPendingColor(data.inscriptionPendingColor || '#ff9500');
        setInscriptionApprovedColor(data.inscriptionApprovedColor || '#28A745');
        setPdfTopLogoUrl(data.pdfTopLogoUrl || '');
        setPdfBottomLogoUrl(data.pdfBottomLogoUrl || '');
        setRegulationsUrl(data.regulationsUrl || '');
        setAttachmentFormUrl(data.attachmentFormUrl || '');
        setCarouselResourceLimit(data.carouselResourceLimit || 15);

      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    if (user && user.role === 'SUPERUSER') {
      fetchSettings();
    }
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setUrl: (url: string) => void) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('files', e.target.files[0]);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Error uploading image');

      const data = await response.json();
      if (data.urls && data.urls.length > 0) {
        setUrl(data.urls[0]);
      }
    } catch (err) {
      console.error(err);
      setError('Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    let uploadedPdfTopLogoUrl = pdfTopLogoUrl;
    let uploadedPdfBottomLogoUrl = pdfBottomLogoUrl;

    if (pdfTopLogoFile) {
      const formData = new FormData();
      formData.append('files', pdfTopLogoFile);
      try {
        const uploadResponse = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!uploadResponse.ok) throw new Error('Error al subir logo superior PDF');
        const uploadData = await uploadResponse.json();
        uploadedPdfTopLogoUrl = uploadData.urls[0]; // Also accessing urls[0] since API returns { urls: [...] }
      } catch (err) {
        setError('Error al subir logo superior PDF');
        // setIsSubmitting(false); // Removed as it's not defined
        return;
      }
    }

    if (pdfBottomLogoFile) {
      const formData = new FormData();
      formData.append('files', pdfBottomLogoFile);
      try {
        const uploadResponse = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!uploadResponse.ok) throw new Error('Error al subir logo inferior PDF');
        const uploadData = await uploadResponse.json();
        uploadedPdfBottomLogoUrl = uploadData.urls[0]; // Also accessing urls[0] since API returns { urls: [...] }
      } catch (err) {
        setError('Error al subir logo inferior PDF');
        // setIsSubmitting(false); // Removed as it's not defined
        return;
      }
    }

    let uploadedRegulationsUrl = regulationsUrl;
    let uploadedAttachmentFormUrl = attachmentFormUrl;

    if (regulationsFile) {
      const formData = new FormData();
      formData.append('file', regulationsFile);
      formData.append('type', 'regulations');
      try {
        const uploadResponse = await fetch('/api/upload/config', { method: 'POST', body: formData });
        if (!uploadResponse.ok) throw new Error('Error al subir reglamento');
        const uploadData = await uploadResponse.json();
        uploadedRegulationsUrl = uploadData.url;
      } catch (err) {
        setError('Error al subir reglamento');
        return;
      }
    }

    if (attachmentFormFile) {
      const formData = new FormData();
      formData.append('file', attachmentFormFile);
      formData.append('type', 'attachmentForm');
      try {
        const uploadResponse = await fetch('/api/upload/config', { method: 'POST', body: formData });
        if (!uploadResponse.ok) throw new Error('Error al subir formato de adjunto');
        const uploadData = await uploadResponse.json();
        uploadedAttachmentFormUrl = uploadData.url;
      } catch (err) {
        setError('Error al subir formato de adjunto');
        return;
      }
    }


    console.log('Submitting settings:', {
      siteName,
      contactEmail,
      faviconUrl,
      topLogoUrl,
      bottomLogoUrl,
      pdfTopLogoUrl: uploadedPdfTopLogoUrl,
      pdfBottomLogoUrl: uploadedPdfBottomLogoUrl
    });

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extraordinaryInscriptionLimit: limit,
          reservationLeadTime: reservationLeadTime,
          siteName,
          contactEmail,
          allowedDomains,
          privacyPolicy,
          howItWorks,
          topLogoUrl,
          topLogoHeight, // Send height
          bottomLogoUrl,
          faviconUrl,
          primaryColor,
          secondaryColor,
          tertiaryColor,
          inscriptionDefaultColor,
          inscriptionPendingColor,
          inscriptionApprovedColor,
          pdfTopLogoUrl: uploadedPdfTopLogoUrl,
          pdfBottomLogoUrl: uploadedPdfBottomLogoUrl,
          regulationsUrl: uploadedRegulationsUrl,
          attachmentFormUrl: uploadedAttachmentFormUrl,
          carouselResourceLimit, // Carousel configuration
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'No se pudo actualizar la configuración.');
      }

      setSuccess('Configuración actualizada correctamente. Recargando página...');

      // Reload page after 1.5 seconds to apply changes
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  const handleDownloadTemplate = async (type: 'spaces' | 'equipment' | 'workshops') => {
    try {
      const response = await fetch(`/api/admin/import/templates/${type}`);
      if (!response.ok) throw new Error('Error al descargar plantilla');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `plantilla_${type === 'spaces' ? 'espacios' : type === 'equipment' ? 'equipos' : 'talleres'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setImportError('Error al descargar la plantilla');
    }
  };

  const handleImport = async (type: 'spaces' | 'equipment' | 'workshops') => {
    if (!importFile) {
      setImportError('Por favor selecciona un archivo');
      return;
    }

    setImporting(true);
    setImportError(null);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', importFile);

      const response = await fetch(`/api/admin/import/${type}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al importar');
      }

      setImportResult(data);
      setImportFile(null);
    } catch (error: any) {
      setImportError(error.message || 'Error al procesar la importación');
    } finally {
      setImporting(false);
    }
  };

  if (sessionLoading || loading) {
    return <Container className="mt-5 text-center"><Spinner animation="border" /></Container>;
  }

  if (error) {
    return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;
  }

  return (
    <Container style={{ paddingTop: '100px', paddingBottom: '50px' }}>
      <h2>Configuración del Sistema</h2>
      <Form onSubmit={handleSubmit}>

        <h4 className="mt-4">General</h4>
        <Form.Group className="mb-3">
          <Form.Label>Nombre del Sitio</Form.Label>
          <Form.Control
            type="text"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            placeholder="Ej: Fluxio RSV"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Correo de Contacto</Form.Label>
          <Form.Control
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="contacto@ejemplo.com"
          />
        </Form.Group>

        <h4 className="mt-4">Branding</h4>
        <Form.Group className="mb-3">
          <Form.Label>Logotipo Superior (Header)</Form.Label>
          <div className="d-flex align-items-center gap-3 mb-2">
            {topLogoUrl && <img src={topLogoUrl} alt="Top Logo" height={topLogoHeight} style={{ maxHeight: '100px' }} />}
            <Form.Control
              type="file"
              onChange={(e) => handleImageUpload(e as any, setTopLogoUrl)}
              disabled={uploading}
            />
          </div>
          {topLogoUrl && (
            <div className="mt-2">
              <Form.Label>Tamaño del Logotipo: {topLogoHeight}px</Form.Label>
              <Form.Range
                min={20}
                max={100}
                value={topLogoHeight}
                onChange={(e) => setTopLogoHeight(parseInt(e.target.value))}
              />
            </div>
          )}
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Logotipo Inferior (Footer)</Form.Label>
          <div className="d-flex align-items-center gap-3 mb-2">
            {bottomLogoUrl && <img src={bottomLogoUrl} alt="Bottom Logo" height="50" />}
            <Form.Control
              type="file"
              onChange={(e) => handleImageUpload(e as any, setBottomLogoUrl)}
              disabled={uploading}
            />
          </div>
        </Form.Group>

        <hr className="my-4" />
        <h4 className="mb-3">Personalización de Documentos PDF (Hojas de Salida, Listas)</h4>
        <Alert variant="info">
          <i className="bi bi-info-circle me-2"></i>
          Para la generación de PDFs, se requieren imágenes en formato <strong>PNG</strong> o <strong>JPG</strong>. Los archivos SVG no son compatibles.
        </Alert>
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Logo Superior para PDF (PNG/JPG)</Form.Label>
              {pdfTopLogoUrl && (
                <div className="mb-2 p-2 border rounded bg-light text-center">
                  <img src={pdfTopLogoUrl} alt="Logo Superior PDF" style={{ maxHeight: '50px', maxWidth: '100%' }} />
                </div>
              )}
              <Form.Control
                type="file"
                accept="image/png, image/jpeg"
                onChange={(e: any) => setPdfTopLogoFile(e.target.files[0])}
              />
              <Form.Text className="text-muted">
                Aparecerá en la esquina superior izquierda de los documentos.
              </Form.Text>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Logo Inferior para PDF (PNG/JPG)</Form.Label>
              {pdfBottomLogoUrl && (
                <div className="mb-2 p-2 border rounded bg-light text-center">
                  <img src={pdfBottomLogoUrl} alt="Logo Inferior PDF" style={{ maxHeight: '50px', maxWidth: '100%' }} />
                </div>
              )}
              <Form.Control
                type="file"
                accept="image/png, image/jpeg"
                onChange={(e: any) => setPdfBottomLogoFile(e.target.files[0])}
              />
              <Form.Text className="text-muted">
                Aparecerá en la esquina inferior derecha de los documentos.
              </Form.Text>
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-3">
          <Form.Label>Favicon (Icono de pestaña)</Form.Label>
          <div className="d-flex align-items-center gap-3 mb-2">
            {faviconUrl && <img src={faviconUrl} alt="Favicon" height="32" />}
            <Form.Control
              type="file"
              onChange={(e) => handleImageUpload(e as any, setFaviconUrl)}
              disabled={uploading}
            />
          </div>
        </Form.Group>

        <h4 className="mt-4">Colores</h4>
        <div className="row">
          <div className="col-md-4">
            <Form.Group className="mb-3">
              <Form.Label>Color Primario (Botones, Enlaces)</Form.Label>
              <div className="d-flex align-items-center gap-2">
                <Form.Control
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  title="Elige el color primario"
                  style={{ width: '50px', padding: '0' }}
                />
                <Form.Control
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#3B82F6"
                />
              </div>
            </Form.Group>
          </div>
          <div className="col-md-4">
            <Form.Group className="mb-3">
              <Form.Label>Color Secundario (Fondos oscuros)</Form.Label>
              <div className="d-flex align-items-center gap-2">
                <Form.Control
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  title="Elige el color secundario"
                  style={{ width: '50px', padding: '0' }}
                />
                <Form.Control
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  placeholder="#1F2937"
                />
              </div>
            </Form.Group>
          </div>
          <div className="col-md-4">
            <Form.Group className="mb-3">
              <Form.Label>Color de Acción (Botones Agregar)</Form.Label>
              <div className="d-flex align-items-center gap-2">
                <Form.Control
                  type="color"
                  value={tertiaryColor}
                  onChange={(e) => setTertiaryColor(e.target.value)}
                  title="Elige el color de acción"
                  style={{ width: '50px', padding: '0' }}
                />
                <Form.Control
                  type="text"
                  value={tertiaryColor}
                  onChange={(e) => setTertiaryColor(e.target.value)}
                  placeholder="#F28C00"
                />
              </div>
            </Form.Group>
          </div>
        </div>

        <h5 className="mt-4">Colores de Inscripciones</h5>
        <div className="row">
          <div className="col-md-4">
            <Form.Group className="mb-3">
              <Form.Label>Botón "Inscribirme" (Sin inscripción)</Form.Label>
              <div className="d-flex align-items-center gap-2">
                <Form.Control
                  type="color"
                  value={inscriptionDefaultColor}
                  onChange={(e) => setInscriptionDefaultColor(e.target.value)}
                  title="Elige el color para el botón de inscribirme"
                  style={{ width: '50px', padding: '0' }}
                />
                <Form.Control
                  type="text"
                  value={inscriptionDefaultColor}
                  onChange={(e) => setInscriptionDefaultColor(e.target.value)}
                  placeholder="#FFC107"
                />
              </div>
              <Form.Text className="text-muted">
                Color del botón cuando el usuario puede inscribirse.
              </Form.Text>
            </Form.Group>
          </div>
          <div className="col-md-4">
            <Form.Group className="mb-3">
              <Form.Label>Color Inscripción Pendiente</Form.Label>
              <div className="d-flex align-items-center gap-2">
                <Form.Control
                  type="color"
                  value={inscriptionPendingColor}
                  onChange={(e) => setInscriptionPendingColor(e.target.value)}
                  title="Elige el color para inscripciones pendientes"
                  style={{ width: '50px', padding: '0' }}
                />
                <Form.Control
                  type="text"
                  value={inscriptionPendingColor}
                  onChange={(e) => setInscriptionPendingColor(e.target.value)}
                  placeholder="#17A2B8"
                />
              </div>
              <Form.Text className="text-muted">
                Color del botón cuando la inscripción está pendiente de aprobación.
              </Form.Text>
            </Form.Group>
          </div>
          <div className="col-md-4">
            <Form.Group className="mb-3">
              <Form.Label>Color Inscripción Aprobada</Form.Label>
              <div className="d-flex align-items-center gap-2">
                <Form.Control
                  type="color"
                  value={inscriptionApprovedColor}
                  onChange={(e) => setInscriptionApprovedColor(e.target.value)}
                  title="Elige el color para inscripciones aprobadas"
                  style={{ width: '50px', padding: '0' }}
                />
                <Form.Control
                  type="text"
                  value={inscriptionApprovedColor}
                  onChange={(e) => setInscriptionApprovedColor(e.target.value)}
                  placeholder="#28A745"
                />
              </div>
              <Form.Text className="text-muted">
                Color del botón cuando el usuario ya está inscrito.
              </Form.Text>
            </Form.Group>
          </div>
        </div>

        <h4 className="mt-4">Acceso y Seguridad</h4>
        <Form.Group className="mb-3">
          <Form.Label>Dominios Permitidos (Registro)</Form.Label>
          <Form.Control
            type="text"
            value={allowedDomains}
            onChange={(e) => setAllowedDomains(e.target.value)}
            placeholder="Ej: ejemplo.com, alumnos.ejemplo.com"
          />
          <Form.Text className="text-muted">
            Separa los dominios con comas. Deja vacío para permitir cualquier dominio.
          </Form.Text>
        </Form.Group>

        <h4 className="mt-4">Contenido</h4>
        <Form.Group className="mb-3">
          <Form.Label>Pasos "Cómo Funciona" (JSON)</Form.Label>
          <Form.Control
            as="textarea"
            rows={5}
            value={howItWorks}
            onChange={(e) => setHowItWorks(e.target.value)}
            placeholder='[{"title": "Crea tu cuenta", "description": "Usa tu correo institucional..."}]'
          />
          <Form.Text className="text-muted">
            Formato JSON array con objetos que tengan 'title' y 'description'.
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Aviso de Privacidad</Form.Label>
          <Form.Control
            as="textarea"
            rows={10}
            value={privacyPolicy}
            onChange={(e) => setPrivacyPolicy(e.target.value)}
            placeholder="Escribe aquí el contenido de tu aviso de privacidad. El sistema respetará los espacios y saltos de línea automáticamente."
          />
          <Form.Text className="text-muted">
            Puedes escribir texto normal. Se mostrará tal cual lo escribas.
          </Form.Text>
        </Form.Group>

        <h4 className="mt-4">Archivos PDF</h4>
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Reglamento (PDF)</Form.Label>
              {regulationsUrl && (
                <div className="mb-2 p-2 border rounded bg-light">
                  <a href={regulationsUrl} target="_blank" rel="noopener noreferrer" className="text-primary">
                    📄 Ver reglamento actual
                  </a>
                </div>
              )}
              <Form.Control
                type="file"
                accept="application/pdf"
                onChange={(e: any) => setRegulationsFile(e.target.files[0])}
              />
              <Form.Text className="text-muted">
                Sube el reglamento que los usuarios deben consultar.
              </Form.Text>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Formato de Adjunto (PDF)</Form.Label>
              {attachmentFormUrl && (
                <div className="mb-2 p-2 border rounded bg-light">
                  <a href={attachmentFormUrl} target="_blank" rel="noopener noreferrer" className="text-primary">
                    📄 Ver formato actual
                  </a>
                </div>
              )}
              <Form.Control
                type="file"
                accept="application/pdf"
                onChange={(e: any) => setAttachmentFormFile(e.target.files[0])}
              />
              <Form.Text className="text-muted">
                Sube el formato que los usuarios deben descargar y adjuntar.
              </Form.Text>
            </Form.Group>
          </Col>
        </Row>

        <h4 className="mt-4">Límites y Reglas</h4>
        <Form.Group className="mb-3">
          <Form.Label>Límite de Solicitudes Extraordinarias</Form.Label>
          <Form.Control
            type="number"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            placeholder="Introduce el límite"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Tiempo de Antelación Global para Reservas (horas)</Form.Label>
          <Form.Control
            type="number"
            value={reservationLeadTime}
            onChange={(e) => setReservationLeadTime(e.target.value)}
            placeholder="Introduce el tiempo en horas"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Límite de Recursos en Carrusel (Página de Inicio)</Form.Label>
          <Form.Control
            type="number"
            min="5"
            max="50"
            value={carouselResourceLimit}
            onChange={(e) => setCarouselResourceLimit(parseInt(e.target.value) || 15)}
            placeholder="15"
          />
          <Form.Text className="text-muted">
            Número máximo de espacios y equipos a mostrar en el carrusel de la página de inicio (por tipo).
            Valor recomendado: 10-20. Menor número = carga más rápida.
          </Form.Text>
        </Form.Group>

        <div className="mb-3 p-3 border rounded bg-light">
          <h5 className="mb-2">📝 Configuración del Formulario de Reservaciones</h5>
          <p className="text-muted mb-3">
            Personaliza los campos del formulario de reservaciones: cambia etiquetas, habilita/deshabilita campos, y define cuáles son obligatorios.
          </p>
          <Link href="/admin/reservation-form-config">
            <Button variant="primary">
              Configurar Formulario de Reservaciones
            </Button>
          </Link>
        </div>

        <hr className="my-5" />
        <h4 className="mt-4">Importación Masiva de Recursos</h4>
        <p className="text-muted">Importa múltiples espacios, equipos o talleres desde archivos Excel</p>

        <Tabs defaultActiveKey="spaces" className="mb-3">
          {/* Tab de Espacios */}
          <Tab eventKey="spaces" title="Espacios">
            <div className="p-3 border rounded">
              <h5>Importar Espacios</h5>

              <div className="mb-3">
                <strong>📥 Paso 1: Descargar Plantilla</strong>
                <p className="text-muted small">Descarga la plantilla Excel con el formato correcto</p>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => handleDownloadTemplate('spaces')}
                >
                  📄 Descargar Plantilla de Espacios
                </Button>
              </div>

              <div className="mb-3">
                <strong>📝 Paso 2: Llenar la Plantilla</strong>
                <ul className="text-muted small">
                  <li>Llena las columnas requeridas (nombre es obligatorio)</li>
                  <li>No modifiques los nombres de las columnas</li>
                  <li>Estado debe ser: AVAILABLE o IN_MAINTENANCE</li>
                  <li>Requiere reserva espacio: SI o NO</li>
                </ul>
              </div>

              <div className="mb-3">
                <strong>📤 Paso 3: Subir Archivo</strong>
                <Form.Control
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e: any) => setImportFile(e.target.files[0])}
                  className="mb-2"
                />
                <Button
                  variant="success"
                  onClick={() => handleImport('spaces')}
                  disabled={importing || !importFile}
                >
                  {importing ? 'Importando...' : 'Importar Espacios'}
                </Button>
              </div>

              {importError && <Alert variant="danger">{importError}</Alert>}

              {importResult && (
                <Alert variant="success">
                  <strong>✅ Importación Completada</strong>
                  <p className="mb-1">Total: {importResult.summary.total} filas procesadas</p>
                  <p className="mb-1">Creados: {importResult.summary.created} espacios</p>
                  <p className="mb-0">Errores: {importResult.summary.errors}</p>

                  {importResult.errors.length > 0 && (
                    <div className="mt-3">
                      <strong>Errores:</strong>
                      <Table size="sm" className="mt-2">
                        <thead>
                          <tr>
                            <th>Fila</th>
                            <th>Error</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importResult.errors.map((err: any, idx: number) => (
                            <tr key={idx}>
                              <td>{err.row}</td>
                              <td>{err.error}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Alert>
              )}
            </div>
          </Tab>

          {/* Tab de Equipos */}
          <Tab eventKey="equipment" title="Equipos">
            <div className="p-3 border rounded">
              <h5>Importar Equipos</h5>

              <div className="mb-3">
                <strong>📥 Paso 1: Descargar Plantilla</strong>
                <p className="text-muted small">Descarga la plantilla Excel con el formato correcto</p>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => handleDownloadTemplate('equipment')}
                >
                  📄 Descargar Plantilla de Equipos
                </Button>
              </div>

              <div className="mb-3">
                <strong>📝 Paso 2: Llenar la Plantilla</strong>
                <ul className="text-muted small">
                  <li>Llena las columnas requeridas (nombre es obligatorio)</li>
                  <li>El espacio asignado debe existir previamente</li>
                  <li>Estado debe ser: AVAILABLE o IN_MAINTENANCE</li>
                  <li>Fijo a espacio: SI o NO</li>
                </ul>
              </div>

              <div className="mb-3">
                <strong>📤 Paso 3: Subir Archivo</strong>
                <Form.Control
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e: any) => setImportFile(e.target.files[0])}
                  className="mb-2"
                />
                <Button
                  variant="success"
                  onClick={() => handleImport('equipment')}
                  disabled={importing || !importFile}
                >
                  {importing ? 'Importando...' : 'Importar Equipos'}
                </Button>
              </div>

              {importError && <Alert variant="danger">{importError}</Alert>}

              {importResult && (
                <Alert variant="success">
                  <strong>✅ Importación Completada</strong>
                  <p className="mb-1">Total: {importResult.summary.total} filas procesadas</p>
                  <p className="mb-1">Creados: {importResult.summary.created} equipos</p>
                  <p className="mb-0">Errores: {importResult.summary.errors}</p>

                  {importResult.errors.length > 0 && (
                    <div className="mt-3">
                      <strong>Errores:</strong>
                      <Table size="sm" className="mt-2">
                        <thead>
                          <tr>
                            <th>Fila</th>
                            <th>Error</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importResult.errors.map((err: any, idx: number) => (
                            <tr key={idx}>
                              <td>{err.row}</td>
                              <td>{err.error}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Alert>
              )}
            </div>
          </Tab>

          {/* Tab de Talleres */}
          <Tab eventKey="workshops" title="Talleres">
            <div className="p-3 border rounded">
              <h5>Importar Talleres</h5>

              <div className="mb-3">
                <strong>📥 Paso 1: Descargar Plantilla</strong>
                <p className="text-muted small">Descarga la plantilla Excel con el formato correcto</p>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => handleDownloadTemplate('workshops')}
                >
                  📄 Descargar Plantilla de Talleres
                </Button>
              </div>

              <div className="mb-3">
                <strong>📝 Paso 2: Llenar la Plantilla</strong>
                <ul className="text-muted small">
                  <li>Llena las columnas requeridas (nombre es obligatorio)</li>
                  <li>Fechas en formato: YYYY-MM-DD (ej: 2025-01-15)</li>
                  <li>Inscripciones abiertas: SI o NO</li>
                  <li>Capacidad debe ser un número</li>
                </ul>
              </div>

              <div className="mb-3">
                <strong>📤 Paso 3: Subir Archivo</strong>
                <Form.Control
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e: any) => setImportFile(e.target.files[0])}
                  className="mb-2"
                />
                <Button
                  variant="success"
                  onClick={() => handleImport('workshops')}
                  disabled={importing || !importFile}
                >
                  {importing ? 'Importando...' : 'Importar Talleres'}
                </Button>
              </div>

              {importError && <Alert variant="danger">{importError}</Alert>}

              {importResult && (
                <Alert variant="success">
                  <strong>✅ Importación Completada</strong>
                  <p className="mb-1">Total: {importResult.summary.total} filas procesadas</p>
                  <p className="mb-1">Creados: {importResult.summary.created} talleres</p>
                  <p className="mb-0">Errores: {importResult.summary.errors}</p>

                  {importResult.errors.length > 0 && (
                    <div className="mt-3">
                      <strong>Errores:</strong>
                      <Table size="sm" className="mt-2">
                        <thead>
                          <tr>
                            <th>Fila</th>
                            <th>Error</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importResult.errors.map((err: any, idx: number) => (
                            <tr key={idx}>
                              <td>{err.row}</td>
                              <td>{err.error}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Alert>
              )}
            </div>
          </Tab>
        </Tabs>

        {success && <Alert variant="success">{success}</Alert>}

        <div className="d-flex gap-2 mt-4">
          <Button variant="primary" type="submit" disabled={uploading}>
            {uploading ? 'Subiendo...' : 'Guardar Cambios'}
          </Button>
          <Link href="/admin/requirements" passHref>
            <Button variant="outline-primary">Gestionar Requisitos</Button>
          </Link>
          <Link href="/admin" passHref>
            <Button variant="outline-primary">Regresar</Button>
          </Link>
        </div>
      </Form>
    </Container>
  );
}
