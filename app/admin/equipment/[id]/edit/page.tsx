'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Equipment {
  id: string;
  name: string;
  description: string | null;
  serialNumber: string | null;
  fixedAssetId: string | null;
  images: { url: string }[] | null;
  regulationsUrl: string | null;
  responsibleUsers?: { id: string }[];
}

export default function EditEquipmentPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [fixedAssetId, setFixedAssetId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [regulationsUrl, setRegulationsUrl] = useState('');
  const [users, setUsers] = useState<{ id: string; name: string; email: string; role: string }[]>([]);
  const [responsibleUserIds, setResponsibleUserIds] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [regulationsFile, setRegulationsFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (!token || !user || JSON.parse(user).role !== 'SUPERUSER') {
      router.push('/login');
      return;
    }

    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUsers(data.filter((u: { role: string }) => u.role === 'SUPERUSER' || u.role === 'ADMIN_RESOURCE'));
        } else {
          console.error('Failed to fetch users');
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };

    const fetchEquipment = async () => {
      try {
        const res = await fetch(`/api/admin/equipment/${id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Error al cargar el equipo.');
        }

        const data: Equipment = await res.json();
        setName(data.name);
        setDescription(data.description || '');
        setSerialNumber(data.serialNumber || '');
        setFixedAssetId(data.fixedAssetId || '');
        setImageUrl(data.images?.[0]?.url || '');
        setRegulationsUrl(data.regulationsUrl || '');
        setResponsibleUserIds(data.responsibleUsers?.map(u => u.id) || []);
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

    if (id) {
      fetchUsers();
      fetchEquipment();
    }
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name) {
      setError('El nombre del equipo es obligatorio.');
      return;
    }

    const token = localStorage.getItem('token');

    let currentImageUrl = imageUrl;
    let currentRegulationsUrl = regulationsUrl;

    try {
      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append('files', imageFile);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: imageFormData });
        if (!uploadRes.ok) throw new Error('Error al subir la imagen.');
        const uploadData = await uploadRes.json();
        currentImageUrl = uploadData.urls[0];
      }

      if (regulationsFile) {
        const regsFormData = new FormData();
        regsFormData.append('files', regulationsFile);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: regsFormData });
        if (!uploadRes.ok) throw new Error('Error al subir el reglamento.');
        const uploadData = await uploadRes.json();
        currentRegulationsUrl = uploadData.urls[0];
      }

      const res = await fetch(`/api/admin/equipment/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description,
          serialNumber,
          fixedAssetId,
          responsibleUserIds,
          images: currentImageUrl ? [{ url: currentImageUrl }] : [],
          regulationsUrl: currentRegulationsUrl || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al actualizar el equipo.');
      }

      setSuccess('Equipo actualizado con éxito!');
      router.push('/admin/equipment');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido.');
    }
  };

  if (loading) {
    return <div className="container mt-5">Cargando equipo...</div>;
  }

  if (error && !name) { // Only show error if equipment data could not be loaded
    return <div className="container mt-5 alert alert-danger">Error: {error}</div>;
  }

  return (
    <div className="container" style={{ paddingTop: '100px' }}>
      <h2 style={{ color: '#0076A8' }}>Editar Equipo</h2>
      <hr />
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="name" className="form-label">Nombre del Equipo</label>
          <input
            type="text"
            className="form-control"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="description" className="form-label">Descripción</label>
          <textarea
            className="form-control"
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>
        <div className="mb-3">
          <label htmlFor="serialNumber" className="form-label">Número de Serie (opcional)</label>
          <input
            type="text"
            className="form-control"
            id="serialNumber"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="fixedAssetId" className="form-label">ID de Activo Fijo (opcional)</label>
          <input
            type="text"
            className="form-control"
            id="fixedAssetId"
            value={fixedAssetId}
            onChange={(e) => setFixedAssetId(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="responsibleUsers" className="form-label">Encargados</label>
          <select
            multiple
            className="form-select"
            id="responsibleUsers"
            value={responsibleUserIds}
            onChange={(e) => {
              const options = e.target.options;
              const selected: string[] = [];
              for (let i = 0; i < options.length; i++) {
                if (options[i].selected) {
                  selected.push(options[i].value);
                }
              }
              setResponsibleUserIds(selected);
            }}
          >
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
            ))}
          </select>
          <small className="text-muted">Mantén presionado Ctrl (Windows) o Cmd (Mac) para seleccionar múltiples encargados.</small>
        </div>
        <div className="mb-3">
          <label htmlFor="regulationsFile" className="form-label">Reglamento (PDF opcional)</label>
          <input
            type="file"
            className="form-control"
            id="regulationsFile"
            accept="application/pdf"
            onChange={(e) => setRegulationsFile(e.target.files ? e.target.files[0] : null)}
          />
          {regulationsUrl && <small className="text-muted d-block mt-1">Reglamento actual: <a href={regulationsUrl} target="_blank" rel="noopener noreferrer">Ver</a></small>}
        </div>
        <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#0076A8', borderColor: '#0076A8' }}>
          Actualizar Equipo
        </button>
        <Link href="/admin/equipment" className="btn btn-secondary ms-2">Cancelar</Link>
      </form>
    </div>
  );
}