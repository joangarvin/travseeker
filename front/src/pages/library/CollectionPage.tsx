import { t, intlLocale } from '../../i18n';
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
  const [pendingDestinationId, setPendingDestinationId] = useState<string | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [view, setView] = useState<'overview' | 'destinations' | 'itinerary'>(
    publicView ? 'itinerary' : 'overview',
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const endpoint = publicView ? `/colecciones/public/${shareToken}` : `/colecciones/${id}`;

  const loadCollection = async () => {
    setIsLoading(true);
    try {
      setError('');
      setCollection(await api<CollectionDetail>(endpoint, {}, publicView ? null : token));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('No se pudo abrir el viaje'));
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
    setPendingDestinationId(destinationId);
    try {
      await api(`/colecciones/${id}/items/${destinationId}`, { method: 'DELETE' }, token);
      await loadCollection();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('No se pudo quitar el destino'));
    } finally {
      setActionPending(false);
      setPendingDestinationId(null);
    }
  };

  const shareCollection = async (regenerate = false) => {
    if (!token || !id) throw new Error(t('No se pudo identificar el viaje'));
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
      throw cause instanceof Error ? cause : new Error(t('No se pudo compartir el viaje'));
    } finally {
      setActionPending(false);
    }
  };

  const stopSharing = async () => {
    if (!token || !id) throw new Error(t('No se pudo identificar el viaje'));
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
    if (!token || !id) throw new Error(t('No se pudo identificar el viaje'));
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
    if (!token || !id) throw new Error(t('No se pudo identificar el viaje'));
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
    if (!token || !id) throw new Error(t('No se pudo identificar el viaje'));
    await api(`/colecciones/${id}/members/${memberId}`, { method: 'DELETE' }, token);
    setCollection((current) =>
      current
        ? { ...current, members: (current.members || []).filter((item) => item.id !== memberId) }
        : current,
    );
  };

  const saveSettings = async (input: TripSettingsInput) => {
    if (!token || !id) throw new Error(t('No se pudo identificar el viaje'));
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
    const confirmed = confirm(t('¿Eliminar este viaje? Esta acción no se puede deshacer.'));
    if (!token || !id || !confirmed) return;

    setActionPending(true);
    setDeletePending(true);
    try {
      await api(`/colecciones/${id}`, { method: 'DELETE' }, token);
      navigate('/colecciones');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('No se pudo eliminar el viaje'));
      setActionPending(false);
      setDeletePending(false);
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
        <Loader label={t('Abriendo el viaje')} />
      </Shell>
    );
  }

  if (!collection) {
    return (
      <Shell>
        <section className="status-page">
          <div>
            <h1>{t('Viaje no disponible')}</h1>
            <Notice tone="error">{error || t('Este viaje no está disponible.')}</Notice>
          </div>
        </section>
      </Shell>
    );
  }

  const visibilityLabel = publicView
    ? t('Viaje compartido')
    : collection.visibility === 'shared'
      ? t('Viaje con enlace activo')
      : t('Viaje privado');
  const canEdit = !publicView && collection.role !== 'viewer';
  const isOwner = !publicView && collection.role === 'owner';

  return (
    <Shell>
      <header className="trip-workspace-header">
        <div className="trip-workspace-header__title">
          <p className="kicker">{visibilityLabel}</p>
          <h1>{collection.nombre}</h1>
          <p>{collection.descripcion || t('Un viaje en construcción.')}</p>
        </div>
        {isOwner && (
          <div className="heading-actions no-print">
            <Button variant="secondary" onClick={() => setSettingsOpen(true)}>
              <Edit3 /> {t('Editar viaje')}
            </Button>
            <Button variant="secondary" disabled={actionPending} onClick={() => setShareOpen(true)}>
              <Share2 /> {t('Compartir')}
            </Button>
          </div>
        )}
        {error && (
          <Notice tone="error">
            {error}{' '}
            <button type="button" onClick={() => void loadCollection()}>
              {t('Reintentar')}
            </button>
          </Notice>
        )}
        <div className="trip-workspace-header__facts">
          <span>
            <Calendar /> {formatTripDates(collection.startDate, collection.endDate)}
          </span>
          <span>
            <Users /> {collection.travelerCount || 2} {t('viajeros')}
          </span>
          <span>
            <MapPin /> {collection.items.length} {t('destinos')}
          </span>
          <span>
            <Users /> {(collection.members?.length || 0) + 1} {t('participantes')}
          </span>
        </div>
        <ParticipantAvatars collection={collection} />
      </header>

      <div
        className="collection-view-switch collection-view-switch--three no-print"
        role="tablist"
        aria-label={t('Vista del viaje')}
      >
        <button
          type="button"
          role="tab"
          aria-selected={view === 'overview'}
          onClick={() => setView('overview')}
        >
          <LayoutDashboard /> {t('Resumen')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'destinations'}
          onClick={() => setView('destinations')}
        >
          <LayoutGrid /> {t('Destinos')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'itinerary'}
          onClick={() => setView('itinerary')}
        >
          <Route /> {t('Itinerario día a día')}
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
                    <p>{item.notas || t('Sin notas todavía.')}</p>
                  </div>
                  {canEdit && (
                    <button
                      type="button"
                      disabled={actionPending}
                      aria-busy={pendingDestinationId === item.destino.id || undefined}
                      onClick={() => void removeDestination(item.destino.id)}
                      aria-label={t('Quitar {0}', { 0: item.destino.nombre })}
                    >
                      <Trash2 />
                    </button>
                  )}
                </article>
              ))
            ) : (
              <Empty icon={<FolderHeart />} title={t('El viaje está vacío')}>
                {t('Añade destinos desde sus fichas para empezar a darle forma.')}
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
            <strong>{t('Eliminar viaje')}</strong>
            <p>{t('Se borrarán el itinerario, los destinos guardados y el enlace público.')}</p>
          </div>
          <Button
            variant="danger"
            loading={deletePending}
            disabled={actionPending}
            loadingLabel="Eliminando…"
            onClick={() => void removeCollection()}
          >
            <Trash2 /> {t('Eliminar')}
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
    <div className="trip-participants" aria-label={t('{0} participantes', { 0: total })}>
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
        {total === 1
          ? t('Solo tú tienes acceso')
          : t('{0} personas organizando este viaje', { 0: total })}
      </span>
    </div>
  );
}

