'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/context/SessionContext';

interface EquipmentUnit {
  id?: string;
  unitNumber?: number;
  inventoryCode: string | null;
  resourceCode: string | null;
  status: string;
  notes: string | null;
}

interface Equipment {
  id: string;
  name: string;
  description: string | null;
  serialNumber: string | null;
  fixedAssetId: string | null;
  images: { url: string }[] | null;
  regulationsUrl: string | null;
  locationId: string | null;
  responsibleUsers?: { id: string }[];
  units: EquipmentUnit[];
}

export default function EditEquipmentPage() {
  const { user: sessionUser, loading: sessionLoading } = useSession();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [fixedAssetId, setFixedAssetId] = useState('');
  const [existingImages, setExistingImages] = useState<{ url: string }[]>([]);
  const [regulationsUrl, setRegulationsUrl] = useState('');
  const [users, setUsers] = useState<{ id: string; name: string; email: string; role: string }[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string; zone: string | null }[]>([]);
  const [responsibleUserIds, setResponsibleUserIds] = useState<string[]>([]);
  const [locationId, setLocationId] = useState('');
  const [units, setUnits] = useState<EquipmentUnit[]>([]);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [regulationsFile, setRegulationsFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  useEffect(() => {
    if (sessionLoading) return;

    const fetchDropdownData = async () => {
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
        console.error('Error fetching dropdown data:', err);
      }
    };

    const fetchEquipment = async () => {
      try {
        const res = await fetch(`/api/admin/equipment/${id}`);

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Error al cargar el equipo.');
        }

        const data: Equipment = await res.json();
        setName(data.name);
        setDescription(data.description || '');
        setSerialNumber(data.serialNumber || '');
        setFixedAssetId(data.fixedAssetId || '');
        setExistingImages(data.images || []);
        setRegulationsUrl(data.regulationsUrl || '');
        setLocationId(data.locationId || '');
        setResponsibleUserIds(data.responsibleUsers?.map(u => u.id) || []);
        
        if (data.units && Array.isArray(data.units)) {
          setUnits(data.units);
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
      fetchDropdownData();
      fetchEquipment();
    }
  }, [id, router, sessionLoading, sessionUser]);

  const handleUnitChange = (index: number, field: keyof EquipmentUnit, value: string) => {
    const updatedUnits = [...units];
    updatedUnits[index] = { ...updatedUnits[index], [field]: value };
    setUnits(updatedUnits);
  };

  const addUnit = () => {
    setUnits([
      ...units, 
      { 
        inventoryCode: serialNumber ? `${serialNumber}-${units.length + 1}` : '', 
        resourceCode: fixedAssetId ? `${fixedAssetId}-${units.length + 1}` : '', 
        status: 'AVAILABLE',
        notes: ''
      }
    ]);
  };

  const removeUnit = (index: number) => {
    if (units.length === 1) {
      alert("No puedes eliminar todas las unidades, debe quedar al menos 1.");
      return;
    }
    const updatedUnits = [...units];
    updatedUnits.splice(index, 1);
    setUnits(updatedUnits);
  };

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
      setError('El nombre del equipo es obligatorio.');
      return;
    }

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

      const res = await fetch(`/api/admin/equipment/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          serialNumber,
          fixedAssetId,
          responsibleUserIds,
          locationId: locationId || undefined,
          images: finalImages,
          regulationsUrl: currentRegulationsUrl || null,
          units: units,
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

  if (error && !name) { 
    return <div className="container mt-5 alert alert-danger">Error: {error}</div>;
  }

  return (
    <div className="container" style={{ paddingTop: '100px', paddingBottom: '100px' }}>
      <h2 style={{ color: '#0076A8' }}>Editar Equipo y Unidades</h2>
      <hr />
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-6">
            <div className="card mb-4 shadow-sm">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">Información General</h5>
              </div>
              <div className="card-body">
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
                  <label htmlFor="locationId" className="form-label">Ubicación Asignada</label>
                  <select
                    className="form-select"
                    id="locationId"
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                  >
                    <option value="">(Sin ubicación)</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} {loc.zone ? `(${loc.zone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label htmlFor="responsibleUsers" className="form-label">Encargados Principales</label>
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
                  <small className="text-muted">Mantén presionado Ctrl o Cmd para múltiples opciones.</small>
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label fw-bold mb-0">Imágenes del Equipo</label>
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
                  <label htmlFor="regulationsFile" className="form-label">Reglamento (PDF)</label>
                  <input
                    type="file"
                    className="form-control"
                    id="regulationsFile"
                    accept="application/pdf"
                    onChange={(e) => setRegulationsFile(e.target.files ? e.target.files[0] : null)}
                  />
                  {regulationsUrl && <small className="text-muted d-block mt-1">Reglamento actual: <a href={regulationsUrl} target="_blank" rel="noopener noreferrer">Ver PDF</a></small>}
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="card mb-4 shadow-sm">
              <div className="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Unidades Físicas (Status & Tags)</h5>
                <button type="button" className="btn btn-sm btn-light" onClick={addUnit}>+ Agregar Unidad</button>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{width: '20%'}}>No.</th>
                        <th style={{width: '35%'}}>Inv. Code</th>
                        <th style={{width: '35%'}}>Res. Code / Status</th>
                        <th style={{width: '10%'}}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {units.map((unit, index) => (
                        <tr key={index}>
                          <td className="align-middle text-center">
                            #{unit.unitNumber || (index + 1)}
                          </td>
                          <td className="align-middle">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Inv Code..."
                              value={unit.inventoryCode || ''}
                              onChange={(e) => handleUnitChange(index, 'inventoryCode', e.target.value)}
                            />
                          </td>
                          <td className="align-middle">
                            <input
                              type="text"
                              className="form-control form-control-sm mb-1"
                              placeholder="Resource Code..."
                              value={unit.resourceCode || ''}
                              onChange={(e) => handleUnitChange(index, 'resourceCode', e.target.value)}
                            />
                            <select
                              className="form-select form-select-sm"
                              value={unit.status}
                              onChange={(e) => handleUnitChange(index, 'status', e.target.value)}
                            >
                              <option value="AVAILABLE">Disponible</option>
                              <option value="IN_USE">En Uso</option>
                              <option value="MAINTENANCE">Mantenimiento</option>
                              <option value="LOST">Extraviado/Dañado</option>
                            </select>
                          </td>
                          <td className="align-middle text-center">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => removeUnit(index)}
                              title="Eliminar Unidad"
                            >
                              X
                            </button>
                          </td>
                        </tr>
                      ))}
                      {units.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center py-4 text-muted">
                            No hay unidades. Clic en &quot;Agregar Unidad&quot;.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <div className="d-grid gap-2">
              <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#0076A8', borderColor: '#0076A8' }}>
                Guardar Equipos y Unidades
              </button>
              <Link href="/admin/equipment" className="btn btn-secondary">
                Cancelar
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}