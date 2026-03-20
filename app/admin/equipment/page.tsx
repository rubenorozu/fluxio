'use client';

import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Spinner, Alert, Container, Row, Col, Modal, Form, ButtonGroup } from 'react-bootstrap';
import { useSession } from '@/context/SessionContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Interfaces
interface Image { id: string; url: string; }
interface Space { id: string; name: string; }
interface Equipment {
  id: string;
  displayId: string | null;
  name: string;
  description: string | null;
  serialNumber: string | null;
  fixedAssetId: string | null;
  images: Image[];
  status: string;
  responsibleUserIds?: string[];
  spaceId: string | null;
  responsibleUsers?: { id: string; firstName: string; lastName: string; }[];
  reservationLeadTime: number | null;
  maxReservationDuration: number | null; // NEW: Add maxReservationDuration to Equipment interface
  isFixedToSpace: boolean;
  regulationsUrl?: string | null;
  location?: { name: string } | null;
  units?: any[];
  createdAt: string;
  updatedAt: string;
}
interface ResponsibleUser { id: string; firstName: string; lastName: string; email: string; }

export default function AdminEquipmentPage() {
  const { user, loading: sessionLoading } = useSession();
  const router = useRouter();

  // State declarations
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingEquipment, setReportingEquipment] = useState<Equipment | null>(null);
  const [reportDescription, setReportDescription] = useState('');
  const [currentEquipment, setCurrentEquipment] = useState<Equipment | null>(null);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [duplicateCount, setDuplicateCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', serialNumber: '', fixedAssetId: '', responsibleUserIds: [] as string[], spaceId: '', reservationLeadTime: '', maxReservationDuration: '', isFixedToSpace: false, regulationsUrl: '' });
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [selectedRegulationsFile, setSelectedRegulationsFile] = useState<File | null>(null);
  const [existingImages, setExistingImages] = useState<Image[]>([]);
  const [responsibleUsers, setResponsibleUsers] = useState<ResponsibleUser[]>([]);
  const [responsibleUsersLoading, setResponsibleUsersLoading] = useState(true);
  const [responsibleUsersError, setResponsibleUsersError] = useState<string | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [spacesLoading, setSpacesLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([]);
  const pageSize = 10;

  // Auth check effect
  useEffect(() => {
    if (!sessionLoading && (!user || (user.role !== 'SUPERUSER' && user.role !== 'ADMIN_RESOURCE'))) {
      router.push('/');
    }
  }, [user, sessionLoading, router]);

  // Data fetching functions with useCallback
  const fetchEquipment = useCallback(async (searchQuery: string = '', responsibleUserId: string | null = null, page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/admin/equipment?search=${searchQuery}${responsibleUserId ? `&responsibleUserId=${responsibleUserId}` : ''}&page=${page}&pageSize=${pageSize}`;
      const token = localStorage.getItem('token');
      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cargar los equipos.');
      }
      const result = await response.json();
      setEquipment(result.equipment);
      setTotalPages(Math.ceil(result.totalEquipment / pageSize));
      setSelectedEquipmentIds([]); // Clear selection on new fetch
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInitialData = useCallback(async () => {
    setResponsibleUsersLoading(true);
    setSpacesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const [usersRes, spacesRes] = await Promise.all([
        user?.role === 'SUPERUSER' ? fetch('/api/admin/responsible-users', { headers }) : Promise.resolve(null),
        fetch('/api/admin/all-spaces', { headers })
      ]);

      if (usersRes && usersRes.ok) {
        const usersData: ResponsibleUser[] = await usersRes.json();
        setResponsibleUsers(usersData);
      } else if (usersRes) {
        setResponsibleUsersError('Error al cargar responsables');
      }

      if (spacesRes.ok) {
        const spacesData: Space[] = await spacesRes.json();
        setSpaces(spacesData);

      } else {
        const errorData = await spacesRes.json();
        setError(prev => (prev ? prev + ' | ' : '') + `Error al cargar espacios: ${errorData.error || spacesRes.statusText}`);
        console.error('DEBUG: Error al cargar espacios:', errorData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setResponsibleUsersLoading(false);
      setSpacesLoading(false);
    }
  }, [user]);

  // Effects to trigger data fetching
  useEffect(() => {
    if (!sessionLoading && user) {
      const handler = setTimeout(() => {
        const responsibleId = user.role === 'ADMIN_RESOURCE' ? user.id : null;
        fetchEquipment(searchTerm, responsibleId, currentPage);
      }, 500);
      return () => clearTimeout(handler);
    }
  }, [sessionLoading, user, searchTerm, currentPage, fetchEquipment]);

  useEffect(() => {
    if (!sessionLoading && user) {
      fetchInitialData();
    }
  }, [sessionLoading, user, fetchInitialData]);

  // Modal and form handlers
  const handleShowModal = (item?: Equipment) => {
    setCurrentEquipment(item || null);
    setIsDuplicating(false);
    setForm({
      name: item?.name || '',
      description: item?.description || '',
      serialNumber: item?.serialNumber || '',
      fixedAssetId: item?.fixedAssetId || '',
      responsibleUserIds: item ? (item.responsibleUsers?.map(u => u.id) || []) : (user && user.role === 'ADMIN_RESOURCE' ? [user.id] : []),
      spaceId: item?.spaceId || '',
      reservationLeadTime: item?.reservationLeadTime?.toString() || '', // Initialize reservationLeadTime
      maxReservationDuration: item?.maxReservationDuration ? (item.maxReservationDuration / 60).toString() : '', // Convert minutes to hours
      isFixedToSpace: item?.isFixedToSpace || false, // Initialize isFixedToSpace
      regulationsUrl: item?.regulationsUrl || '',
    });
    setExistingImages(item?.images || []);
    setSelectedFiles(null);
    setSelectedRegulationsFile(null);
    setError(null);
    setSuccess(null);
    setShowModal(true);
  };

  const handleDuplicate = (item: Equipment) => {
    setCurrentEquipment(null); // Asegurarse de que no se está editando
    setIsDuplicating(true);
    setDuplicateCount(1);
    setForm({
      name: `${item.name}`,
      description: item.description || '',
      serialNumber: '', // El número de serie debe ser único
      fixedAssetId: '', // El ID de activo fijo debe ser único
      responsibleUserIds: item.responsibleUsers?.map(u => u.id) || [],
      spaceId: item.spaceId || '',
      reservationLeadTime: item.reservationLeadTime?.toString() || '', // Duplicate reservationLeadTime
      maxReservationDuration: item.maxReservationDuration ? (item.maxReservationDuration / 60).toString() : '',
      isFixedToSpace: item.isFixedToSpace || false, // Duplicate isFixedToSpace
      regulationsUrl: item.regulationsUrl || '',
    });
    setExistingImages(item.images || []);
    setSelectedFiles(null);
    setSelectedRegulationsFile(null);
    setError(null);
    setSuccess(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentEquipment(null);
    setIsDuplicating(false);
    setForm({ name: '', description: '', serialNumber: '', fixedAssetId: '', responsibleUserIds: [], spaceId: '', reservationLeadTime: '', maxReservationDuration: '', isFixedToSpace: false, regulationsUrl: '' });
    setExistingImages([]);
    setSelectedFiles(null);
    setSelectedRegulationsFile(null);
    setError(null);
  };

  const handleShowReportModal = (item: Equipment) => {
    setReportingEquipment(item);
    setShowReportModal(true);
  };

  const handleCloseReportModal = () => {
    setShowReportModal(false);
    setReportingEquipment(null);
    setReportDescription('');
    setError(null);
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingEquipment) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipmentId: reportingEquipment.id, description: reportDescription }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar el reporte.');
      }

      setSuccess('Reporte enviado correctamente.');
      handleCloseReportModal();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleResponsibleUsersChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
    setForm(prev => ({ ...prev, responsibleUserIds: selectedOptions }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files);
  };

  const handleRemoveExistingImage = (imageId: string) => {
    setExistingImages(prevImages => prevImages.filter(img => img.id !== imageId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDuplicating) {
      await handleDuplicateSubmit();
      return;
    }
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    let uploadedImageUrls: { url: string }[] = existingImages.map(img => ({ url: img.url }));
    if (selectedFiles && selectedFiles.length > 0) {
      try {
        // Comprimir imágenes antes de subir
        const { compressImages } = await import('@/lib/image-utils');
        const filesToUpload = Array.from(selectedFiles);
        const compressedFiles = await compressImages(filesToUpload, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.85,
          maxSizeMB: 4,
        });

        const formData = new FormData();
        for (const file of compressedFiles) {
          formData.append('files', file);
        }

        const uploadResponse = await fetch('/api/upload', { method: 'POST', body: formData, credentials: 'include' });

        const contentType = uploadResponse.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('El servidor no está disponible. Por favor contacta al administrador.');
        }

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok) {
          throw new Error(uploadData.error || 'Error al subir las imágenes.');
        }

        uploadedImageUrls = [...uploadedImageUrls, ...uploadData.urls.map((url: string) => ({ url }))];
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error desconocido al subir las imágenes');
        setIsSubmitting(false);
        return;
      }
    }

    let finalRegulationsUrl = form.regulationsUrl;
    if (selectedRegulationsFile) {
      try {
        const formData = new FormData();
        formData.append('files', selectedRegulationsFile);
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || 'Error al subir el reglamento.');
        }

        const uploadData = await uploadResponse.json();
        if (uploadData.urls && uploadData.urls.length > 0) {
          finalRegulationsUrl = uploadData.urls[0];
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error desconocido al subir el reglamento');
        setIsSubmitting(false);
        return;
      }
    }

    const method = currentEquipment ? 'PUT' : 'POST';
    const url = currentEquipment ? `/api/admin/equipment/${currentEquipment.id}` : '/api/admin/equipment';
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          reservationLeadTime: form.reservationLeadTime ? parseInt(form.reservationLeadTime, 10) : null,
          maxReservationDuration: (form.maxReservationDuration && !isNaN(parseFloat(form.maxReservationDuration))) ? parseFloat(form.maxReservationDuration) * 60 : null,
          isFixedToSpace: form.isFixedToSpace,
          images: uploadedImageUrls,
          regulationsUrl: finalRegulationsUrl || null,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error al ${currentEquipment ? 'actualizar' : 'crear'} el equipo.`);
      }
      setSuccess(`Equipo ${currentEquipment ? 'actualizado' : 'creado'} correctamente.`);
      handleCloseModal();
      fetchEquipment(searchTerm, user?.role === 'ADMIN_RESOURCE' ? user.id : null, currentPage);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicateSubmit = async () => {
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    let uploadedImageUrls: { url: string }[] = existingImages.map(img => ({ url: img.url }));
    if (selectedFiles && selectedFiles.length > 0) {
      try {
        // Comprimir imágenes antes de subir
        const { compressImages } = await import('@/lib/image-utils');
        const filesToUpload = Array.from(selectedFiles);
        const compressedFiles = await compressImages(filesToUpload, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.85,
          maxSizeMB: 4,
        });

        const formData = new FormData();
        for (const file of compressedFiles) {
          formData.append('files', file);
        }

        const uploadResponse = await fetch('/api/upload', { method: 'POST', body: formData, credentials: 'include' });

        const contentType = uploadResponse.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('El servidor no está disponible. Por favor contacta al administrador.');
        }

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok) {
          throw new Error(uploadData.error || 'Error al subir las imágenes.');
        }

        uploadedImageUrls = [...uploadedImageUrls, ...uploadData.urls.map((url: string) => ({ url }))];
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error desconocido al subir las imágenes');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      for (let i = 0; i < duplicateCount; i++) {
        const newName = duplicateCount > 1 ? `${form.name} ${i + 1}` : form.name;
        const response = await fetch('/api/admin/equipment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            name: newName,
            serialNumber: '',
            fixedAssetId: '',
            reservationLeadTime: form.reservationLeadTime ? parseInt(form.reservationLeadTime, 10) : null,
            maxReservationDuration: (form.maxReservationDuration && !isNaN(parseFloat(form.maxReservationDuration))) ? parseFloat(form.maxReservationDuration) * 60 : null,
            isFixedToSpace: form.isFixedToSpace,
            images: uploadedImageUrls
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Error al crear la copia ${i + 1} del equipo.`);
        }
      }
      setSuccess(`${duplicateCount} ${duplicateCount > 1 ? 'copias creadas' : 'copia creada'} correctamente.`);
      handleCloseModal();
      fetchEquipment(searchTerm, user?.role === 'ADMIN_RESOURCE' ? user.id : null, currentPage);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (equipmentId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este equipo? Esta acción es irreversible.')) return;
    try {
      const response = await fetch(`/api/admin/equipment/${equipmentId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'No se pudo eliminar el equipo.');
      }
      alert('Equipo eliminado correctamente.');
      fetchEquipment(searchTerm, user?.role === 'ADMIN_RESOURCE' ? user.id : null, currentPage);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
        alert(`Error al eliminar: ${err.message}`);
      } else {
        setError('An unknown error occurred');
        alert('An unknown error occurred');
      }
    }
  };

  const handleSelectAll = (isChecked: boolean) => {
    if (isChecked) {
      setSelectedEquipmentIds(equipment.map(item => item.id));
    } else {
      setSelectedEquipmentIds([]);
    }
  };

  const handleSelectEquipment = (equipmentId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedEquipmentIds(prev => [...prev, equipmentId]);
    } else {
      setSelectedEquipmentIds(prev => prev.filter(id => id !== equipmentId));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEquipmentIds.length === 0) return;

    if (!window.confirm(`¿Estás seguro de que quieres eliminar ${selectedEquipmentIds.length} equipo(s) seleccionado(s)? Esta acción es irreversible.`)) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/admin/equipment/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedEquipmentIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar los equipos seleccionados.');
      }

      setSuccess('Equipo(s) eliminado(s) correctamente.');
      setSelectedEquipmentIds([]); // Clear selection after successful deletion
      fetchEquipment(searchTerm, user?.role === 'ADMIN_RESOURCE' ? user.id : null, currentPage);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      alert(`Error al eliminar: ${err instanceof Error ? err.message : 'An unknown error occurred'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (equipmentId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'AVAILABLE' ? 'IN_MAINTENANCE' : 'AVAILABLE';
    if (!window.confirm(`¿Estás seguro de que quieres cambiar el estado a ${newStatus === 'AVAILABLE' ? 'Disponible' : 'En Mantenimiento'}?`)) return;

    try {
      const response = await fetch(`/api/admin/equipment/${equipmentId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'No se pudo actualizar el estado del equipo.');
      }

      alert('Estado actualizado correctamente.');
      fetchEquipment(searchTerm, user?.role === 'ADMIN_RESOURCE' ? user.id : null, currentPage);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
        alert(`Error al actualizar el estado: ${err.message}`);
      } else {
        setError('An unknown error occurred');
        alert('An unknown error occurred');
      }
    }
  };

  if (sessionLoading || !user) {
    return <Container className="mt-5 text-center"><Spinner animation="border" /><p>Cargando sesión...</p></Container>;
  }

  if (user.role !== 'SUPERUSER' && user.role !== 'ADMIN_RESOURCE') {
    return <Alert variant="danger" className="mt-5">Acceso denegado. No tienes permisos de Superusuario o Administrador de Recursos.</Alert>;
  }

  return (
    <Container fluid style={{ paddingTop: '100px' }}>
      {/* Mobile Layout */}
      <div className="d-block d-md-none">
        <Row className="mb-3">
          <Col xs={12} className="text-center">
            <h2>Gestión de Equipos</h2>
          </Col>
          <Col xs={12} className="text-center mt-3">
            <Row className="g-0 mb-2">
              <Col xs={6} className="px-1">
                <Link href="/admin/equipment/new" passHref>
                  <Button variant="primary" className="w-100 text-nowrap overflow-hidden text-truncate">Añadir Nuevo Equipo</Button>
                </Link>
              </Col>
              <Col xs={6} className="px-1">
                <Button
                  variant="danger"
                  onClick={handleBulkDelete}
                  className="w-100 text-nowrap overflow-hidden text-truncate"
                  disabled={selectedEquipmentIds.length === 0 || isSubmitting}
                >
                  Eliminar Seleccionados ({selectedEquipmentIds.length})
                </Button>
              </Col>
              <Col xs={6} className="px-1">
                <Button variant="secondary" onClick={() => {
                  const link = document.createElement('a');
                  link.href = '/api/admin/export?model=equipment';
                  link.setAttribute('download', 'Equipos_TuCeproa.csv'); // Suggest a filename
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }} className="w-100 text-nowrap overflow-hidden text-truncate btn-hover-white-text">
                  Descargar CSV
                </Button>
              </Col>
            </Row>
            <div className="d-flex justify-content-end">
              <Link href="/admin" passHref>
                <Button variant="outline-secondary">Regresar</Button>
              </Link>
            </div>
          </Col>
        </Row>
        <Row className="mb-3">
          <Col>
            <Form.Control
              type="text"
              placeholder="Buscar equipos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Col>
        </Row>
      </div>

      {/* Desktop Layout */}
      <Row className="d-none d-md-flex align-items-center mb-3">
        <Col md={3} className="text-start"><h2>Gestión de Equipos</h2></Col>
        <Col md={9} className="text-end">
          <div className="d-flex justify-content-end gap-2">
            <Form.Control type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: 'auto' }} className="me-2" />
            <Link href="/admin/equipment/new" passHref>
              <Button variant="primary">Añadir Nuevo Equipo</Button>
            </Link>
            <Button
              variant="danger"
              onClick={handleBulkDelete}
              disabled={selectedEquipmentIds.length === 0 || isSubmitting}
            >
              Eliminar Seleccionados ({selectedEquipmentIds.length})
            </Button>
            <Button variant="secondary" onClick={() => {
              const link = document.createElement('a');
              link.href = '/api/admin/export?model=equipment';
              link.setAttribute('download', 'Equipos_TuCeproa.csv'); // Suggest a filename
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }} className="btn-hover-white-text">Descargar CSV</Button>
            <Link href="/admin" passHref><Button variant="outline-secondary">Regresar</Button></Link>
          </div>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center"><Spinner animation="border" /></div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : (
        <>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>
                  <Form.Check
                    type="checkbox"
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    checked={selectedEquipmentIds.length === equipment.length && equipment.length > 0}
                    disabled={equipment.length === 0}
                  />
                </th>
                <th>ID</th><th>Nombre</th><th>Ubicación</th><th>Unidades</th><th>Responsable</th><th>Estado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {equipment.map(item => (
                <tr key={item.id}>
                  <td>
                    <Form.Check
                      type="checkbox"
                      checked={selectedEquipmentIds.includes(item.id)}
                      onChange={(e) => handleSelectEquipment(item.id, e.target.checked)}
                    />
                  </td>
                  <td>{item.displayId || item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.location?.name || 'Sin Ubicación'}</td>
                  <td>{item.units ? item.units.length : 0} ud.</td>
                  <td>{item.responsibleUsers && item.responsibleUsers.length > 0 ? item.responsibleUsers.map(u => `${u.firstName} ${u.lastName}`).join(', ') : 'N/A'}</td>
                  <td>
                    <Button
                      variant={item.status === 'AVAILABLE' ? 'success' : 'danger'}
                      size="sm"
                      onClick={() => handleToggleStatus(item.id, item.status)}
                    >
                      {item.status === 'AVAILABLE' ? 'Disponible' : 'En Mantenimiento'}
                    </Button>
                  </td>
                  <td>
                    <Link href={`/admin/equipment/${item.id}/edit`} passHref>
                      <Button variant="warning" size="sm" className="me-2">Editar</Button>
                    </Link>
                    <Button variant="danger" size="sm" className="me-2" onClick={() => handleDelete(item.id)} disabled={item.id === user?.id}>Eliminar</Button>
                    <Button variant="info" size="sm" className="me-2" onClick={() => handleShowReportModal(item)}>Reportar</Button>
                    <Button variant="secondary" size="sm" onClick={() => handleDuplicate(item)}>Duplicar</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <div className="d-flex justify-content-center mt-3">
            <ButtonGroup>
              <Button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} variant="outline-primary">Anterior</Button>
              {[...Array(totalPages)].map((_, index) => (
                <Button key={index + 1} onClick={() => setCurrentPage(index + 1)} variant={currentPage === index + 1 ? 'primary' : 'outline-primary'}>{index + 1}</Button>
              ))}
              <Button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} variant="outline-primary">Siguiente</Button>
            </ButtonGroup>
          </div>
        </>
      )}

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton><Modal.Title>{isDuplicating ? 'Duplicar Equipo' : (currentEquipment ? 'Editar Equipo' : 'Añadir Nuevo Equipo')}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            {isDuplicating && (
              <Form.Group className="mb-3">
                <Form.Label>Número de Copias</Form.Label>
                <Form.Control type="number" value={duplicateCount} onChange={(e) => setDuplicateCount(parseInt(e.target.value, 10))} min="1" />
              </Form.Group>
            )}
            <Form.Group className="mb-3"><Form.Label>Nombre</Form.Label><Form.Control type="text" name="name" value={form.name} onChange={handleChange} required /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Descripción</Form.Label><Form.Control as="textarea" name="description" value={form.description || ''} onChange={handleChange} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Número de Serie</Form.Label><Form.Control type="text" name="serialNumber" value={form.serialNumber || ''} onChange={handleChange} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>ID de Activo Fijo</Form.Label><Form.Control type="text" name="fixedAssetId" value={form.fixedAssetId || ''} onChange={handleChange} /></Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Espacio (Sala)</Form.Label>
              {spacesLoading ? <Spinner animation="border" size="sm" /> : (
                <Form.Select name="spaceId" value={form.spaceId || ''} onChange={handleChange}>
                  <option value="">-- Ninguno (Equipo Independiente) --</option>
                  {spaces.map(space => (<option key={space.id} value={space.id}>{space.name}</option>))}
                </Form.Select>
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Imágenes</Form.Label>
              {existingImages.length > 0 && (
                <div className="mb-2 d-flex flex-wrap">
                  {existingImages.map(img => (
                    <div key={img.id} className="position-relative me-2 mb-2">
                      <img src={img.url} alt="Existing Image" width={50} height={50} style={{ objectFit: 'cover', margin: '2px' }} className="img-thumbnail" />
                      <Button
                        variant="danger"
                        size="sm"
                        className="position-absolute top-0 start-100 translate-middle rounded-circle p-0"
                        style={{ width: '20px', height: '20px', fontSize: '0.7rem', lineHeight: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => handleRemoveExistingImage(img.id)}
                      >
                        &times;
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <Form.Control type="file" name="files" multiple onChange={handleFileChange} />
              <Form.Text className="text-muted">Selecciona una o varias imágenes.</Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tiempo de Antelación para Reservas (horas)</Form.Label>
              <Form.Control
                type="number"
                name="reservationLeadTime"
                value={form.reservationLeadTime || ''}
                onChange={handleChange}
                placeholder="Deja vacío para usar el valor global"
                min="0"
              />
              <Form.Text className="text-muted">
                Tiempo mínimo de antelación (en horas) para reservar este equipo. Deja vacío para usar el valor global.
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Duración Máxima de Reserva (horas)</Form.Label>
              <Form.Control
                type="number"
                step="0.5"
                name="maxReservationDuration"
                value={form.maxReservationDuration || ''}
                onChange={handleChange}
                min="0"
                placeholder="Ej: 4 (dejar vacío para sin límite)"
              />
              <Form.Text className="text-muted">
                Si se deja vacío o en 0, no habrá límite de tiempo para este equipo.
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="¿Equipo fijo al espacio?"
                name="isFixedToSpace"
                checked={form.isFixedToSpace}
                onChange={(e) => setForm(prev => ({ ...prev, isFixedToSpace: e.target.checked }))}
              />
              <Form.Text className="text-muted">
                Marca esta opción si este equipo siempre se reserva junto con su espacio asignado.
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>ID de Usuario Responsable</Form.Label>
              {user?.role === 'ADMIN_RESOURCE' ? (
                <Form.Control
                  type="text"
                  value={currentEquipment ? (currentEquipment.responsibleUsers?.map(u => `${u.firstName} ${u.lastName}`).join(', ') || '') : (`${user.firstName || ''} ${user.lastName || ''}`).trim()}
                  readOnly
                  disabled
                />
              ) : (
                <>
                  {responsibleUsersLoading ? <Spinner animation="border" size="sm" /> :
                    responsibleUsersError ? <Alert variant="danger">Error al cargar responsables</Alert> :
                      (<Form.Select name="responsibleUserIds" multiple value={form.responsibleUserIds} onChange={handleResponsibleUsersChange} style={{ minHeight: '120px' }}>
                        {responsibleUsers.map(rUser => (
                          <option key={rUser.id} value={rUser.id}>{rUser.firstName} {rUser.lastName} ({rUser.email})</option>
                        ))}
                      </Form.Select>)
                  }
                </>
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Reglamento (PDF opcional)</Form.Label>
              <Form.Control
                type="file"
                accept=".pdf"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedRegulationsFile(e.target.files ? e.target.files[0] : null)}
              />
              <Form.Text className="text-muted d-block pb-2">
                Puedes subir un documento PDF con las reglas de uso del equipo.
              </Form.Text>
              {form.regulationsUrl && (
                <div className="mt-1 pb-2">
                  <a href={form.regulationsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-info">
                    Ver Reglamento Actual
                  </a>
                </div>
              )}
            </Form.Group>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}
            <Button variant="primary" type="submit" className="w-100" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : (isDuplicating ? 'Duplicar Equipo' : (currentEquipment ? 'Guardar Cambios' : 'Crear Equipo'))}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal show={showReportModal} onHide={handleCloseReportModal}>
        <Modal.Header closeButton>
          <Modal.Title>Reportar Problema con {reportingEquipment?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleReportSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Descripción del Problema</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                required
              />
            </Form.Group>
            {error && <Alert variant="danger">{error}</Alert>}
            <Button variant="primary" type="submit" className="w-100" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Enviar Reporte'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
}
