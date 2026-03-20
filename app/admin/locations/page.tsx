'use client';

import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Spinner, Alert, Container, Row, Col, Form, Modal } from 'react-bootstrap';
import { useSession } from '@/context/SessionContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Role } from '@prisma/client';

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>({ name: '', zone: '', description: '' });

  const { user: currentUser, loading: sessionLoading } = useSession();
  const router = useRouter();

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/locations');
      if (!response.ok) {
        throw new Error('Error al cargar las ubicaciones.');
      }
      const data = await response.json();
      setLocations(data);
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionLoading && (!currentUser || (currentUser.role !== Role.SUPERUSER && currentUser.role !== Role.ADMIN_RESOURCE))) {
      router.push('/admin');
    }
  }, [currentUser, sessionLoading, router]);

  useEffect(() => {
    if (!sessionLoading && currentUser && (currentUser.role === Role.SUPERUSER || currentUser.role === Role.ADMIN_RESOURCE)) {
      fetchLocations();
    }
  }, [sessionLoading, currentUser, fetchLocations]);

  const handleOpenModal = (location?: any) => {
    if (location) {
      setIsEditing(true);
      setCurrentLocation(location);
    } else {
      setIsEditing(false);
      setCurrentLocation({ name: '', zone: '', description: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentLocation({ name: '', zone: '', description: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentLocation(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLocation.name.trim()) {
      alert('El nombre es obligatorio.');
      return;
    }

    try {
      const url = isEditing && currentLocation.id 
        ? `/api/admin/locations/${currentLocation.id}` 
        : '/api/admin/locations';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentLocation)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al guardar la ubicación.');
      }

      handleCloseModal();
      fetchLocations();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta ubicación?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/locations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'No se pudo eliminar la ubicación.');
      }

      setLocations(locations.filter(loc => loc.id !== id));
      alert('Ubicación eliminada correctamente.');
    } catch (err: any) {
      alert(`Error al eliminar: ${err.message}`);
    }
  };

  if (sessionLoading || !currentUser) {
    return <Container className="mt-5 text-center"><Spinner animation="border" /><p>Cargando sesión...</p></Container>;
  }

  if (currentUser.role !== Role.SUPERUSER && currentUser.role !== Role.ADMIN_RESOURCE) {
    return <Alert variant="danger" className="mt-5">Acceso denegado.</Alert>;
  }

  return (
    <Container fluid style={{ paddingTop: '100px' }}>
      <Row className="mb-3">
        <Col md={6}>
          <h2>Gestión de Ubicaciones</h2>
        </Col>
        <Col md={6} className="text-end">
          <Button variant="primary" onClick={() => handleOpenModal()} className="me-2">Nueva Ubicación</Button>
          <Link href="/admin" passHref>
            <Button variant="outline-secondary">Regresar</Button>
          </Link>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center mt-5"><Spinner animation="border" /></div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Zona/Edificio</th>
              <th>Descripción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {locations.length > 0 ? (
              locations.map(loc => (
                <tr key={loc.id}>
                  <td><strong>{loc.name}</strong></td>
                  <td>{loc.zone || '-'}</td>
                  <td>{loc.description || '-'}</td>
                  <td>
                    <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleOpenModal(loc)}>
                      Editar
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(loc.id)}>
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center">No hay ubicaciones registradas.</td>
              </tr>
            )}
          </tbody>
        </Table>
      )}

      {/* Modal para Crear/Editar Ubicación */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? 'Editar Ubicación' : 'Nueva Ubicación'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nombre <span className="text-danger">*</span></Form.Label>
              <Form.Control 
                type="text" 
                name="name"
                value={currentLocation.name} 
                onChange={handleChange} 
                required 
                placeholder="Ej. Cabina de Audio 1"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Zona/Edificio</Form.Label>
              <Form.Control 
                type="text" 
                name="zone"
                value={currentLocation.zone} 
                onChange={handleChange} 
                placeholder="Ej. Edificio 5, Campus Norte"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control 
                as="textarea"
                rows={3}
                name="description"
                value={currentLocation.description} 
                onChange={handleChange} 
                placeholder="Detalles adicionales sobre la ubicación"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
            <Button variant="primary" type="submit">Guardar</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}
