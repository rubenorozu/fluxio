'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useSession } from '@/context/SessionContext';
import { useTenant } from '@/context/TenantContext';
import styles from './ResourceCard.module.css';

interface Inscription {
  workshopId: string;
  status: string;
}

interface Image {
  id: string;
  url: string;
}

interface Resource {
  id: string;
  name: string;
  description?: string | null;
  images: Image[];
  type: 'space' | 'equipment' | 'workshop';
  capacity?: number;
  inscriptionsStartDate?: string | null;
  inscriptionsOpen?: boolean;
  inscriptionStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  reservationLeadTime?: number | null;
  isFixedToSpace?: boolean; // NEW: Add isFixedToSpace to Resource interface
  requiresSpaceReservationWithEquipment?: boolean; // NEW: Add this field
  _count?: {
    inscriptions?: number;
    equipments?: number;
  };
}

interface Props {
  resource: Resource;
  type: 'space' | 'equipment' | 'workshop';
  displayMode?: 'full' | 'detailsOnly' | 'none';
  onInscriptionSuccess?: () => void;
  onConfigureSpace?: (spaceId: string) => void; // NEW: Callback for configuring a space
}

const ResourceCard = ({ resource, type, displayMode = 'full', onInscriptionSuccess, onConfigureSpace }: Props) => {

  const { addToCart } = useCart();
  const { user } = useSession();
  const tenant = useTenant();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [inscriptionStatus, setInscriptionStatus] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(false);


  useEffect(() => {

    if (type !== 'workshop' || !user) {

      setInscriptionStatus(null);
      return;
    }

    const fetchInscriptionStatus = async () => {

      try {
        const res = await fetch(`/api/me/inscriptions`);
        if (res.ok) {
          const inscriptions = await res.json();

          const currentInscription = inscriptions.find((i: Inscription) => i.workshopId === resource.id);

          if (currentInscription) {
            setInscriptionStatus(currentInscription.status);

          } else {
            setInscriptionStatus(null);

          }
        } else {
          console.error(`ResourceCard fetchInscriptionStatus for ${resource.name} - Failed to fetch inscriptions:`, res.status, res.statusText);
          setInscriptionStatus(null);
        }
      } catch (error) {
        console.error(`ResourceCard fetchInscriptionStatus for ${resource.name} - Error fetching inscription status:`, error);
        setInscriptionStatus(null);
      }
    };

    fetchInscriptionStatus();
  }, [user, resource.id, type, refresh]);

  const handleInscribe = async (isExtraordinary = false) => {
    setIsSubscribing(true);
    try {
      const res = await fetch(`/api/workshops/inscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workshopId: resource.id, isExtraordinary }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('¡Solicitud de inscripción enviada!');
        if (onInscriptionSuccess) {
          onInscriptionSuccess();
        }
        setRefresh(prev => !prev);
      } else {
        if (data.limitReached) {
          if (window.confirm(data.error + '\n\n¿Deseas enviar una solicitud de inscripción extraordinaria?')) {
            handleInscribe(true);
          }
        } else {
          alert(data.error || 'No se pudo realizar la inscripción.');
        }
        if (res.status === 409) {
          setRefresh(prev => !prev);
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(`Error: ${error.message}`);
      } else {
        alert('An unknown error occurred');
      }
    } finally {
      setIsSubscribing(false);
    }
  };

  const isAvailable =
    resource.type !== 'workshop' ||
    !resource.inscriptionsStartDate ||
    new Date(resource.inscriptionsStartDate) <= new Date();

  const isFull =
    resource.type === 'workshop' &&
    resource.capacity != null &&
    resource._count != null &&
    resource._count.inscriptions != null &&
    resource.capacity > 0 &&
    resource._count.inscriptions >= resource.capacity;

  const areInscriptionsOpen = resource.type !== 'workshop' || (resource.inscriptionsOpen ?? true);

  const imageUrlToDisplay =
    resource.images && resource.images.length > 0 ? resource.images[0].url : '/placeholder.svg';

  const resourceUrl = (type === 'space' && resource.requiresSpaceReservationWithEquipment && resource._count?.equipments && resource._count.equipments > 0)
    ? `/recursos/espacios/${resource.id}`
    : `/recursos/${resource.id}?type=${type}`;

  return (
    <div className="card h-100 shadow-sm">
      <div style={{ position: 'relative', width: '100%', height: '150px' }}>
        <Image
          src={imageUrlToDisplay}
          alt={resource.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="card-img-top"
          style={{ objectFit: 'cover' }}
        />
      </div>
      <div className="card-body d-flex flex-column">
        <h5 className="card-title">{resource.name}</h5>
        <p className="card-text text-muted flex-grow-1 text-truncate-multiline text-justify">
          {resource.description}
        </p>
        {displayMode !== 'none' && (
          <div className="mt-auto w-100">
            {displayMode === 'detailsOnly' && (
              <Link
                href={resourceUrl}
                className="btn btn-primary w-100"
              >
                Ver Detalles
              </Link>
            )}
            {displayMode === 'full' && (
              <div className="d-grid gap-2 d-md-flex w-100">
                <Link
                  href={resourceUrl}
                  className={`btn ${styles.customPrimaryButton} flex-fill`}
                >
                  Ver más
                </Link>
                {type === 'workshop' ? (
                  <button
                    className={`btn text-white ${!isAvailable ||
                      isFull ||
                      !areInscriptionsOpen ||
                      isSubscribing ||
                      inscriptionStatus === 'PENDING' ||
                      inscriptionStatus === 'APPROVED'
                      ? 'disabled'
                      : ''
                      }`}
                    style={{
                      whiteSpace: 'nowrap',
                      backgroundColor: inscriptionStatus === 'APPROVED'
                        ? (tenant?.config?.inscriptionApprovedColor || '#28A745')
                        : inscriptionStatus === 'PENDING'
                          ? (tenant?.config?.inscriptionPendingColor || '#ff9500')
                          : (tenant?.config?.inscriptionDefaultColor || '#ff9500'),
                      border: 'none'
                    }}
                    onClick={() => handleInscribe()}
                    disabled={
                      !isAvailable ||
                      isFull ||
                      !areInscriptionsOpen ||
                      isSubscribing ||
                      inscriptionStatus === 'PENDING' ||
                      inscriptionStatus === 'APPROVED'
                    }
                    title={
                      inscriptionStatus === 'PENDING'
                        ? 'Inscripción pendiente de aprobación'
                        : inscriptionStatus === 'APPROVED'
                          ? 'Ya estás inscrito en este taller'
                          : !isAvailable && resource.inscriptionsStartDate
                            ? `Disponible a partir del ${new Date(
                              resource.inscriptionsStartDate
                            ).toLocaleDateString()}`
                            : isFull
                              ? 'Taller lleno'
                              : !areInscriptionsOpen
                                ? 'Inscripciones cerradas'
                                : 'Inscribirme al taller'
                    }
                  >
                    {inscriptionStatus === 'PENDING'
                      ? 'Pendiente'
                      : inscriptionStatus === 'APPROVED'
                        ? 'Inscrito'
                        : isSubscribing
                          ? 'Inscribiendo...'
                          : !isAvailable
                            ? 'Próximamente'
                            : isFull
                              ? 'Taller Lleno'
                              : !areInscriptionsOpen
                                ? 'Cerrado'
                                : 'Inscribirme'}
                  </button>
                ) : type === 'space' && resource._count?.equipments && resource._count.equipments > 0 ? (
                  <button
                    className={`btn ${styles.customActionButton}`}
                    onClick={() => onConfigureSpace && onConfigureSpace(resource.id)}
                  >
                    Agregar
                  </button>
                ) : (
                  <button
                    className={`btn ${styles.customActionButton}`}
                    onClick={() => addToCart({ ...resource, type, reservationLeadTime: resource.reservationLeadTime, isFixedToSpace: resource.isFixedToSpace })}
                  >
                    Agregar
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div >
  );
};

export default ResourceCard;