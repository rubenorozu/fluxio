'use client';

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';

export default function LandingConfigPage() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const [config, setConfig] = useState({
        contactEmail: 'contacto@fluxiorsv.com',
        demoTrialDays: 7,
        formFields: {
            requirePhone: true,
            requireCompany: true,
            requirePosition: false,
            requireSize: true,
            requireMessage: false
        },
        autoResponse: true,
        autoResponseMessage: 'Gracias por tu interés en Fluxio RSV. Nos pondremos en contacto contigo pronto.',
        // Landing page images
        landingHeroImage: '',
        landingHeroImageA: '',
        landingHeroImageB: '',
        landingHeroImageC: '',
        landingScreenshot1: '',
        landingScreenshot2: '',
        landingScreenshot3: '',
        landingScreenshot4: ''
    });

    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: boolean }>({});

    // Load configuration on mount
    useEffect(() => {
        const loadConfig = async () => {
            try {
                const response = await fetch('/api/admin/landing-config');
                if (response.ok) {
                    const data = await response.json();
                    setConfig(data);
                }
            } catch (err) {
                console.error('Error loading config:', err);
            }
        };
        loadConfig();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            const response = await fetch('/api/admin/landing-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            if (!response.ok) throw new Error('Error al guardar configuración');

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploadProgress({ ...uploadProgress, [fieldName]: true });

        try {
            // Comprimir imagen antes de subir
            const { compressImage, isImageFile, getFileSizeMB } = await import('@/lib/image-utils');
            const originalFile = e.target.files[0];

            let fileToUpload = originalFile;

            // Solo comprimir si es una imagen y es mayor a 1MB
            if (isImageFile(originalFile) && getFileSizeMB(originalFile) > 1) {
                console.log(`Comprimiendo imagen: ${originalFile.name} (${getFileSizeMB(originalFile).toFixed(2)}MB)`);
                fileToUpload = await compressImage(originalFile, {
                    maxWidth: 1920,
                    maxHeight: 1080,
                    quality: 0.85,
                    maxSizeMB: 4,
                });
            }

            const formData = new FormData();
            formData.append('files', fileToUpload);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
                credentials: 'include',
            });

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('El servidor no está disponible. Por favor contacta al administrador.');
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al subir la imagen');
            }

            if (data.urls && data.urls.length > 0) {
                setConfig({ ...config, [fieldName]: data.urls[0] });
            }
        } catch (err) {
            console.error('Error en handleImageUpload:', err);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Error desconocido al subir la imagen');
            }
        } finally {
            setUploadProgress({ ...uploadProgress, [fieldName]: false });
        }
    };

    const handleRemoveImage = (fieldName: string) => {
        setConfig({ ...config, [fieldName]: '' });
    };

    return (
        <Container className="py-4">
            <Row>
                <Col>
                    <h1 className="mb-4">Configuración de Landing Page</h1>

                    {success && (
                        <Alert variant="success" dismissible onClose={() => setSuccess(false)}>
                            Configuración guardada exitosamente
                        </Alert>
                    )}

                    {error && (
                        <Alert variant="danger" dismissible onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}

                    {/* Botón destacado para Pricing Plans */}
                    <Card className="mb-4 border-primary">
                        <Card.Body className="d-flex justify-content-between align-items-center">
                            <div>
                                <h5 className="mb-1">💰 Planes de Pricing</h5>
                                <p className="text-muted mb-0">
                                    Configura los precios y características de los planes que se muestran en la landing page
                                </p>
                            </div>
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={() => window.location.href = '/admin/pricing-plans'}
                            >
                                Editar Planes →
                            </Button>
                        </Card.Body>
                    </Card>

                    <form onSubmit={handleSave}>
                        <Card className="mb-4">
                            <Card.Header>
                                <h5 className="mb-0">Configuración General</h5>
                            </Card.Header>
                            <Card.Body>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email de Contacto</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={config.contactEmail}
                                        onChange={(e) => setConfig({ ...config, contactEmail: e.target.value })}
                                        placeholder="contacto@tuempresa.com"
                                    />
                                    <Form.Text className="text-muted">
                                        Los formularios de demo se enviarán a este email
                                    </Form.Text>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Días de Demo Gratuito</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="1"
                                        max="30"
                                        value={config.demoTrialDays}
                                        onChange={(e) => setConfig({ ...config, demoTrialDays: parseInt(e.target.value) })}
                                    />
                                    <Form.Text className="text-muted">
                                        Duración del período de prueba (1-30 días)
                                    </Form.Text>
                                </Form.Group>
                            </Card.Body>
                        </Card>

                        <Card className="mb-4">
                            <Card.Header>
                                <h5 className="mb-0">Campos del Formulario</h5>
                            </Card.Header>
                            <Card.Body>
                                <Form.Check
                                    type="checkbox"
                                    label="Teléfono (requerido)"
                                    checked={config.formFields.requirePhone}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        formFields: { ...config.formFields, requirePhone: e.target.checked }
                                    })}
                                    className="mb-2"
                                />
                                <Form.Check
                                    type="checkbox"
                                    label="Nombre de la institución (requerido)"
                                    checked={config.formFields.requireCompany}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        formFields: { ...config.formFields, requireCompany: e.target.checked }
                                    })}
                                    className="mb-2"
                                />
                                <Form.Check
                                    type="checkbox"
                                    label="Cargo/Puesto (requerido)"
                                    checked={config.formFields.requirePosition}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        formFields: { ...config.formFields, requirePosition: e.target.checked }
                                    })}
                                    className="mb-2"
                                />
                                <Form.Check
                                    type="checkbox"
                                    label="Tamaño de institución (requerido)"
                                    checked={config.formFields.requireSize}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        formFields: { ...config.formFields, requireSize: e.target.checked }
                                    })}
                                    className="mb-2"
                                />
                                <Form.Check
                                    type="checkbox"
                                    label="Mensaje/Necesidades (requerido)"
                                    checked={config.formFields.requireMessage}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        formFields: { ...config.formFields, requireMessage: e.target.checked }
                                    })}
                                    className="mb-2"
                                />
                            </Card.Body>
                        </Card>

                        <Card className="mb-4">
                            <Card.Header>
                                <h5 className="mb-0">Respuesta Automática</h5>
                            </Card.Header>
                            <Card.Body>
                                <Form.Check
                                    type="checkbox"
                                    label="Enviar respuesta automática al usuario"
                                    checked={config.autoResponse}
                                    onChange={(e) => setConfig({ ...config, autoResponse: e.target.checked })}
                                    className="mb-3"
                                />

                                {config.autoResponse && (
                                    <Form.Group>
                                        <Form.Label>Mensaje de Respuesta Automática</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            value={config.autoResponseMessage}
                                            onChange={(e) => setConfig({ ...config, autoResponseMessage: e.target.value })}
                                        />
                                    </Form.Group>
                                )}
                            </Card.Body>
                        </Card>

                        <Card className="mb-4">
                            <Card.Header>
                                <h5 className="mb-0">🖼️ Imágenes de Landing Page</h5>
                            </Card.Header>
                            <Card.Body>
                                <p className="text-muted mb-4">
                                    Configura las imágenes que se mostrarán en la landing page. Soporta GIF, PNG y JPG.
                                    Las imágenes se comprimirán automáticamente si son muy grandes.
                                </p>

                                <Row>
                                    {/* Hero Image */}
                                    <Col md={6} className="mb-4">
                                        <Form.Group>
                                            <Form.Label>Imagen Hero Principal</Form.Label>
                                            {config.landingHeroImage && (
                                                <div className="mb-2">
                                                    <img
                                                        src={config.landingHeroImage}
                                                        alt="Hero"
                                                        style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                                                        className="border rounded"
                                                    />
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        className="mt-2 w-100"
                                                        onClick={() => handleRemoveImage('landingHeroImage')}
                                                    >
                                                        Eliminar
                                                    </Button>
                                                </div>
                                            )}
                                            <Form.Control
                                                type="file"
                                                accept="image/gif,image/png,image/jpeg,image/jpg"
                                                onChange={(e) => handleImageUpload(e as any, 'landingHeroImage')}
                                                disabled={uploadProgress.landingHeroImage}
                                            />
                                            {uploadProgress.landingHeroImage && (
                                                <Form.Text className="text-primary">Subiendo...</Form.Text>
                                            )}
                                        </Form.Group>
                                    </Col>

                                    {/* Hero Image A */}
                                    <Col md={6} className="mb-4">
                                        <Form.Group>
                                            <Form.Label>Imagen Hero A</Form.Label>
                                            {config.landingHeroImageA && (
                                                <div className="mb-2">
                                                    <img
                                                        src={config.landingHeroImageA}
                                                        alt="Hero A"
                                                        style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                                                        className="border rounded"
                                                    />
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        className="mt-2 w-100"
                                                        onClick={() => handleRemoveImage('landingHeroImageA')}
                                                    >
                                                        Eliminar
                                                    </Button>
                                                </div>
                                            )}
                                            <Form.Control
                                                type="file"
                                                accept="image/gif,image/png,image/jpeg,image/jpg"
                                                onChange={(e) => handleImageUpload(e as any, 'landingHeroImageA')}
                                                disabled={uploadProgress.landingHeroImageA}
                                            />
                                            {uploadProgress.landingHeroImageA && (
                                                <Form.Text className="text-primary">Subiendo...</Form.Text>
                                            )}
                                        </Form.Group>
                                    </Col>

                                    {/* Hero Image B */}
                                    <Col md={6} className="mb-4">
                                        <Form.Group>
                                            <Form.Label>Imagen Hero B</Form.Label>
                                            {config.landingHeroImageB && (
                                                <div className="mb-2">
                                                    <img
                                                        src={config.landingHeroImageB}
                                                        alt="Hero B"
                                                        style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                                                        className="border rounded"
                                                    />
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        className="mt-2 w-100"
                                                        onClick={() => handleRemoveImage('landingHeroImageB')}
                                                    >
                                                        Eliminar
                                                    </Button>
                                                </div>
                                            )}
                                            <Form.Control
                                                type="file"
                                                accept="image/gif,image/png,image/jpeg,image/jpg"
                                                onChange={(e) => handleImageUpload(e as any, 'landingHeroImageB')}
                                                disabled={uploadProgress.landingHeroImageB}
                                            />
                                            {uploadProgress.landingHeroImageB && (
                                                <Form.Text className="text-primary">Subiendo...</Form.Text>
                                            )}
                                        </Form.Group>
                                    </Col>

                                    {/* Hero Image C */}
                                    <Col md={6} className="mb-4">
                                        <Form.Group>
                                            <Form.Label>Imagen Hero C</Form.Label>
                                            {config.landingHeroImageC && (
                                                <div className="mb-2">
                                                    <img
                                                        src={config.landingHeroImageC}
                                                        alt="Hero C"
                                                        style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                                                        className="border rounded"
                                                    />
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        className="mt-2 w-100"
                                                        onClick={() => handleRemoveImage('landingHeroImageC')}
                                                    >
                                                        Eliminar
                                                    </Button>
                                                </div>
                                            )}
                                            <Form.Control
                                                type="file"
                                                accept="image/gif,image/png,image/jpeg,image/jpg"
                                                onChange={(e) => handleImageUpload(e as any, 'landingHeroImageC')}
                                                disabled={uploadProgress.landingHeroImageC}
                                            />
                                            {uploadProgress.landingHeroImageC && (
                                                <Form.Text className="text-primary">Subiendo...</Form.Text>
                                            )}
                                        </Form.Group>
                                    </Col>

                                    {/* Screenshot 1 */}
                                    <Col md={6} className="mb-4">
                                        <Form.Group>
                                            <Form.Label>Screenshot 1</Form.Label>
                                            {config.landingScreenshot1 && (
                                                <div className="mb-2">
                                                    <img
                                                        src={config.landingScreenshot1}
                                                        alt="Screenshot 1"
                                                        style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                                                        className="border rounded"
                                                    />
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        className="mt-2 w-100"
                                                        onClick={() => handleRemoveImage('landingScreenshot1')}
                                                    >
                                                        Eliminar
                                                    </Button>
                                                </div>
                                            )}
                                            <Form.Control
                                                type="file"
                                                accept="image/gif,image/png,image/jpeg,image/jpg"
                                                onChange={(e) => handleImageUpload(e as any, 'landingScreenshot1')}
                                                disabled={uploadProgress.landingScreenshot1}
                                            />
                                            {uploadProgress.landingScreenshot1 && (
                                                <Form.Text className="text-primary">Subiendo...</Form.Text>
                                            )}
                                        </Form.Group>
                                    </Col>

                                    {/* Screenshot 2 */}
                                    <Col md={6} className="mb-4">
                                        <Form.Group>
                                            <Form.Label>Screenshot 2</Form.Label>
                                            {config.landingScreenshot2 && (
                                                <div className="mb-2">
                                                    <img
                                                        src={config.landingScreenshot2}
                                                        alt="Screenshot 2"
                                                        style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                                                        className="border rounded"
                                                    />
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        className="mt-2 w-100"
                                                        onClick={() => handleRemoveImage('landingScreenshot2')}
                                                    >
                                                        Eliminar
                                                    </Button>
                                                </div>
                                            )}
                                            <Form.Control
                                                type="file"
                                                accept="image/gif,image/png,image/jpeg,image/jpg"
                                                onChange={(e) => handleImageUpload(e as any, 'landingScreenshot2')}
                                                disabled={uploadProgress.landingScreenshot2}
                                            />
                                            {uploadProgress.landingScreenshot2 && (
                                                <Form.Text className="text-primary">Subiendo...</Form.Text>
                                            )}
                                        </Form.Group>
                                    </Col>

                                    {/* Screenshot 3 */}
                                    <Col md={6} className="mb-4">
                                        <Form.Group>
                                            <Form.Label>Screenshot 3</Form.Label>
                                            {config.landingScreenshot3 && (
                                                <div className="mb-2">
                                                    <img
                                                        src={config.landingScreenshot3}
                                                        alt="Screenshot 3"
                                                        style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                                                        className="border rounded"
                                                    />
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        className="mt-2 w-100"
                                                        onClick={() => handleRemoveImage('landingScreenshot3')}
                                                    >
                                                        Eliminar
                                                    </Button>
                                                </div>
                                            )}
                                            <Form.Control
                                                type="file"
                                                accept="image/gif,image/png,image/jpeg,image/jpg"
                                                onChange={(e) => handleImageUpload(e as any, 'landingScreenshot3')}
                                                disabled={uploadProgress.landingScreenshot3}
                                            />
                                            {uploadProgress.landingScreenshot3 && (
                                                <Form.Text className="text-primary">Subiendo...</Form.Text>
                                            )}
                                        </Form.Group>
                                    </Col>

                                    {/* Screenshot 4 */}
                                    <Col md={6} className="mb-4">
                                        <Form.Group>
                                            <Form.Label>Screenshot 4</Form.Label>
                                            {config.landingScreenshot4 && (
                                                <div className="mb-2">
                                                    <img
                                                        src={config.landingScreenshot4}
                                                        alt="Screenshot 4"
                                                        style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                                                        className="border rounded"
                                                    />
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        className="mt-2 w-100"
                                                        onClick={() => handleRemoveImage('landingScreenshot4')}
                                                    >
                                                        Eliminar
                                                    </Button>
                                                </div>
                                            )}
                                            <Form.Control
                                                type="file"
                                                accept="image/gif,image/png,image/jpeg,image/jpg"
                                                onChange={(e) => handleImageUpload(e as any, 'landingScreenshot4')}
                                                disabled={uploadProgress.landingScreenshot4}
                                            />
                                            {uploadProgress.landingScreenshot4 && (
                                                <Form.Text className="text-primary">Subiendo...</Form.Text>
                                            )}
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        <div className="d-flex gap-2">
                            <Button type="submit" variant="primary" disabled={loading}>
                                {loading ? 'Guardando...' : 'Guardar Configuración'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline-secondary"
                                onClick={() => window.location.href = '/admin'}
                            >
                                Cancelar
                            </Button>
                        </div>
                    </form>
                </Col>
            </Row>
        </Container>
    );
}
