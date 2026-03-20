'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/context/SessionContext';

export default function NewEquipmentPage() {
  const { user: sessionUser, loading: sessionLoading } = useSession();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [fixedAssetId, setFixedAssetId] = useState('');
  const [users, setUsers] = useState<{ id: string; name: string; email: string; role: string }[]>([]);
  const [responsibleUserIds, setResponsibleUserIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [regulationsFile, setRegulationsFile] = useState<File | null>(null);
  const [locations, setLocations] = useState<{ id: string; name: string; zone: string | null }[]>([]);
  const [locationId, setLocationId] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (sessionLoading) return;

    const fetchUsersAndLocations = async () => {
      try {
        const [usersRes, locsRes] = await Promise.all([
          fetch('/api/admin/users'),
          fetch('/api/admin/locations')
        ]);
        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(data.filter((u: { role: string }) => u.role === 'SUPERUSER' || u.role === 'ADMIN_RESOURCE'));
        }
        if (locsRes.ok) {
          const locData = await locsRes.json();
          setLocations(locData);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    fetchUsersAndLocations();
  }, [router, sessionLoading, sessionUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name) {
      setError('El nombre del equipo es obligatorio.');
      return;
    }

    let imageUrls: string[] = [];
    let regulationsUrl = null;

    try {
      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append('files', imageFile);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: imageFormData });
        if (!uploadRes.ok) throw new Error('Error al subir la imagen.');
        const uploadData = await uploadRes.json();
        imageUrls = uploadData.urls;
      }

      if (regulationsFile) {
        const regsFormData = new FormData();
        regsFormData.append('files', regulationsFile);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: regsFormData });
        if (!uploadRes.ok) throw new Error('Error al subir el reglamento.');
        const uploadData = await uploadRes.json();
        regulationsUrl = uploadData.urls[0];
      }

      const res = await fetch('/api/admin/equipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          serialNumber,
          fixedAssetId,
          responsibleUserIds,
          images: imageUrls.map(url => ({ url })),
          regulationsUrl,
          locationId: locationId || undefined,
          quantity: quantity > 0 ? quantity : 1,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al crear el equipo.');
      }

      setSuccess('Equipo creado con éxito!');
      setName('');
      setDescription('');
      setSerialNumber('');
      setFixedAssetId('');
      router.push('/admin/equipment');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  return (
    <div className="container" style={{ paddingTop: '100px' }}>
      <h2 style={{ color: '#0076A8' }}>Crear Nuevo Equipo</h2>
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
        <div className="row mb-3">
          <div className="col-md-6">
            <label htmlFor="quantity" className="form-label">Cantidad de Unidades</label>
            <input
              type="number"
              className="form-control"
              id="quantity"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              required
            />
            <small className="text-muted">Se generará automáticamente esta cantidad de unidades editables.</small>
          </div>
          <div className="col-md-6">
            <label htmlFor="locationId" className="form-label">Ubicación</label>
            <select
              className="form-select"
              id="locationId"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
            >
              <option value="">Seleccione una ubicación...</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} {loc.zone ? `(${loc.zone})` : ''}
                </option>
              ))}
            </select>
          </div>
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
        </div>
        <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#0076A8', borderColor: '#0076A8' }}>
          Crear Equipo
        </button>
        <Link href="/admin/equipment" className="btn btn-secondary ms-2">Cancelar</Link>
      </form>
    </div>
  );
}