function formatTripDates(startDate?: string | null, endDate?: string | null) {
  if (!startDate) return t('Fechas abiertas');
  const formatter = new Intl.DateTimeFormat(intlLocale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const start = formatter.format(new Date(`${startDate.slice(0, 10)}T00:00:00.000Z`));
  if (!endDate) return t('Desde el {0}', { 0: start });
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
    ? t('Añade las fechas')
    : !hasDestinations
      ? t('Guarda destinos')
      : !hasItinerary
        ? t('Confirma el itinerario')
        : !isShared
          ? t('Comparte el viaje')
          : t('Viaje preparado');

  return (
    <div className="trip-overview">
      <section className="trip-overview__hero">
        <div>
          <p className="kicker">{t('Estado del viaje')}</p>
          <h2>{nextAction}</h2>
          <p>
            {progress === 100
              ? t('La ruta está lista para viajar y compartir.')
              : t('Completa el siguiente paso y mantén todo el plan en un solo lugar.')}
          </p>
          {canEdit && !hasDates && (
            <Button onClick={onOpenSettings}>
              <CalendarRange /> {t('Elegir fechas')}
            </Button>
          )}
          {canEdit && hasDates && !hasItinerary && (
            <Button onClick={() => onChangeView('itinerary')}>
              <Route /> {t('Preparar itinerario')}
            </Button>
          )}
        </div>
        <div
          className="trip-progress-orbit"
          style={{ '--trip-progress': `${progress * 3.6}deg` } as CSSProperties}
          aria-label={t('{0}% del viaje preparado', { 0: progress })}
        >
          <span>
            <b>{progress}%</b> {t('preparado')}
          </span>
        </div>
      </section>

      <ol className="trip-readiness" aria-label={t('Progreso de preparación')}>
        {[
          {
            complete: hasDates,
            label: t('Fechas'),
            value: hasDates
              ? formatTripDates(collection.startDate, collection.endDate)
              : t('Pendientes'),
          },
          {
            complete: hasDestinations,
            label: t('Destinos'),
            value: hasDestinations
              ? t('{0} guardados', { 0: collection.items.length })
              : t('Añade el primero'),
          },
          {
            complete: hasItinerary,
            label: t('Itinerario'),
            value: hasItinerary
              ? t('{0} días guardados', { 0: collection.itinerary.length })
              : t('Sin confirmar'),
          },
          {
            complete: isShared,
            label: t('Compartir'),
            value: isShared ? t('Enlace activo') : t('Solo tú'),
          },
        ].map(({ complete, label, value }, index) => (
          <li key={t(label)} className={complete ? 'is-complete' : ''}>
            <span>{complete ? <CheckCircle2 /> : index + 1}</span>
            <div>
              <strong>{t(label)}</strong>
              <small>{value}</small>
            </div>
          </li>
        ))}
      </ol>

      <section className="trip-overview__grid">
        <article className="trip-overview-card trip-overview-card--route">
          <p className="kicker">{t('Tu ruta')}</p>
          <h3>
            {collection.items.length
              ? collection.items
                  .map((item) => item.destino.nombre)
                  .slice(0, 3)
                  .join(' → ')
              : t('Todavía sin paradas')}
          </h3>
          <p>
            {collection.items.length > 3
              ? t('Y {0} destinos más.', { 0: collection.items.length - 3 })
              : t('Ordena las paradas y decide dónde pasar cada noche.')}
          </p>
          <button type="button" onClick={() => onChangeView('itinerary')}>
            {t('Abrir día a día')} <Route />
          </button>
        </article>
        <article className="trip-overview-card">
          <p className="kicker">{t('El grupo')}</p>
          <h3>
            {collection.travelerCount || 2} {t('viajeros')}
          </h3>
          <p>
            {collection.members?.length
              ? t('{0} colaboradores con acceso al plan.', { 0: collection.members.length })
              : t('Todavía no has añadido colaboradores.')}
          </p>
          {canEdit && (
            <button type="button" onClick={onOpenSettings}>
              {t('Editar viajeros')} <Users />
            </button>
          )}
        </article>
      </section>
      {hasDestinations && <CollectionBudgetSummary collection={collection} />}
    </div>
  );
}
