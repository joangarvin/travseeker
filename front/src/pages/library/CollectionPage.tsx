import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Calendar, FolderHeart, Share2, Trash2, Users } from 'lucide-react';
import { PageHeading, Shell } from '../../components/layout';
import { Button, Empty, Loader, MediaImage, Notice } from '../../components/ui';
import { useAuth } from '../../contexts';
import { api } from '../../services/api';
import type { CollectionDetail } from '../../types';
import { imageUrl } from '../../utils';

type CollectionPageProps = {
  publicView?: boolean;
};

export default function CollectionPage({ publicView = false }: CollectionPageProps) {
  const { id, shareToken } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const endpoint = publicView ? `/colecciones/public/${shareToken}` : `/colecciones/${id}`;

  const loadCollection = async () => {
    try {
      setCollection(await api<CollectionDetail>(endpoint, {}, publicView ? null : token));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCollection();
  }, [endpoint, token]);

  const removeDestination = async (destinationId: string) => {
    if (!token || !id) return;

    await api(`/colecciones/${id}/items/${destinationId}`, { method: 'DELETE' }, token);
    await loadCollection();
  };

  const shareCollection = async () => {
    if (!token || !id) return;

    const result = await api<{ shareToken: string }>(
      `/colecciones/${id}/share`,
      { method: 'POST' },
      token,
    );
    await navigator.clipboard.writeText(`${location.origin}/viaje/${result.shareToken}`);
    setMessage('Enlace copiado');
    await loadCollection();
  };

  const removeCollection = async () => {
    const confirmed = confirm('¿Eliminar este viaje? Esta acción no se puede deshacer.');
    if (!token || !id || !confirmed) return;

    await api(`/colecciones/${id}`, { method: 'DELETE' }, token);
    navigate('/colecciones');
  };

  if (isLoading) {
    return (
      <Shell>
        <Loader label="Abriendo el viaje" />
      </Shell>
    );
  }

  if (!collection) {
    return (
      <Shell>
        <section className="status-page">
          <div>
            <h1>Viaje no disponible</h1>
            <Notice tone="error">Este viaje no está disponible.</Notice>
          </div>
        </section>
      </Shell>
    );
  }

  const visibilityLabel = publicView
    ? 'Viaje compartido'
    : collection.visibility === 'shared'
      ? 'Viaje con enlace activo'
      : 'Viaje privado';
  const canEdit = !publicView && collection.role !== 'viewer';
  const isOwner = !publicView && collection.role === 'owner';

  return (
    <Shell>
      <PageHeading
        kicker={visibilityLabel}
        title={collection.nombre}
        action={
          isOwner ? (
            <div className="heading-actions">
              <Button variant="secondary" onClick={() => void shareCollection()}>
                <Share2 /> Compartir
              </Button>
              <Button variant="danger" onClick={() => void removeCollection()}>
                <Trash2 /> Eliminar
              </Button>
            </div>
          ) : undefined
        }
      >
        <p>{collection.descripcion || 'Un viaje en construcción.'}</p>
        {message && <Notice tone="success">{message}</Notice>}
      </PageHeading>

      <section className="trip-meta">
        <span>
          <Calendar />{' '}
          {collection.startDate
            ? new Date(collection.startDate).toLocaleDateString('es')
            : 'Fechas abiertas'}
        </span>
        <span>
          <Users /> {collection.members?.length || 0} colaboradores
        </span>
        <span>{collection.items.length} destinos</span>
      </section>

      <section className="itinerary">
        {collection.items.length ? (
          collection.items.map((item, index) => (
            <article key={item.id}>
              <span className="itinerary__number">{String(index + 1).padStart(2, '0')}</span>
              <MediaImage src={imageUrl(item.destino.imagen)} alt="" loading="lazy" />
              <div>
                <small>
                  {item.dayIndex ? `Día ${item.dayIndex}` : 'Sin día asignado'} · {item.status}
                </small>
                <h2>
                  <Link to={`/destino/${item.destino.id}`}>{item.destino.nombre}</Link>
                </h2>
                <p>{item.notas || 'Sin notas todavía.'}</p>
              </div>
              {canEdit && (
                <button
                  onClick={() => void removeDestination(item.destino.id)}
                  aria-label={`Quitar ${item.destino.nombre}`}
                >
                  <Trash2 />
                </button>
              )}
            </article>
          ))
        ) : (
          <Empty icon={<FolderHeart />} title="El itinerario está vacío">
            Añade destinos desde sus fichas para empezar a darle forma.
          </Empty>
        )}
      </section>
    </Shell>
  );
}
