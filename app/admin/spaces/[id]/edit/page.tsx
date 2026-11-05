'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Space {
  id: string;
  name: string;
  description: string | null;
  images: { url: string }[] | null;
  regulationsUrl: string | null;
  responsibleUsers?: { id: string }[];
  maxReservationDuration: number | null;
}

export default function EditSpacePage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [existingImages, setExistingImages] = useState<{ url: string }[]>([]);
  const [regulationsUrl, setRegulationsUrl] = useState('');
  const [users, setUsers] = useState<{ id: string; name: string; email: string; role: string }[]>([]);
  const [responsibleUserIds, setResponsibleUserIds] = useState<string[]>([]);
  const [maxReservationDuration, setMaxReservationDuration] = useState<string>('');
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

    const fetchSpace = async () => {
      try {
        const res = await fetch(`/api/admin/spaces/${id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Error al cargar el espacio.');
        }

        const data: Space = await res.json();
        setName(data.name);
        setDescription(data.description || '');
        setExistingImages(data.images || []);
        setRegulationsUrl(data.regulationsUrl || '');
        setResponsibleUserIds(data.responsibleUsers?.map(u => u.id) || []);
        // Convert minutes to hours for the UI
        if (data.maxReservationDuration) {
          setMaxReservationDuration((data.maxReservationDuration / 60).toString());
        } else {
          setMaxReservationDuration('');
        }
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
      fetchSpace();
    }
  }, [id, router]);

  const handleSetCoverImage = (index: number) => {
    setExistingImages(prevImages => {
      if (index <= 0 || index >= prevImages.length) return prevImages;
      const copy = [...prevImages];
      const [selected] = copy.splice(index, 1);
      return [selected, ...copy];
    });
  };

  const handleMoveImage = (index: number, direction: 'left' | 'right') => {
    setExistingImages(prevImages => {
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prevImages.length) return prevImages;
      const copy = [...prevImages];
      const [moved] = copy.splice(index, 1);
      copy.splice(targetIndex, 0, moved);
      return copy;
    });
  };

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name) {
      setError('El nombre del espacio es obligatorio.');
      return;
    }

    const token = localStorage.getItem('token');

    let finalImages = [...existingImages];
    let currentRegulationsUrl = regulationsUrl;

    try {
      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append('files', imageFile);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: imageFormData });
        if (!uploadRes.ok) throw new Error('Error al subir la imagen.');
        const uploadData = await uploadRes.json();
        if (uploadData.urls && uploadData.urls.length > 0) {
          finalImages.push({ url: uploadData.urls[0] });
        }
      }

      if (regulationsFile) {
        const regsFormData = new FormData();
        regsFormData.append('files', regulationsFile);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: regsFormData });
        if (!uploadRes.ok) throw new Error('Error al subir el reglamento.');
        const uploadData = await uploadRes.json();
        currentRegulationsUrl = uploadData.urls[0];
      }

      const spaceData = {
        name,
        description,
        responsibleUserIds,
        maxReservationDuration: maxReservationDuration && !isNaN(parseFloat(maxReservationDuration))
          ? parseFloat(maxReservationDuration) * 60
          : null,
        images: finalImages,
        regulationsUrl: currentRegulationsUrl || null,
      };

      const res = await fetch(`/api/admin/spaces/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(spaceData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al actualizar el espacio.');
      }

      setSuccess('Espacio actualizado con éxito!');
      router.push('/admin/spaces');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido.');
    }
  };

  if (loading) {
    return <div className="container mt-5">Cargando espacio...</div>;
  }

  if (error && !name) { // Only show error if space data could not be loaded
    return <div className="container mt-5 alert alert-danger">Error: {error}</div>;
  }

  return (
    <div className="container" style={{ paddingTop: '100px' }}>
      <h2 style={{ color: '#0076A8' }}>Editar Espacio</h2>
      <hr />
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="name" className="form-label">Nombre del Espacio</label>
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
          <label htmlFor="maxReservationDuration" className="form-label">Duración Máxima de Reserva (horas)</label>
          <input
            type="number"
            step="0.5"
            min="0"
            className="form-control"
            id="maxReservationDuration"
            placeholder="Ej: 4 (dejar vacío para sin límite)"
            value={maxReservationDuration}
            onChange={(e) => setMaxReservationDuration(e.target.value)}
          />
          <small className="text-muted">Si se deja vacío o en 0, no habrá límite de tiempo para este espacio.</small>
        </div>
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <label className="form-label fw-bold mb-0">Imágenes del Espacio</label>
            {existingImages.length > 0 && (
              <span className="badge bg-warning text-dark" style={{ fontSize: '0.7rem' }}>
                La 1ª imagen es la Portada
              </span>
            )}
          </div>

          {existingImages.length > 0 && (
            <div className="p-2 border rounded bg-light mb-2">
              <div className="d-flex flex-wrap gap-2">
                {existingImages.map((img, index) => {
                  const isCover = index === 0;
                  return (
                    <div
                      key={img.url + index}
                      className={`position-relative p-1 rounded bg-white shadow-sm border ${
                        isCover ? 'border-warning border-2' : 'border-secondary-subtle'
                      }`}
                      style={{ width: '100px' }}
                    >
                      {/* Botón eliminar */}
                      <button
                        type="button"
                        className="btn btn-danger btn-sm position-absolute top-0 end-0 translate-middle rounded-circle p-0 shadow-sm"
                        style={{
                          width: '20px',
                          height: '20px',
                          fontSize: '0.75rem',
                          lineHeight: '1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 10,
                        }}
                        onClick={() => handleRemoveExistingImage(index)}
                        title="Eliminar esta imagen"
                      >
                        &times;
                      </button>

                      {/* Miniatura */}
                      <a
                        href={img.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Clic para ver en tamaño completo"
                        style={{ display: 'block', width: '100%', height: '65px', overflow: 'hidden', borderRadius: '4px' }}
                      >
                        <img
                          src={img.url}
                          alt={`Imagen ${index + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </a>

                      {/* Estado de Portada y Acciones */}
                      <div className="mt-1 d-flex flex-column gap-1">
                        {isCover ? (
                          <span
                            className="badge bg-warning text-dark text-center py-1 fw-bold"
                            style={{ fontSize: '0.68rem' }}
                          >
                            ★ Portada
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm w-100 py-0 px-1 text-nowrap"
                            style={{ fontSize: '0.65rem', height: '22px', lineHeight: '20px' }}
                            onClick={() => handleSetCoverImage(index)}
                            title="Establecer como imagen de portada"
                          >
                            Hacer Portada
                          </button>
                        )}

                        {/* Controles de orden */}
                        <div className="d-flex justify-content-between align-items-center">
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm py-0 px-1"
                            style={{ fontSize: '0.65rem', height: '18px', lineHeight: '14px' }}
                            disabled={index === 0}
                            onClick={() => handleMoveImage(index, 'left')}
                            title="Mover hacia la izquierda"
                          >
                            ◀
                          </button>
                          <span className="text-muted" style={{ fontSize: '0.62rem' }}>#{index + 1}</span>
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm py-0 px-1"
                            style={{ fontSize: '0.65rem', height: '18px', lineHeight: '14px' }}
                            disabled={index === existingImages.length - 1}
                            onClick={() => handleMoveImage(index, 'right')}
                            title="Mover hacia la derecha"
                          >
                            ▶
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <label htmlFor="imageFile" className="form-label small text-muted mb-1">
            Añadir nueva imagen:
          </label>
          <input
            type="file"
            className="form-control"
            id="imageFile"
            accept="image/png, image/jpeg, image/webp, image/gif"
            onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
          />
          <small className="text-muted d-block mt-1">
            Puedes seleccionar una imagen para agregar a la galería y usar <strong>&quot;Hacer Portada&quot;</strong> para elegir cuál aparece en el catálogo.
          </small>
          {imageFile && (
            <div className="mt-2 p-2 border rounded bg-light d-flex align-items-center gap-3">
              <img
                src={URL.createObjectURL(imageFile)}
                alt="Previsualización nueva imagen"
                style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
              />
              <div className="flex-grow-1">
                <small className="d-block fw-bold text-success">Nueva imagen lista para subir:</small>
                <small className="text-muted d-block text-truncate" style={{ maxWidth: '200px' }}>{imageFile.name}</small>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setImageFile(null)}
              >
                Cancelar
              </button>
            </div>
          )}
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
          Actualizar Espacio
        </button>
        <Link href="/admin/spaces" className="btn btn-secondary ms-2">Cancelar</Link>
      </form>
    </div>
  );
}