'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Table, Modal, Form, Alert, Spinner, Badge, Card } from 'react-bootstrap';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTenant } from '@/context/TenantContext';

interface Tenant {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    plan: string;
    maxUsers: number;
    maxResources: number;
    maxStorage: number;
    trialDays?: number;
    trialExpiresAt?: string;
    createdAt: string;
    _count: {
        users: number;
        spaces: number;
        equipment: number;
    };
}

export default function TenantsPage() {
    const tenant = useTenant();
    const router = useRouter();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', slug: '' });
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    // Confirmation Modal State
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ type: 'toggle' | 'delete'; id: string; name?: string; isActive?: boolean } | null>(null);

    // User Management State
    const [showUserModal, setShowUserModal] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [showNewUserForm, setShowNewUserForm] = useState(false);
    const [userSaving, setUserSaving] = useState(false);
    const [userError, setUserError] = useState('');
    const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'USER' });

    // Plan Management State
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [selectedTenantForPlan, setSelectedTenantForPlan] = useState<Tenant | null>(null);
    const handleClosePlanModal = () => {
        setShowPlanModal(false);
        setSelectedTenantForPlan(null);
        setPlanFormData({ plan: 'BASIC', maxUsers: 100, maxResources: 50, maxStorage: 10, trialDays: 7 });
    };
    const [planFormData, setPlanFormData] = useState({ plan: 'BASIC', maxUsers: 100, maxResources: 50, maxStorage: 10, trialDays: 7 });

    useEffect(() => {
        fetchTenants();
    }, []);

    const handleUsersClick = (tenant: Tenant) => {
        setSelectedTenant(tenant);
        setShowUserModal(true);
        fetchUsers(tenant.id);
        setShowNewUserForm(false);
    };

    const handlePlanClick = (tenant: Tenant) => {
        setSelectedTenantForPlan(tenant);
        setPlanFormData({
            plan: tenant.plan,
            maxUsers: tenant.maxUsers,
            maxResources: tenant.maxResources,
            maxStorage: tenant.maxStorage,
            trialDays: tenant.trialDays || 7
        });
        setShowPlanModal(true);
    };

    const fetchUsers = async (tenantId: string) => {
        setUsersLoading(true);
        try {
            const res = await fetch(`/api/superadmin/tenants/${tenantId}/users`);
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
        if (!selectedTenant) return;

        setUserSaving(true);
        setUserError('');
        try {
            const res = await fetch(`/api/superadmin/tenants/${selectedTenant.id}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error creating user');
            }

            fetchUsers(selectedTenant.id); // Refresh list
            setNewUser({ firstName: '', lastName: '', email: '', password: '', role: 'USER' }); // Reset form
            setShowNewUserForm(false);
        } catch (err: any) {
            setUserError(err.message);
        } finally {
            setUserSaving(false);
        }
    };

    const handleUpdatePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTenantForPlan) return;

        setSubmitting(true);
        setSubmitError('');
        try {
            const res = await fetch(`/api/admin/tenants/${selectedTenantForPlan.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(planFormData)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error updating plan');
            }

            fetchTenants(); // Refresh list
            setShowPlanModal(false);
        } catch (err: any) {
            setSubmitError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const fetchTenants = async () => {
        try {
            const res = await fetch('/api/admin/tenants');
            if (!res.ok) {
                if (res.status === 403) {
                    setError('No tienes permisos para ver esta página.');
                } else {
                    setError('Error al cargar las organizaciones.');
                }
                return;
            }
            const data = await res.json();
            setTenants(data);
        } catch (err) {
            setError('Error de conexión.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setSubmitError('');

        try {
            const res = await fetch('/api/admin/tenants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Error al crear la organización');
            }

            // Success
            setShowModal(false);
            setFormData({ name: '', slug: '' });
            fetchTenants(); // Refresh list
        } catch (err: any) {
            setSubmitError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatusClick = (id: string, isActive: boolean) => {
        setConfirmAction({ type: 'toggle', id, isActive });
        setShowConfirmModal(true);
    };

    const handleDeleteClick = (id: string, name: string) => {
        setConfirmAction({ type: 'delete', id, name });
        setShowConfirmModal(true);
    };

    const handleConfirmAction = async () => {
        if (!confirmAction) return;

        try {
            if (confirmAction.type === 'toggle') {
                const res = await fetch(`/api/admin/tenants/${confirmAction.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isActive: !confirmAction.isActive }),
                });
                if (!res.ok) throw new Error('Error al actualizar estado');
            } else if (confirmAction.type === 'delete') {
                const res = await fetch(`/api/admin/tenants/${confirmAction.id}`, {
                    method: 'DELETE',
                });
                if (!res.ok) throw new Error('Error al eliminar');
            }
            fetchTenants();
        } catch (err) {
            alert('Ocurrió un error al procesar la acción.');
        } finally {
            setShowConfirmModal(false);
            setConfirmAction(null);
        }
    };

    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Auto-slugify logic could go here
        const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        setFormData({ ...formData, slug: value });
    };

    // Check if current tenant is the default platform tenant
    const isPlatformAdmin = tenant?.slug === 'platform';

    useEffect(() => {
        if (tenant && !isPlatformAdmin) {
            router.push('/admin');
        }
    }, [tenant, isPlatformAdmin, router]);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mt-5">
                <Alert variant="danger">{error}</Alert>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Gestión de Organizaciones</h1>
                {isPlatformAdmin && (
                    <Button variant="primary" onClick={() => setShowModal(true)}>
                        + Nueva Organización
                    </Button>
                )}
            </div>

            <div className="card shadow-sm">
                <div className="card-body p-0">
                    <Table responsive hover className="mb-0">
                        <thead className="bg-light">
                            <tr>
                                <th>Nombre</th>
                                <th>Slug (URL)</th>
                                <th>Plan</th>
                                <th>Estado</th>
                                <th>Usuarios</th>
                                <th>Recursos</th>
                                <th>Creado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tenants.map((tenant) => {
                                const totalResources = tenant._count.spaces + tenant._count.equipment;
                                const resourceUsage = (totalResources / tenant.maxResources) * 100;
                                const userUsage = (tenant._count.users / tenant.maxUsers) * 100;

                                return (
                                    <tr key={tenant.id}>
                                        <td className="fw-bold">{tenant.name}</td>
                                        <td>
                                            <code className="text-primary">{tenant.slug}</code>
                                        </td>
                                        <td>
                                            <Badge bg={
                                                tenant.plan === 'TRIAL' ? 'info' :
                                                    tenant.plan === 'ENTERPRISE' ? 'dark' :
                                                        tenant.plan === 'PROFESSIONAL' ? 'primary' : 'secondary'
                                            }>
                                                {tenant.plan === 'TRIAL' ? `Prueba (${tenant.trialDays || 7} días)` :
                                                    tenant.plan === 'BASIC' ? 'Básico' :
                                                        tenant.plan === 'PROFESSIONAL' ? 'Profesional' : 'Enterprise'}
                                            </Badge>
                                        </td>
                                        <td>
                                            {tenant.isActive ? (
                                                <Badge bg="success">Activo</Badge>
                                            ) : (
                                                <Badge bg="secondary">Inactivo</Badge>
                                            )}
                                        </td>
                                        <td>
                                            <div>
                                                <small className="text-muted">{tenant._count.users} / {tenant.maxUsers}</small>
                                                <div className="progress" style={{ height: '4px' }}>
                                                    <div
                                                        className={`progress-bar ${userUsage > 90 ? 'bg-danger' : userUsage > 70 ? 'bg-warning' : 'bg-success'}`}
                                                        style={{ width: `${Math.min(userUsage, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div>
                                                <small className="text-muted">{totalResources} / {tenant.maxResources}</small>
                                                <div className="progress" style={{ height: '4px' }}>
                                                    <div
                                                        className={`progress-bar ${resourceUsage > 90 ? 'bg-danger' : resourceUsage > 70 ? 'bg-warning' : 'bg-success'}`}
                                                        style={{ width: `${Math.min(resourceUsage, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{format(new Date(tenant.createdAt), 'dd MMM yyyy', { locale: es })}</td>
                                        <td>
                                            <div className="d-flex gap-2">
                                                {/* Detectar si estamos en producción o desarrollo */}
                                                {(() => {
                                                    const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
                                                    const baseDomain = isProduction ? 'fluxiorsv.vercel.app' : 'localhost:3000';
                                                    const tenantUrl = `http${isProduction ? 's' : ''}://${tenant.slug}.${baseDomain}`;
                                                    return (
                                                        <Button variant="outline-secondary" size="sm" href={tenantUrl} target="_blank">
                                                            Visitar
                                                        </Button>
                                                    );
                                                })()}
                                                <Button variant="outline-primary" size="sm" onClick={() => handlePlanClick(tenant)}>
                                                    Plan
                                                </Button>
                                                <Button variant="outline-info" size="sm" onClick={() => handleUsersClick(tenant)}>
                                                    Usuarios
                                                </Button>
                                                <Button
                                                    variant={tenant.isActive ? "outline-warning" : "outline-success"}
                                                    size="sm"
                                                    onClick={() => handleToggleStatusClick(tenant.id, tenant.isActive)}
                                                >
                                                    {tenant.isActive ? 'Pausar' : 'Activar'}
                                                </Button>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => handleDeleteClick(tenant.id, tenant.name)}
                                                >
                                                    Eliminar
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {tenants.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center py-5 text-muted">
                                        No hay organizaciones registradas.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </div>
            </div>

            {/* Create Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Nueva Organización</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleCreate}>
                    <Modal.Body>
                        {submitError && <Alert variant="danger">{submitError}</Alert>}

                        <Form.Group className="mb-3">
                            <Form.Label>Nombre de la Organización</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Ej. Universidad Central"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Slug (Identificador URL)</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="ej. universidad-central"
                                value={formData.slug}
                                onChange={handleSlugChange}
                                required
                            />
                            <Form.Text className="text-muted">
                                Este identificador se usará en la URL: {formData.slug || 'slug'}.fluxio.com
                            </Form.Text>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            Cancelar
                        </Button>
                        <Button variant="primary" type="submit" disabled={submitting}>
                            {submitting ? 'Creando...' : 'Crear Organización'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Confirmation Modal */}
            <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirmar Acción</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {confirmAction?.type === 'toggle' && (
                        <p>
                            ¿Estás seguro de que deseas <strong>{confirmAction.isActive ? 'pausar' : 'activar'}</strong> esta organización?
                            {confirmAction.isActive && <br />}
                            <small className="text-muted">
                                {confirmAction.isActive
                                    ? 'Los usuarios no podrán acceder mientras esté pausada.'
                                    : 'Los usuarios volverán a tener acceso.'}
                            </small>
                        </p>
                    )}
                    {confirmAction?.type === 'delete' && (
                        <p>
                            ¿Estás seguro de que deseas <strong>ELIMINAR</strong> la organización <strong>{confirmAction.name}</strong>?
                            <br />
                            <span className="text-danger fw-bold">Esta acción no se puede deshacer.</span>
                        </p>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
                        Cancelar
                    </Button>
                    <Button
                        variant={confirmAction?.type === 'delete' ? 'danger' : 'primary'}
                        onClick={handleConfirmAction}
                    >
                        Confirmar
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Plan Management Modal */}
            <Modal show={showPlanModal} onHide={() => setShowPlanModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Gestionar Plan - {selectedTenantForPlan?.name}</Modal.Title>
                </Modal.Header>
                <form onSubmit={handleUpdatePlan}>
                    <Modal.Body>
                        {submitError && <Alert variant="danger">{submitError}</Alert>}

                        <Form.Group className="mb-3">
                            <Form.Label>Plan</Form.Label>
                            <Form.Select
                                value={planFormData.plan}
                                onChange={(e) => {
                                    const plan = e.target.value;
                                    let limits = { maxUsers: 100, maxResources: 50, maxStorage: 10 };
                                    if (plan === 'PROFESSIONAL') {
                                        limits = { maxUsers: 500, maxResources: 999999, maxStorage: 50 };
                                    } else if (plan === 'ENTERPRISE') {
                                        limits = { maxUsers: 999999, maxResources: 999999, maxStorage: 999999 };
                                    }
                                    setPlanFormData({ ...limits, plan, trialDays: 7 });
                                }}
                                required
                            >
                                <option value="TRIAL">Prueba - Gratuito (temporal)</option>
                                <option value="BASIC">Básico - $99 MXN/mes</option>
                                <option value="PROFESSIONAL">Profesional - $199 MXN/mes</option>
                                <option value="ENTERPRISE">Enterprise - Personalizado</option>
                            </Form.Select>
                        </Form.Group>

                        {planFormData.plan === 'TRIAL' && (
                            <Form.Group className="mb-3">
                                <Form.Label>Días de Prueba</Form.Label>
                                <Form.Control
                                    type="number"
                                    min="1"
                                    max="90"
                                    value={planFormData.trialDays}
                                    onChange={(e) => setPlanFormData({ ...planFormData, trialDays: parseInt(e.target.value) })}
                                />
                                <Form.Text className="text-muted">
                                    Número de días del período de prueba (1-90 días)
                                </Form.Text>
                            </Form.Group>
                        )}

                        <Form.Group className="mb-3">
                            <Form.Label>Límite de Usuarios</Form.Label>
                            <Form.Control
                                type="number"
                                value={planFormData.maxUsers}
                                onChange={(e) => setPlanFormData({ ...planFormData, maxUsers: parseInt(e.target.value) })}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Límite de Recursos (Espacios + Equipos)</Form.Label>
                            <Form.Control
                                type="number"
                                value={planFormData.maxResources}
                                onChange={(e) => setPlanFormData({ ...planFormData, maxResources: parseInt(e.target.value) })}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Almacenamiento (GB)</Form.Label>
                            <Form.Control
                                type="number"
                                value={planFormData.maxStorage}
                                onChange={(e) => setPlanFormData({ ...planFormData, maxStorage: parseInt(e.target.value) })}
                                required
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowPlanModal(false)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            disabled={submitting}
                            onClick={async () => {
                                if (!selectedTenantForPlan) return;
                                setSubmitting(true);
                                try {
                                    const res = await fetch(`/api/superadmin/tenants/${selectedTenantForPlan.id}/plan`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(planFormData)
                                    });
                                    if (res.ok) {
                                        await fetchTenants();
                                        handleClosePlanModal();
                                    }
                                } catch (error) {
                                    console.error('Error updating plan:', error);
                                } finally {
                                    setSubmitting(false);
                                }
                            }}
                        >
                            {submitting ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </Modal.Footer>
                </form>
            </Modal>

            {/* User Management Modal */}
            <Modal show={showUserModal} onHide={() => setShowUserModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Usuarios de {selectedTenant?.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="d-flex justify-content-end mb-3">
                        <Button variant="outline-primary" size="sm" onClick={() => setShowNewUserForm(!showNewUserForm)}>
                            {showNewUserForm ? 'Cancelar Nuevo Usuario' : '+ Nuevo Usuario'}
                        </Button>
                    </div>

                    {showNewUserForm && (
                        <Card className="mb-3 bg-light">
                            <Card.Body>
                                {userError && <Alert variant="danger">{userError}</Alert>}
                                <Form onSubmit={handleCreateUser}>
                                    <div className="row">
                                        <div className="col-md-6 mb-2">
                                            <Form.Control placeholder="Nombre" required value={newUser.firstName} onChange={e => setNewUser({ ...newUser, firstName: e.target.value })} />
                                        </div>
                                        <div className="col-md-6 mb-2">
                                            <Form.Control placeholder="Apellido" required value={newUser.lastName} onChange={e => setNewUser({ ...newUser, lastName: e.target.value })} />
                                        </div>
                                        <div className="col-md-6 mb-2">
                                            <Form.Control placeholder="Email" type="email" required value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                                        </div>
                                        <div className="col-md-6 mb-2">
                                            <Form.Control placeholder="Contraseña" type="password" required value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
                                        </div>
                                        <div className="col-md-12 mb-2">
                                            <Form.Select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                                                <option value="USER">Usuario Normal</option>
                                                <option value="SUPERUSER">Superusuario (Admin)</option>
                                                <option value="ADMIN_RESOURCE">Admin Recursos</option>
                                                <option value="ADMIN_RESERVATION">Admin Reservas</option>
                                                <option value="VIGILANCIA">Vigilancia</option>
                                            </Form.Select>
                                        </div>
                                    </div>
                                    <div className="d-flex justify-content-end mt-2">
                                        <Button type="submit" size="sm" disabled={userSaving}>
                                            {userSaving ? 'Creando...' : 'Crear Usuario'}
                                        </Button>
                                    </div>
                                </Form>
                            </Card.Body>
                        </Card>
                    )}

                    {usersLoading ? (
                        <div className="text-center"><Spinner animation="border" size="sm" /></div>
                    ) : (
                        <div className="table-responsive">
                            <Table size="sm" hover>
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
                                                <td><Badge bg="secondary">{u.role}</Badge></td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Modal.Body>
            </Modal>
        </div>
    );
}
