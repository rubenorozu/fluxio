'use client';

import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Spinner, Alert, Container, Row, Col, Form, ButtonGroup } from 'react-bootstrap';
import { useSession } from '@/context/SessionContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Role } from '@prisma/client'; // Importar Role

// Definimos el tipo de dato para un usuario, basándonos en lo que devuelve la API
interface User {
  id: string;
  displayId: string | null;
  name: string;
  email: string;
  role: Role;
  isVerified: boolean;
  isActive?: boolean;
  createdAt: string;
  identifier: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10; // Define page size
  const { user: currentUser, loading: sessionLoading } = useSession();
  const router = useRouter();

  const fetchUsers = useCallback(async (searchQuery: string = '', page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users?search=${searchQuery}&page=${page}&pageSize=${pageSize}`, {
        headers: {
          'x-user-role': currentUser?.role || '',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cargar los usuarios.');
      }
      const result = await response.json();
      setUsers(result.users);
      setTotalPages(Math.ceil(result.totalUsers / pageSize));
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!sessionLoading && (!currentUser || currentUser.role !== 'SUPERUSER')) {
      router.push('/');
    }
  }, [currentUser, sessionLoading, router]);

  useEffect(() => {
    if (!sessionLoading && currentUser && currentUser.role === 'SUPERUSER') {
      const handler = setTimeout(() => {
        fetchUsers(searchTerm, currentPage);
      }, 500); // Debounce por 500ms

      return () => {
        clearTimeout(handler);
      };
    }
  }, [sessionLoading, currentUser, searchTerm, currentPage, fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: Role) => {
    if (!window.confirm(`¿Estás seguro de que deseas cambiar el rol de este usuario a ${newRole}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'No se pudo actualizar el rol.');
      }

