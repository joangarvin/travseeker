import { useEffect, useState, type CSSProperties } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Calendar,
  CalendarRange,
  CheckCircle2,
  Edit3,
  FolderHeart,
  LayoutDashboard,
  LayoutGrid,
  MapPin,
  Route,
  Share2,
  Trash2,
  Users,
} from 'lucide-react';
import { Shell } from '../../components/layout';
import { Button, Empty, Loader, MediaImage, Notice } from '../../components/ui';
import { useAuth } from '../../contexts';
import { api } from '../../services/api';
import type { CollectionDetail, ItineraryDay } from '../../types';
import { imageUrl } from '../../utils';
import { CollectionBudgetSummary } from '../../components/BudgetEstimator';
import { ItineraryBuilder } from '../../components/ItineraryBuilder';
import {
  TripSettingsModal,
  type TripSettingsInput,
} from '../../features/collections/components/TripSettingsModal';
import { ShareTripModal } from '../../features/collections/components/ShareTripModal';

type CollectionPageProps = {
  publicView?: boolean;
};

export default function CollectionPage({ publicView = false }: CollectionPageProps) {
  const { id, shareToken } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionPending, setActionPending] = useState(false);
  const [view, setView] = useState<'overview' | 'destinations' | 'itinerary'>(
    publicView ? 'itinerary' : 'overview',
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
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

  const shareCollection = async (regenerate = false) => {
    if (!token || !id) throw new Error('No se pudo identificar el viaje');
    setActionPending(true);
    try {
      const result = await api<{ shareToken: string }>(
        `/colecciones/${id}/share`,
        { method: 'POST', body: JSON.stringify({ regenerate }) },
        token,
      );
      setCollection((current) =>
        current ? { ...current, visibility: 'shared', shareToken: result.shareToken } : current,
      );
      return result.shareToken;
    } catch (cause) {
      throw cause instanceof Error ? cause : new Error('No se pudo compartir el viaje');
    } finally {
      setActionPending(false);
    }
  };

  const stopSharing = async () => {
    if (!token || !id) throw new Error('No se pudo identificar el viaje');
    setActionPending(true);
    try {
      await api(`/colecciones/${id}/share`, { method: 'DELETE' }, token);
      setCollection((current) =>
        current ? { ...current, visibility: 'private', shareToken: null } : current,
      );
    } finally {
      setActionPending(false);
    }
  };

  const addMember = async (email: string, role: 'editor' | 'viewer') => {
    if (!token || !id) throw new Error('No se pudo identificar el viaje');
    const member = await api<NonNullable<CollectionDetail['members']>[number]>(
      `/colecciones/${id}/members`,
      { method: 'POST', body: JSON.stringify({ email, role }) },
      token,
    );
    setCollection((current) =>
      current
        ? {
            ...current,
            members: [
              ...(current.members || []).filter((item) => item.user.id !== member.user.id),
              member,
            ],
          }
        : current,
    );
  };

  const updateMember = async (memberId: string, role: 'editor' | 'viewer') => {
    if (!token || !id) throw new Error('No se pudo identificar el viaje');
    const member = await api<NonNullable<CollectionDetail['members']>[number]>(
      `/colecciones/${id}/members/${memberId}`,
      { method: 'PATCH', body: JSON.stringify({ role }) },
      token,
    );
    setCollection((current) =>
      current
        ? {
            ...current,
            members: (current.members || []).map((item) => (item.id === memberId ? member : item)),
          }
        : current,
    );
  };

  const removeMember = async (memberId: string) => {
    if (!token || !id) throw new Error('No se pudo identificar el viaje');
    await api(`/colecciones/${id}/members/${memberId}`, { method: 'DELETE' }, token);
    setCollection((current) =>
      current
        ? { ...current, members: (current.members || []).filter((item) => item.id !== memberId) }
        : current,
    );
  };

  const saveSettings = async (input: TripSettingsInput) => {
    if (!token || !id) throw new Error('No se pudo identificar el viaje');
    const updated = await api<CollectionDetail>(
      `/colecciones/${id}`,
      { method: 'PATCH', body: JSON.stringify(input) },
      token,
    );
    setCollection((current) =>
      current
        ? {
            ...current,
            ...updated,
            items: updated.items || current.items,
            members: updated.members || current.members,
          }
        : current,
    );
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

  const saveItinerary = async (itinerary: ItineraryDay[], endDate?: string) => {
    if (!token || !id) return;
    const updated = await api<CollectionDetail>(
      `/colecciones/${id}`,
      { method: 'PATCH', body: JSON.stringify({ itinerary, ...(endDate ? { endDate } : {}) }) },
      token,
    );
    setCollection((current) =>
      current
        ? {
            ...current,
            itinerary: updated.itinerary || itinerary,
            endDate: updated.endDate ?? current.endDate,
          }
        : current,
    );
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
      <header className="trip-workspace-header">
        <div className="trip-workspace-header__title">
          <p className="kicker">{visibilityLabel}</p>
          <h1>{collection.nombre}</h1>
          <p>{collection.descripcion || 'Un viaje en construcción.'}</p>
        </div>
        {isOwner && (
          <div className="heading-actions no-print">
            <Button variant="secondary" onClick={() => setSettingsOpen(true)}>
              <Edit3 /> Editar viaje
            </Button>
            <Button variant="secondary" disabled={actionPending} onClick={() => setShareOpen(true)}>
              <Share2 /> Compartir
            </Button>
          </div>
        )}
        {error && (
          <Notice tone="error">
            {error}{' '}
            <button type="button" onClick={() => void loadCollection()}>
              Reintentar
            </button>
          </Notice>
        )}
        <div className="trip-workspace-header__facts">
          <span>
            <Calendar /> {formatTripDates(collection.startDate, collection.endDate)}
          </span>
          <span>
            <Users /> {collection.travelerCount || 2} viajeros
          </span>
          <span>
            <MapPin /> {collection.items.length} destinos
          </span>
          <span>
            <Users /> {(collection.members?.length || 0) + 1} participantes
          </span>
        </div>
        <ParticipantAvatars collection={collection} />
      </header>

      <div
        className="collection-view-switch collection-view-switch--three no-print"
        role="tablist"
        aria-label="Vista del viaje"
      >
        <button
          type="button"
          role="tab"
          aria-selected={view === 'overview'}
          onClick={() => setView('overview')}
        >
          <LayoutDashboard /> Resumen
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'destinations'}
          onClick={() => setView('destinations')}
        >
          <LayoutGrid /> Destinos
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

      {view === 'overview' ? (
        <TripOverview
          collection={collection}
          canEdit={canEdit}
          onOpenSettings={() => setSettingsOpen(true)}
          onChangeView={setView}
        />
      ) : view === 'destinations' ? (
        <>
          <CollectionBudgetSummary collection={collection} />
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

      {settingsOpen && (
        <TripSettingsModal
          collection={collection}
          onClose={() => setSettingsOpen(false)}
          onSave={saveSettings}
        />
      )}
      {shareOpen && (
        <ShareTripModal
          shareToken={collection.shareToken}
          visibility={collection.visibility}
          owner={collection.owner}
          members={collection.members || []}
          onClose={() => setShareOpen(false)}
          onActivate={shareCollection}
          onDeactivate={stopSharing}
          onAddMember={addMember}
          onUpdateMember={updateMember}
          onRemoveMember={removeMember}
        />
      )}
      {isOwner && view === 'overview' && (
        <section className="trip-danger-zone no-print">
          <div>
            <strong>Eliminar viaje</strong>
            <p>Se borrarán el itinerario, los destinos guardados y el enlace público.</p>
          </div>
          <Button variant="danger" disabled={actionPending} onClick={() => void removeCollection()}>
            <Trash2 /> Eliminar
          </Button>
        </section>
      )}
    </Shell>
  );
}

function ParticipantAvatars({ collection }: { collection: CollectionDetail }) {
  const people = [collection.owner, ...(collection.members || []).map((member) => member.user)]
    .filter(Boolean)
    .slice(0, 4) as Array<{ id: string; nombre?: string | null; avatarUrl?: string | null }>;
  const total = (collection.members?.length || 0) + 1;
  return (
    <div className="trip-participants" aria-label={`${total} participantes`}>
      <div className="trip-participants__avatars" aria-hidden="true">
        {people.map((person) =>
          person.avatarUrl ? (
            <img key={person.id} className="trip-avatar" src={imageUrl(person.avatarUrl)} alt="" />
          ) : (
            <span key={person.id} className="trip-avatar trip-avatar--initials">
              {(person.nombre || '?').slice(0, 2).toUpperCase()}
            </span>
          ),
        )}
        {total > 4 && <span className="trip-avatar trip-avatar--initials">+{total - 4}</span>}
      </div>
      <span>
        {total === 1 ? 'Solo tú tienes acceso' : `${total} personas organizando este viaje`}
      </span>
    </div>
  );
}

function formatTripDates(startDate?: string | null, endDate?: string | null) {
  if (!startDate) return 'Fechas abiertas';
  const formatter = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const start = formatter.format(new Date(`${startDate.slice(0, 10)}T00:00:00.000Z`));
  if (!endDate) return `Desde el ${start}`;
  const end = formatter.format(new Date(`${endDate.slice(0, 10)}T00:00:00.000Z`));
  return `${start} — ${end}`;
}

function TripOverview({
  collection,
  canEdit,
  onOpenSettings,
  onChangeView,
}: {
  collection: CollectionDetail;
  canEdit: boolean;
  onOpenSettings: () => void;
  onChangeView: (view: 'overview' | 'destinations' | 'itinerary') => void;
}) {
  const hasDates = Boolean(collection.startDate);
  const hasDestinations = collection.items.length > 0;
  const hasItinerary = collection.itinerary.length > 0;
  const isShared = collection.visibility === 'shared';
  const checks = [hasDates, hasDestinations, hasItinerary, isShared];
  const progress = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  const nextAction = !hasDates
    ? 'Añade las fechas'
    : !hasDestinations
      ? 'Guarda destinos'
      : !hasItinerary
        ? 'Confirma el itinerario'
        : !isShared
          ? 'Comparte el viaje'
          : 'Viaje preparado';

  return (
    <div className="trip-overview">
      <section className="trip-overview__hero">
        <div>
          <p className="kicker">Estado del viaje</p>
          <h2>{nextAction}</h2>
          <p>
            {progress === 100
              ? 'La ruta está lista para viajar y compartir.'
              : 'Completa el siguiente paso y mantén todo el plan en un solo lugar.'}
          </p>
          {canEdit && !hasDates && (
            <Button onClick={onOpenSettings}>
              <CalendarRange /> Elegir fechas
            </Button>
          )}
          {canEdit && hasDates && !hasItinerary && (
            <Button onClick={() => onChangeView('itinerary')}>
              <Route /> Preparar itinerario
            </Button>
          )}
        </div>
        <div
          className="trip-progress-orbit"
          style={{ '--trip-progress': `${progress * 3.6}deg` } as CSSProperties}
          aria-label={`${progress}% del viaje preparado`}
        >
          <span>
            <b>{progress}%</b> preparado
          </span>
        </div>
      </section>

      <ol className="trip-readiness" aria-label="Progreso de preparación">
        {[
          {
            complete: hasDates,
            label: 'Fechas',
            value: hasDates
              ? formatTripDates(collection.startDate, collection.endDate)
              : 'Pendientes',
          },
          {
            complete: hasDestinations,
            label: 'Destinos',
            value: hasDestinations ? `${collection.items.length} guardados` : 'Añade el primero',
          },
          {
            complete: hasItinerary,
            label: 'Itinerario',
            value: hasItinerary ? `${collection.itinerary.length} días guardados` : 'Sin confirmar',
          },
          { complete: isShared, label: 'Compartir', value: isShared ? 'Enlace activo' : 'Solo tú' },
        ].map(({ complete, label, value }, index) => (
          <li key={label} className={complete ? 'is-complete' : ''}>
            <span>{complete ? <CheckCircle2 /> : index + 1}</span>
            <div>
              <strong>{label}</strong>
              <small>{value}</small>
            </div>
          </li>
        ))}
      </ol>

      <section className="trip-overview__grid">
        <article className="trip-overview-card trip-overview-card--route">
          <p className="kicker">Tu ruta</p>
          <h3>
            {collection.items.length
              ? collection.items
                  .map((item) => item.destino.nombre)
                  .slice(0, 3)
                  .join(' → ')
              : 'Todavía sin paradas'}
          </h3>
          <p>
            {collection.items.length > 3
              ? `Y ${collection.items.length - 3} destinos más.`
              : 'Ordena las paradas y decide dónde pasar cada noche.'}
          </p>
          <button type="button" onClick={() => onChangeView('itinerary')}>
            Abrir día a día <Route />
          </button>
        </article>
        <article className="trip-overview-card">
          <p className="kicker">El grupo</p>
          <h3>{collection.travelerCount || 2} viajeros</h3>
          <p>
            {collection.members?.length
              ? `${collection.members.length} colaboradores con acceso al plan.`
              : 'Todavía no has añadido colaboradores.'}
          </p>
          {canEdit && (
            <button type="button" onClick={onOpenSettings}>
              Editar viajeros <Users />
            </button>
          )}
        </article>
      </section>
      {hasDestinations && <CollectionBudgetSummary collection={collection} />}
    </div>
  );
}
