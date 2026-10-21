import { TripHeader } from '../../features/collections/components/TripHeader';
import { TripOverview } from '../../features/collections/components/TripOverview';
import { useCollectionSharing } from '../../features/collections/hooks/useCollectionSharing';
import { t } from '../../i18n';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { LayoutDashboard, LayoutGrid, Route, Trash2 } from 'lucide-react';
import { Shell } from '../../components/layout';
import { Button, Loader, Notice, Toast } from '../../components/ui';
import { useAuth } from '../../contexts';
import { api } from '../../services/api';
import type { CollectionDetail, ItineraryDay } from '../../types';
import { withoutDestination } from '../../features/collections/destinationsModel';
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
  const [settingsMessage, setSettingsMessage] = useState('');
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
  const collectionRequest = useRef<AbortController | null>(null);

  const loadCollection = useCallback(async () => {
    collectionRequest.current?.abort();
    const controller = new AbortController();
    collectionRequest.current = controller;
    setIsLoading(true);
    setError('');
    try {
      const record = await api<CollectionDetail>(
        endpoint,
        { signal: controller.signal },
        publicView ? null : token,
      );
      if (!controller.signal.aborted) setCollection(record);
    } catch (cause) {
      if (!controller.signal.aborted) {
        setCollection(null);
        setError(cause instanceof Error ? cause.message : t('No se pudo abrir el viaje'));
      }
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
    }
  }, [endpoint, publicView, token]);

  useEffect(() => {
    void loadCollection();
    return () => collectionRequest.current?.abort();
  }, [loadCollection]);

  const removeDestination = async (destinationId: string) => {
    if (!token || !id) throw new Error(t('No se pudo identificar el viaje'));
    if (
      itineraryDirty &&
      !confirm(t('Hay cambios sin guardar. Quitar el destino los descartará. ¿Continuar?'))
    )
      return false;
    setActionPending(true);
    try {
      await api(`/colecciones/${id}/items/${destinationId}`, { method: 'DELETE' }, token);
      setCollection((current) => (current ? withoutDestination(current, destinationId) : current));
      return true;
    } finally {
      setActionPending(false);
    }
  };

  const { shareCollection, stopSharing, addMember, updateMember, removeMember } =
    useCollectionSharing({ id, token, setCollection, setActionPending });

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
    setSettingsMessage(t('Datos del viaje guardados'));
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
            <Notice
              tone="error"
              action={<Button onClick={() => void loadCollection()}>{t('Reintentar')}</Button>}
            >
              {error || t('Este viaje no está disponible.')}
            </Notice>
          </div>
        </section>
      </Shell>
    );
  }

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
        <TripHeader
          collection={collection}
          publicView={publicView}
          pending={actionPending}
          onEdit={openSettings}
          onShare={() => setShareOpen(true)}
        />
        {error && (
          <Notice tone="error">
            {error}{' '}
            <button type="button" onClick={() => void loadCollection()}>
              {t('Reintentar')}
            </button>
          </Notice>
        )}

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
            budget={budget(true)}
          />
        ) : null}
        <div hidden={view !== 'destinations'}>
          <TripDestinations
            collection={collection}
            canEdit={canEdit}
            pending={actionPending}
            onOpenDay={openDay}
            onOpenAgenda={() => setView('itinerary')}
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
      {settingsMessage && (
        <Toast duration={5000} onDismiss={() => setSettingsMessage('')}>
          {settingsMessage}
        </Toast>
      )}
    </Shell>
  );
}