      setUsers(users.map(u => (u.id === userId ? { ...u, role: newRole } : u)));
      alert('Rol actualizado correctamente.');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
        alert(`Error al actualizar el rol: ${err.message}`);
      } else {
        setError('An unknown error occurred');
        alert('An unknown error occurred');
      }
      fetchUsers(searchTerm, currentPage); // Re-fetch para revertir el cambio visual en caso de error
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar a este usuario? Esta acción es irreversible.')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'No se pudo eliminar el usuario.');
      }

      setUsers(users.filter(user => user.id !== userId));
      alert('Usuario eliminado correctamente.');
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

  const handleToggleActive = async (user: User) => {
    const isDeactivating = user.isActive !== false;
    const confirmMessage = isDeactivating
      ? `¿Estás seguro de que deseas desactivar a ${user.name || user.email}?\n\n- El usuario no podrá iniciar sesión.\n- Se conservará todo su historial de reservaciones.\n- Los espacios y equipos a su cargo serán protegidos.`
      : `¿Deseas reactivar la cuenta de ${user.name || user.email}?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isDeactivating }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo actualizar el estado del usuario.');
      }

      setUsers(users.map(u => (u.id === user.id ? { ...u, isActive: data.isActive } : u)));
      alert(data.message || 'Estado del usuario actualizado correctamente.');
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`Error al actualizar estado: ${err.message}`);
      } else {
        alert('Ocurrió un error inesperado.');
      }
    }
  };

  const handleResetPassword = async (userId: string, userEmail: string) => {
    const newPassword = window.prompt(`Introduce la nueva contraseña temporal para ${userEmail}:`);
    if (!newPassword) {
      return;
    }
    if (newPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'No se pudo restablecer la contraseña.');
      }

      alert(`Contraseña de ${userEmail} restablecida correctamente.`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
        alert(`Error al restablecer la contraseña: ${err.message}`);
      } else {
        setError('An unknown error occurred');
        alert('An unknown error occurred');
      }
    }
  };

  if (sessionLoading || !currentUser) {
    return <Container className="mt-5 text-center"><Spinner animation="border" /><p>Cargando sesión...</p></Container>;
  }

  if (currentUser.role !== 'SUPERUSER') {
    return <Alert variant="danger" className="mt-5">Acceso denegado. No tienes permisos de Superusuario.</Alert>;
  }

  return (
    <Container fluid style={{ paddingTop: '100px' }}>
      {/* Mobile Layout */}
      <div className="d-block d-md-none">
        <Row className="mb-3">
          <Col xs={12} className="text-center">
            <h2>Gestión de Usuarios</h2>
          </Col>
          <Col xs={12} className="text-center mt-3">
            <Row className="g-2">
              <Col xs={6}>
                <Button variant="secondary" onClick={() => window.location.href = '/api/admin/export?model=users'} className="w-100 btn-hover-white-text">
                  Descargar CSV
                </Button>
              </Col>
              <Col xs={6}>
                <Link href="/admin" passHref>
                  <Button variant="outline-secondary" className="w-100">Regresar</Button>
                </Link>
              </Col>
            </Row>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col>
            <Form.Control
              type="text"
              placeholder="Buscar usuarios por nombre, email, matrícula o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Col>
        </Row>
      </div>

      {/* Desktop Layout */}
      <Row className="d-none d-md-flex align-items-center mb-3">
        <Col md={3} className="text-start">
          <h2>Gestión de Usuarios</h2>
        </Col>
        <Col md={9} className="text-end">
          <div className="d-flex justify-content-end gap-2">
            <Form.Control
              type="text"
              placeholder="Buscar usuarios por nombre, email, matrícula o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 'auto' }} // Allow natural width
            />
            <Button variant="secondary" onClick={() => window.location.href = '/api/admin/export?model=users'} className="btn-hover-white-text">
              Descargar CSV
            </Button>
            <Link href="/admin" passHref>
              <Button variant="outline-secondary">Regresar</Button>
            </Link>
          </div>
        </Col>
      </Row>

      {loading && (
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </Spinner>
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && !error && (
        <>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>ID del Usuario</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Matrícula / ID</th>
                <th>Estado</th>
                <th>Verificado</th>
                <th>Fecha de Creación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className={user.isActive === false ? 'table-secondary opacity-75' : ''}>
                  <td className="align-middle">{user.displayId || user.id}</td>
                  <td className="align-middle">
                    <strong>{user.name}</strong>
                    {user.isActive === false && <span className="ms-2 text-muted small">(Desactivado)</span>}
                  </td>
                  <td className="align-middle">{user.email}</td>
                  <td className="align-middle">
                    <Form.Select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                      disabled={user.id === currentUser.id || user.isActive === false}
                    >
                      {Object.values(Role).map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </Form.Select>
                  </td>
                  <td className="align-middle">{user.identifier}</td>
                  <td className="align-middle">
                    <span className={`badge ${user.isActive !== false ? 'bg-success' : 'bg-secondary'}`}>
                      {user.isActive !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="align-middle">{user.isVerified ? 'Sí' : 'No'}</td>
                  <td className="align-middle">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="align-middle">
                    <Button
                      variant={user.isActive !== false ? 'outline-warning' : 'outline-success'}
                      size="sm"
                      className="me-2"
                      onClick={() => handleToggleActive(user)}
                      disabled={user.id === currentUser.id}
                      title={user.isActive !== false ? 'Desactivar acceso sin borrar historial' : 'Reactivar acceso al usuario'}
                    >
                      {user.isActive !== false ? 'Desactivar' : 'Reactivar'}
                    </Button>
                    <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleResetPassword(user.id, user.email)}>
                      Contraseña
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(user.id)} disabled={user.id === currentUser.id} title="Eliminación definitiva">
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <div className="d-flex justify-content-center mt-3">
            <ButtonGroup>
              <Button
                variant="outline-primary"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              {[...Array(totalPages)].map((_, index) => (
                <Button
                  key={index + 1}
                  variant={currentPage === index + 1 ? 'primary' : 'outline-primary'}
                  onClick={() => setCurrentPage(index + 1)}
                >
                  {index + 1}
                </Button>
              ))}
              <Button
                variant="outline-primary"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </ButtonGroup>
          </div>
        </>
      )}
    </Container>
  );
}