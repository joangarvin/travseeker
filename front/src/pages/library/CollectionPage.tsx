import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Calendar, FolderHeart, LayoutGrid, Route, Share2, Trash2, Users } from 'lucide-react';
import { PageHeading, Shell } from '../../components/layout';
import { Button, Empty, Loader, MediaImage, Notice } from '../../components/ui';
import { useAuth } from '../../contexts';
import { api } from '../../services/api';
import type { CollectionDetail, ItineraryDay } from '../../types';
import { imageUrl } from '../../utils';
import { CollectionBudgetSummary } from '../../components/BudgetEstimator';
import { ItineraryBuilder } from '../../components/ItineraryBuilder';

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
  const [error, setError] = useState('');
  const [actionPending, setActionPending] = useState(false);
  const [view, setView] = useState<'destinations' | 'itinerary'>('itinerary');
  const endpoint = publicView ? `/colecciones/public/${shareToken}` : `/colecciones/${id}`;

  const loadCollection = async () => {
    try {
      setError('');
      setCollection(await api<CollectionDetail>(endpoint, {}, publicView ? null : token));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo abrir el viaje');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCollection();
  }, [endpoint, token]);

  const removeDestination = async (destinationId: string) => {
    if (!token || !id) return;
    setActionPending(true);
    try {
      await api(`/colecciones/${id}/items/${destinationId}`, { method: 'DELETE' }, token);
      await loadCollection();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo quitar el destino');
    } finally {
      setActionPending(false);
    }
  };

  const shareCollection = async () => {
    if (!token || !id) return;
    setActionPending(true);
    try {
      const result = await api<{ shareToken: string }>(
        `/colecciones/${id}/share`,
        { method: 'POST' },
        token,
      );
      await navigator.clipboard.writeText(`${location.origin}/viaje/${result.shareToken}`);
      setMessage('Enlace copiado');
      await loadCollection();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo compartir el viaje');
    } finally {
      setActionPending(false);
    }
  };

  const removeCollection = async () => {
    const confirmed = confirm('¿Eliminar este viaje? Esta acción no se puede deshacer.');
    if (!token || !id || !confirmed) return;

    setActionPending(true);
    try {
      await api(`/colecciones/${id}`, { method: 'DELETE' }, token);
      navigate('/colecciones');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo eliminar el viaje');
      setActionPending(false);
    }
  };

  const saveItinerary = async (itinerary: ItineraryDay[]) => {
    if (!token || !id) return;
    await api(
      `/colecciones/${id}`,
      { method: 'PATCH', body: JSON.stringify({ itinerary }) },
      token,
    );
    setCollection((current) => (current ? { ...current, itinerary } : current));
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
            <Notice tone="error">{error || 'Este viaje no está disponible.'}</Notice>
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
              <Button
                variant="secondary"
                loading={actionPending}
                onClick={() => void shareCollection()}
              >
                <Share2 /> Compartir
              </Button>
              <Button
                variant="danger"
                disabled={actionPending}
                onClick={() => void removeCollection()}
              >
                <Trash2 /> Eliminar
              </Button>
            </div>
          ) : undefined
        }
      >
        <p>{collection.descripcion || 'Un viaje en construcción.'}</p>
        {error && <Notice tone="error">{error}</Notice>}
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

      <div className="collection-view-switch no-print" role="tablist" aria-label="Vista del viaje">
        <button
          type="button"
          role="tab"
          aria-selected={view === 'destinations'}
          onClick={() => setView('destinations')}
        >
          <LayoutGrid /> Fichas de destino
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'itinerary'}
          onClick={() => setView('itinerary')}
        >
          <Route /> Itinerario día a día
        </button>
      </div>

      {view === 'destinations' ? (
        <>
          <CollectionBudgetSummary destinations={collection.items.map((item) => item.destino)} />
          <section className="itinerary collection-destination-list">
            {collection.items.length ? (
              collection.items.map((item, index) => (
                <article key={item.id}>
                  <span className="itinerary__number">{String(index + 1).padStart(2, '0')}</span>
                  <MediaImage src={imageUrl(item.destino.imagen)} alt="" loading="lazy" />
                  <div>
                    <small>{item.status}</small>
                    <h2>
                      <Link to={`/destino/${item.destino.id}`}>{item.destino.nombre}</Link>
                    </h2>
                    <p>{item.notas || 'Sin notas todavía.'}</p>
                  </div>
                  {canEdit && (
                    <button
                      type="button"
                      disabled={actionPending}
                      onClick={() => void removeDestination(item.destino.id)}
                      aria-label={`Quitar ${item.destino.nombre}`}
                    >
                      <Trash2 />
                    </button>
                  )}
                </article>
              ))
            ) : (
              <Empty icon={<FolderHeart />} title="El viaje está vacío">
                Añade destinos desde sus fichas para empezar a darle forma.
              </Empty>
            )}
          </section>
        </>
      ) : (
        <ItineraryBuilder
          collection={collection}
          canEdit={canEdit}
          onSave={canEdit ? saveItinerary : undefined}
        />
      )}
    </Shell>
  );
}
