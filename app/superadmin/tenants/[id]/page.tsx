'use client';

import React, { useEffect, useState } from 'react';
import { Form, Button, Alert, Card, Spinner, Modal } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EditTenantPage({ params }: { params: { id: string } }) {
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [siteName, setSiteName] = useState('');
    const [topLogoUrl, setTopLogoUrl] = useState('');
    const [faviconUrl, setFaviconUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const router = useRouter();
    const { id } = params;

    // User Management State
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [userSaving, setUserSaving] = useState(false);
    const [userError, setUserError] = useState('');
    const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'USER' });

    useEffect(() => {
        fetchTenant();
        fetchUsers();
    }, [id]);

    const fetchUsers = async () => {
        setUsersLoading(true);
        try {
            const res = await fetch(`/api/superadmin/tenants/${id}/users`);
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setUsersLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setUserSaving(true);
        setUserError('');
        try {
            const res = await fetch(`/api/superadmin/tenants/${id}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error creating user');
            }

            setShowUserModal(false);
            fetchUsers(); // Refresh list
            setNewUser({ firstName: '', lastName: '', email: '', password: '', role: 'USER' }); // Reset form
        } catch (err: any) {
            setUserError(err.message);
        } finally {
            setUserSaving(false);
        }
    };

    const fetchTenant = async () => {
        try {
            const res = await fetch(`/api/superadmin/tenants/${id}`);
            if (!res.ok) throw new Error('Failed to fetch tenant');
            const data = await res.json();
            setName(data.name);
            setSlug(data.slug);
            setIsActive(data.isActive);
            if (data.config) {
                setSiteName(data.config.siteName || '');
                setTopLogoUrl(data.config.topLogoUrl || '');
                setFaviconUrl(data.config.faviconUrl || '');
            }
        } catch (err) {
            setError('Error al cargar la organización');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const res = await fetch(`/api/superadmin/tenants/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, slug, isActive, siteName, topLogoUrl, faviconUrl }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update tenant');
            }

            router.push('/superadmin/tenants');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/superadmin/tenants/${id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to delete tenant');
            }

            router.push('/superadmin/tenants');
        } catch (err: any) {
            setError(err.message);
            setShowDeleteModal(false);
            setSaving(false);
        }
    };

    if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;

    return (
        <div className="d-flex justify-content-center">
            <Card style={{ width: '100%', maxWidth: '600px' }}>
                <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                        <h4 className="mb-0">Editar Organización</h4>
                        <Link href="/superadmin/tenants" className="btn btn-outline-secondary btn-sm">Cancelar</Link>
                    </div>
                </Card.Header>
                <Card.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Nombre de la Organización</Form.Label>
                            <Form.Control
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Slug (Identificador de Subdominio)</Form.Label>
                            <Form.Control
                                type="text"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                required
                                pattern="[a-z0-9]+"
                                title="Solo letras minúsculas y números"
                            />
                        </Form.Group>

                        <hr />
                        <h5>Personalización (Branding)</h5>

                        <Form.Group className="mb-3">
                            <Form.Label>Nombre del Sitio</Form.Label>
                            <Form.Control
                                type="text"
                                value={siteName}
                                onChange={(e) => setSiteName(e.target.value)}
                                placeholder="Nombre que aparecerá en el título"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>URL del Logo (Superior)</Form.Label>
                            <Form.Control
                                type="text"
                                value={topLogoUrl}
                                onChange={(e) => setTopLogoUrl(e.target.value)}
                                placeholder="https://..."
                            />
                            {topLogoUrl && <div className="mt-2"><img src={topLogoUrl} alt="Preview" style={{ height: '40px' }} /></div>}
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>URL del Favicon</Form.Label>
                            <Form.Control
                                type="text"
                                value={faviconUrl}
                                onChange={(e) => setFaviconUrl(e.target.value)}
                                placeholder="https://..."
                            />
                            {faviconUrl && <div className="mt-2"><img src={faviconUrl} alt="Favicon Preview" style={{ height: '32px' }} /></div>}
                        </Form.Group>
                        <hr />

                        <Form.Group className="mb-3">
                            <Form.Check
                                type="switch"
                                label="Activo"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                            />
                        </Form.Group>

                        <div className="d-flex justify-content-between">
                            <Button variant="danger" onClick={() => setShowDeleteModal(true)} disabled={saving}>
                                Eliminar
                            </Button>
                            <Button variant="primary" type="submit" disabled={saving}>
                                {saving ? <Spinner animation="border" size="sm" /> : 'Guardar Cambios'}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>

            <Card style={{ width: '100%', maxWidth: '600px', marginTop: '20px' }}>
                <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Usuarios de la Organización</h5>
                        <Button variant="outline-primary" size="sm" onClick={() => setShowUserModal(true)}>
                            + Nuevo Usuario
                        </Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    {usersLoading ? (
                        <div className="text-center"><Spinner animation="border" size="sm" /></div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-sm table-hover">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Email</th>
                                        <th>Rol</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.length === 0 ? (
                                        <tr><td colSpan={3} className="text-center text-muted">No hay usuarios registrados</td></tr>
                                    ) : (
                                        users.map((u: any) => (
                                            <tr key={u.id}>
                                                <td>{u.firstName} {u.lastName}</td>
                                                <td>{u.email}</td>
                                                <td><span className="badge bg-secondary">{u.role}</span></td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card.Body>
            </Card>

            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirmar Eliminación</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    ¿Estás seguro de que deseas eliminar esta organización? Esta acción no se puede deshacer y podría eliminar todos los datos asociados.
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        Cancelar
                    </Button>
                    <Button variant="danger" onClick={handleDelete} disabled={saving}>
                        {saving ? 'Eliminando...' : 'Eliminar'}
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showUserModal} onHide={() => setShowUserModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Nuevo Usuario</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {userError && <Alert variant="danger">{userError}</Alert>}
                    <Form onSubmit={handleCreateUser}>
                        <Form.Group className="mb-3">
                            <Form.Label>Nombre</Form.Label>
                            <Form.Control type="text" required onChange={e => setNewUser({ ...newUser, firstName: e.target.value })} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Apellido</Form.Label>
                            <Form.Control type="text" required onChange={e => setNewUser({ ...newUser, lastName: e.target.value })} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control type="email" required onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Contraseña</Form.Label>
                            <Form.Control type="password" required onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Rol</Form.Label>
                            <Form.Select onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                                <option value="USER">Usuario Normal</option>
                                <option value="SUPERUSER">Superusuario (Admin)</option>
                                <option value="ADMIN_RESOURCE">Admin Recursos</option>
                                <option value="ADMIN_RESERVATION">Admin Reservas</option>
                                <option value="VIGILANCIA">Vigilancia</option>
                            </Form.Select>
                        </Form.Group>
                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="secondary" onClick={() => setShowUserModal(false)}>Cancelar</Button>
                            <Button variant="primary" type="submit" disabled={userSaving}>
                                {userSaving ? 'Creando...' : 'Crear Usuario'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
}
