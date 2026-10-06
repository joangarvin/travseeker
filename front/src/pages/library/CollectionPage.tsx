import { t, intlLocale } from '../../i18n';
import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Calendar,
  Edit3,
  LayoutDashboard,
  LayoutGrid,
  MapPin,
  Route,
  Share2,
  Trash2,
  Users,
} from 'lucide-react';
import { Shell } from '../../components/layout';
import { Button, Loader, MediaImage, Notice } from '../../components/ui';
import { useAuth } from '../../contexts';
import { api } from '../../services/api';
import type { CollectionDetail, ItineraryDay } from '../../types';
import { imageUrl, responsiveImageUrl } from '../../utils';
import { TripDestinations } from '../../features/collections/components/TripDestinations';
import { addTripDays, getTripDuration } from '../../utils/tripDuration';
import { CollectionBudgetSummary, type TripBudgetScenario } from '../../components/BudgetEstimator';
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
  const [deletePending, setDeletePending] = useState(false);
  const [view, setView] = useState<'overview' | 'destinations' | 'itinerary'>('itinerary');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [itineraryDirty, setItineraryDirty] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState<ItineraryDay[] | null>(null);
  const [budgetScenario, setBudgetScenario] = useState<TripBudgetScenario>({
    style: 'moderate',
    season: 'mid',
  });
  const [focusDay, setFocusDay] = useState<{ index: number }>();
  const openDay = (day: number) => {
    setFocusDay({ index: day });
    setView('itinerary');
  };
  const openSettings = () => {
    if (
      itineraryDirty &&
      !confirm(t('Hay cambios sin guardar. Editar las fechas puede descartarlos. ¿Continuar?'))
    )
      return;
    setSettingsOpen(true);
  };
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
    if (
      itineraryDirty &&
      !confirm(t('Hay cambios sin guardar. Quitar el destino los descartará. ¿Continuar?'))
    )
      return;
    setActionPending(true);
    try {
      await api(`/colecciones/${id}/items/${destinationId}`, { method: 'DELETE' }, token);
      await loadCollection();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('No se pudo quitar el destino'));
    } finally {
      setActionPending(false);
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

  const saveDestinationNotes = async (destinationId: string, notas: string) => {
    if (!token || !id) throw new Error(t('No se pudo identificar el viaje'));
    await api(
      `/colecciones/${id}/items/${destinationId}`,
      { method: 'PATCH', body: JSON.stringify({ notas }) },
      token,
    );
    setCollection((current) =>
      current
        ? {
            ...current,
            items: current.items.map((item) =>
              item.destino.id === destinationId ? { ...item, notas } : item,
            ),
          }
        : current,
    );
  };
  const applyBudget = async (travelers: number, nights: number) => {
    if (!collection || !token || !id) throw new Error(t('No se pudo identificar el viaje'));
    if (itineraryDirty)
      throw new Error(t('Guarda primero los cambios de la agenda para ajustar la duración.'));
    const actual = getTripDuration({
      startDate: collection.startDate,
      endDate: collection.endDate,
      itineraryLength: collection.itinerary.length,
    });
    if (!collection.startDate && nights !== actual.nights)
      throw new Error(t('Añade una fecha de inicio en Editar viaje para guardar las noches.'));
    if (
      collection.itinerary.length > nights + 1 &&
      !confirm(t('Se quitarán los días del final y sus actividades. ¿Continuar?'))
    )
      throw new Error(t('La duración no se ha cambiado.'));
    const updated = await api<CollectionDetail>(
      `/colecciones/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          travelerCount: travelers,
          ...(collection.startDate ? { endDate: addTripDays(collection.startDate, nights) } : {}),
        }),
      },
      token,
    );
    setCollection((current) =>
      current
        ? { ...current, ...updated, items: current.items, members: current.members }
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
  const budget = (compact = false) => (
    <CollectionBudgetSummary
      collection={{ ...collection, itinerary: budgetDraft ?? collection.itinerary }}
      scenario={budgetScenario}
      onChangeScenario={setBudgetScenario}
      onApply={isOwner ? applyBudget : undefined}
      compact={compact}
    />
  );

  return (
    <Shell>
      <div className="trip-workspace">
        <div className="trip-breadcrumb no-print">
          <Link to="/colecciones">← {t('Tus viajes')}</Link>
          <span>/ {collection.nombre}</span>
        </div>
        <header className="trip-workspace-header trip-workspace-header--cover">
          {collection.items[0] && (
            <MediaImage
              className="trip-workspace-header__photo"
              src={imageUrl(collection.items[0].destino.imagen)}
              alt=""
              fetchPriority="high"
              sizes="100vw"
            />
          )}
          <div className="trip-workspace-header__title">
            <p className="kicker">{visibilityLabel}</p>
            <h1>{collection.nombre}</h1>
            <p>{collection.descripcion || t('Un viaje en construcción.')}</p>
          </div>
          {isOwner && (
            <div className="heading-actions no-print">
              <Button variant="secondary" onClick={openSettings}>
                <Edit3 /> {t('Editar viaje')}
              </Button>
              <Button
                variant="secondary"
                disabled={actionPending}
                onClick={() => setShareOpen(true)}
              >
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
            aria-selected={view === 'itinerary'}
            onClick={() => setView('itinerary')}
          >
            <Route /> {t('Itinerario día a día')}
          </button>
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
        </div>

        {view === 'overview' ? (
          <TripOverview
            collection={collection}
            canEdit={canEdit}
            onOpenSettings={openSettings}
            onChangeView={setView}
            onOpenDay={openDay}
            onShare={() => setShareOpen(true)}
            isOwner={isOwner}
            budget={budget()}
          />
        ) : null}
        <div hidden={view !== 'destinations'}>
          <TripDestinations
            collection={collection}
            canEdit={canEdit}
            pending={actionPending}
            onOpenDay={openDay}
            onRemove={removeDestination}
            onSaveNotes={saveDestinationNotes}
          />
        </div>
        <div hidden={view !== 'itinerary'} className="trip-agenda-panel">
          <ItineraryBuilder
            collection={collection}
            canEdit={canEdit}
            onSave={canEdit ? saveItinerary : undefined}
            onDirtyChange={setItineraryDirty}
            onDraftChange={setBudgetDraft}
            focusDay={focusDay}
            budget={budget(true)}
          />
        </div>

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
      </div>
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
            <img
              key={person.id}
              className="trip-avatar"
              src={responsiveImageUrl(imageUrl(person.avatarUrl), 96)}
              loading="lazy"
              decoding="async"
              alt=""
            />
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
  isOwner,
  onOpenSettings,
  onChangeView,
  onOpenDay,
  onShare,
  budget,
}: {
  collection: CollectionDetail;
  canEdit: boolean;
  isOwner: boolean;
  onOpenSettings: () => void;
  onChangeView: (view: 'overview' | 'destinations' | 'itinerary') => void;
  onOpenDay: (day: number) => void;
  onShare: () => void;
  budget: ReactNode;
}) {
  const activities = collection.itinerary.reduce(
    (sum, day) => sum + (day.plannedActivities?.length || 0),
    0,
  );
  const emptyDays = collection.itinerary
    .map((day, index) => ({ day, index }))
    .filter(({ day }) => !day.plannedActivities?.length);
  const duration = getTripDuration({
    startDate: collection.startDate,
    endDate: collection.endDate,
    itineraryLength: collection.itinerary.length,
    destinationCount: collection.items.length,
  });
  const cover = collection.items[0]?.destino;
  return (
    <div className="trip-summary">
      <section className="trip-summary__hero">
        {cover && <MediaImage src={imageUrl(cover.imagen)} alt="" loading="lazy" />}
        <div>
          <p className="kicker">{t('Tu viaje, de un vistazo')}</p>
          <h2>
            {collection.items.length
              ? collection.items.map((item) => item.destino.nombre).join(' → ')
              : t('Tu próxima aventura empieza aquí')}
          </h2>
          <p>
            {collection.descripcion || t('Dale forma a la ruta y deja espacio para descubrir.')}
          </p>
          <Button onClick={() => onChangeView('itinerary')}>
            <Route />
            {t('Continuar en la agenda')}
          </Button>
        </div>
      </section>
      <div className="trip-summary__facts">
        {[
          {
            label: t('Duración'),
            value: `${duration.days} ${t('días')} · ${duration.nights} ${t('noches')}`,
          },
          { label: t('Destinos'), value: collection.items.length },
          { label: t('Actividades'), value: activities },
          { label: t('Viajeros'), value: collection.travelerCount || 2 },
        ].map((fact) => (
          <article key={fact.label}>
            <small>{fact.label}</small>
            <strong>{fact.value}</strong>
          </article>
        ))}
      </div>
      <div className="trip-summary__grid">
        <section className="trip-summary__card">
          <p className="kicker">{t('Lo que queda por preparar')}</p>
          <h3>
            {emptyDays.length || !collection.startDate || !collection.itinerary.length
              ? t('El siguiente paso')
              : t('Tu plan está listo')}
          </h3>
          {!collection.startDate && (
            <div className="trip-summary__task">
              <span>{t('Elegir las fechas del viaje')}</span>
              {isOwner && (
                <Button variant="secondary" onClick={onOpenSettings}>
                  {t('Elegir fechas')}
                </Button>
              )}
            </div>
          )}
          {!collection.items.length && (
            <Link className="button button--primary" to="/">
              {t('Descubrir destinos')}
            </Link>
          )}
          {!collection.itinerary.length && collection.items.length > 0 && (
            <Button onClick={() => onChangeView('itinerary')}>{t('Preparar itinerario')}</Button>
          )}
          {emptyDays.map(({ day, index }) => (
            <div className="trip-summary__task" key={index}>
              <span>
                {t('Día')} {day.dayNumber} ·{' '}
                {
                  collection.items.find((item) => item.destino.id === day.destinationId)?.destino
                    .nombre
                }
                <small>{t('Sin actividades todavía')}</small>
              </span>
              <Button variant="secondary" onClick={() => onOpenDay(index)}>
                {canEdit ? t('Planificar día') : t('Ver día')}
              </Button>
            </div>
          ))}
          {!emptyDays.length && collection.startDate && collection.itinerary.length > 0 && (
            <p>
              {t(
                'Las fechas y las actividades están preparadas. Puedes seguir ajustando la agenda.',
              )}
            </p>
          )}
        </section>
        <section className="trip-summary__card">
          <p className="kicker">{t('Tu ruta')}</p>
          <h3>{t('Parada a parada')}</h3>
          <ol className="trip-summary__route">
            {collection.itinerary.map((day, index) => (
              <li key={index}>
                <button type="button" onClick={() => onOpenDay(index)}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <strong>
                      {collection.items.find((item) => item.destino.id === day.destinationId)
                        ?.destino.nombre || t('Destino')}
                    </strong>
                    <small>
                      {day.plannedActivities?.length || 0} {t('actividades')}
                    </small>
                  </div>
                </button>
              </li>
            ))}
          </ol>
          {!collection.itinerary.length && <p>{t('Todavía sin paradas')}</p>}
        </section>
        <section className="trip-summary__card">
          <p className="kicker">{t('El grupo')}</p>
          <h3>
            {collection.travelerCount || 2} {t('viajeros')}
          </h3>
          <ParticipantAvatars collection={collection} />
          <p>
            {collection.members?.length || 0} {t('colaboradores')}
          </p>
          {isOwner && (
            <div className="trip-destination__actions">
              <Button variant="secondary" onClick={onOpenSettings}>
                {t('Editar viajeros')}
              </Button>
              <Button onClick={onShare}>
                <Share2 />
                {t('Gestionar acceso')}
              </Button>
            </div>
          )}
          <p className="muted">{t('Compartir es opcional. Puedes mantener tu viaje privado.')}</p>
        </section>
      </div>
      {budget}
    </div>
  );
}
