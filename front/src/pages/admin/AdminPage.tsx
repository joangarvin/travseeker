import { creationContext } from '../../features/admin/publication/creationContext';
import { PublicationWorkspace } from '../../features/admin/publication/PublicationWorkspace';
import type { Entry as PublicationEntry } from '../../features/admin/publication/model';
import { useAdminData } from '../../features/admin/hooks/useAdminData';
import { useAdminReviews } from '../../features/admin/hooks/useAdminReviews';
import { useAdminTaxonomies } from '../../features/admin/hooks/useAdminTaxonomies';
import { markEditorSaved } from '../../utils/editorDraft';
import { useSearchParams } from 'react-router-dom';
import { t } from '../../i18n';
import { useEffect, useState, type FormEvent } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Shell } from '../../components/layout';
import { Empty, Loader, Dialog } from '../../components/ui';
import { useActivities, useAuth, useTourismTypes } from '../../contexts';
import { ActivityDeleteDialog } from '../../features/admin/components/ActivityDeleteDialog';
import { ActivityEditorModal } from '../../features/admin/components/ActivityEditorModal';
import { TourismTypeEditorModal } from '../../features/admin/components/TourismTypeEditorModal';
import { TourismTypeDeleteDialog } from '../../features/admin/components/TourismTypeDeleteDialog';
import { MunicipalityEditorModal } from '../../features/admin/components/MunicipalityEditorModal';
import { PlaceEditorModal } from '../../features/admin/components/PlaceEditorModal';
import { ReviewsPanel } from '../../features/admin/components/ReviewsPanel';
import {
  EditorialReviewPanel,
  type EditorialItem,
} from '../../features/admin/components/EditorialReviewPanel';
import type {
  AdminFeedback,
  AdminResource,
  AdminTab,
  EditorialResource,
} from '../../features/admin/types';
import { MunicipalityCatalogEditor } from '../../features/admin/components/MunicipalityCatalogEditor';
import { DestinationEditor } from '../../features/admin/components/DestinationEditor';
import {
  EMPTY_DESTINATION,
  EMPTY_MUNICIPALITY,
  EMPTY_PLACE,
} from '../../features/admin/adminCatalog';
import { api } from '../../services/api';
import type {
  Activity,
  Destino,
  EditorialStatus,
  MunicipalityRecord,
  Municipio,
  Place,
  TourismType,
} from '../../types';

export default function AdminPage() {
  const { user, token, loading: isAuthLoading } = useAuth();
  const { refreshActivities } = useActivities();
  const { refreshTourismTypes } = useTourismTypes();
  const [params, setParams] = useSearchParams();
  const tabNames: AdminTab[] = [
    'editorial',
    'destinos',
    'tipos-viaje',
    'actividades',
    'municipios',
    'catalogo-actividades',
    'hoteles',
    'restaurantes',
    'reviews',
    'places',
  ];
  const requestedTab = ['imprescindibles', 'experiencias'].includes(params.get('tab') || '')
    ? 'catalogo-actividades'
    : params.get('tab');
  const activeTab = tabNames.includes(requestedTab as AdminTab)
    ? (requestedTab as AdminTab)
    : 'editorial';
  const [catalogEditing, setCatalogEditing] = useState(false);
  const [catalogInitial, setCatalogInitial] = useState<Partial<MunicipalityRecord> | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogSaving, setCatalogSaving] = useState(false);
  const [catalogKind, setCatalogKind] = useState<'actividades' | 'hoteles' | 'restaurantes'>(
    'actividades',
  );
  const [management, setManagement] = useState<'editorial' | 'reviews' | null>(
    requestedTab === 'reviews' || requestedTab === 'editorial' ? requestedTab : null,
  );
  const [placeChoices, setPlaceChoices] = useState<Destino[]>([]);
  const setActiveTab = (tab: AdminTab) => {
    setCatalogInitial(null);
    setOffset(0);
    setCatalogStatus('all');
    setFeedback(null);
    setParams((current) => {
      const next = new URLSearchParams(current);
      next.set('tab', tab);
      next.delete('q');
      next.delete('edit');
      return next;
    });
  };
  const [offset, setOffset] = useState(0);
  const [catalogStatus, setCatalogStatus] = useState('all');
  const [municipalityOptions, setMunicipalityOptions] = useState<Municipio[]>([]);
  const { reviews, setReviews, moderateReview, moderateReviews, deleteReviews } =
    useAdminReviews(token);
  const [editorialRevision, setEditorialRevision] = useState(0);
  const [editorialItems, setEditorialItems] = useState<EditorialItem[]>([]);
  const [destinationQuery] = useState(() =>
    activeTab === 'destinos' ? params.get('q') || '' : '',
  );
  const [municipalityQuery] = useState(() =>
    activeTab === 'municipios' ? params.get('q') || '' : '',
  );
  const [reviewQuery, setReviewQuery] = useState('');
  const [isDestinationLoading, setIsDestinationLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<AdminFeedback | null>(null);
  const [destinationForm, setDestinationForm] = useState<Partial<Destino> | null>(null);
  const [municipalityForm, setMunicipalityForm] = useState<Partial<Municipio> | null>(null);
  const [placeForm, setPlaceForm] = useState<Partial<Place> | null>(null);

  const activeQuery =
    activeTab === 'destinos'
      ? destinationQuery
      : activeTab === 'municipios'
        ? municipalityQuery
        : '';
  const {
    destinations,
    setDestinations,
    municipalities,
    setMunicipalities,
    places,
    setPlaces,
    activities,
    setActivities,
    travelTypes,
    setTravelTypes,
    selectedDestinationId,
    setSelectedDestinationId,
    refreshCounts,
    loadAdminData,
    loadPlaces,
  } = useAdminData({
    token,
    isAdmin: user?.role === 'admin',
    activeTab,
    activeQuery,
    offset,
    catalogStatus,
    setFeedback,
    setReviews,
  });

  const {
    activityForm,
    setActivityForm,
    activityToDelete,
    setActivityToDelete,
    travelTypeForm,
    setTravelTypeForm,
    travelTypeToDelete,
    setTravelTypeToDelete,
    saveActivity,
    deleteActivity,
    saveTravelType,
    deleteTravelType,
  } = useAdminTaxonomies({
    token,
    activities,
    setActivities,
    travelTypes,
    setTravelTypes,
    setDestinations,
    setEditorialItems,
    setEditorialRevision,
    setFeedback,
    setIsSaving,
    refreshActivities,
    refreshTourismTypes,
  });

  useEffect(() => {
    setOffset(0);
  }, [activeQuery, catalogStatus]);
  useEffect(() => {
    if (!['destinos', 'municipios'].includes(activeTab)) return;
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (activeQuery) next.set('q', activeQuery);
        else next.delete('q');
        return next;
      },
      { replace: true },
    );
  }, [activeTab, activeQuery]);
  const loadMunicipalityOptions = () =>
    api<Municipio[]>('/admin/municipios?options=1', {}, token).then(setMunicipalityOptions);

  const openDestination = async (destination: Pick<Destino, 'id'>, section?: string) => {
    setIsDestinationLoading(true);
    setFeedback(null);

    try {
      const [record] = await Promise.all([
        api<Destino>(`/admin/destinos/${destination.id}`, {}, token),
        loadMunicipalityOptions(),
      ]);
      setDestinationForm(record);
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set('edit', record.id);
          if (section) next.set('section', section);
          return next;
        },
        { replace: true },
      );
    } catch (cause) {
      setFeedback({
        tone: 'error',
        text: cause instanceof Error ? cause.message : t('No se pudo abrir el destino completo'),
      });
    } finally {
      setIsDestinationLoading(false);
    }
  };

  const requestedEditor = params.get('edit');
  useEffect(() => {
    if (requestedEditor && !destinationForm && token && user?.role === 'admin') {
      void openDestination({ id: requestedEditor });
    }
  }, [requestedEditor, token, user?.role]);
  const closeDestination = () => {
    setDestinationForm(null);
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete('edit');
        next.delete('section');
        return next;
      },
      { replace: true },
    );
  };

  const editEditorialItem = async (item: EditorialItem) => {
    if (item.resource === 'destinos') {
      await openDestination({ id: item.id });
      return;
    }
    setFeedback(null);
    try {
      const endpoint = `/admin/editorial/${item.resource}/${item.id}`;
      switch (item.resource) {
        case 'municipios':
          setMunicipalityForm(await api<Municipio>(endpoint, {}, token));
          break;
        case 'activities':
          setActivityForm(await api<Activity>(endpoint, {}, token));
          break;
        case 'tourism-types':
          setTravelTypeForm(await api<TourismType>(endpoint, {}, token));
          break;
        case 'places': {
          const place = await api<Place & { destinoId: string }>(endpoint, {}, token);
          setSelectedDestinationId(place.destinoId);
          setPlaceForm(place);
          break;
        }
      }
    } catch (cause) {
      setFeedback({
        tone: 'error',
        text: cause instanceof Error ? cause.message : t('No se pudo abrir el contenido'),
      });
    }
  };

  const updateDestinationList = (destination: Destino) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set('edit', destination.id);
        return next;
      },
      { replace: true },
    );
    setEditorialRevision((value) => value + 1);
    void refreshCounts();
    setDestinations((currentDestinations) =>
      [...currentDestinations.filter((current) => current.id !== destination.id), destination].sort(
        (first, second) => first.nombre.localeCompare(second.nombre, 'es'),
      ),
    );
    setEditorialItems((current) => [
      ...current.filter((item) => !(item.resource === 'destinos' && item.id === destination.id)),
      {
        id: destination.id,
        resource: 'destinos',
        title: destination.nombre,
        editorialStatus: destination.editorialStatus,
        submittedAt: destination.submittedAt || new Date().toISOString(),
        reviewedAt: destination.reviewedAt,
        createdBy: destination.createdBy,
      },
    ]);
  };

  const saveMunicipality = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !municipalityForm) return;

    setIsSaving(true);
    setFeedback(null);

    try {
      await api(
        `/admin/municipios${municipalityForm.id ? `/${municipalityForm.id}` : ''}`,
        {
          method: municipalityForm.id ? 'PUT' : 'POST',
          body: JSON.stringify(municipalityForm),
        },
        token,
      );
      markEditorSaved(`municipality:${municipalityForm?.id || 'new'}`);
      setEditorialRevision((value) => value + 1);
      setMunicipalityForm(null);
      setFeedback({
        tone: 'success',
        text: municipalityForm.id
          ? t('Municipio actualizado')
          : t('Municipio creado y enviado a revisión'),
      });
      await loadAdminData();
      void refreshCounts();
    } catch (cause) {
      setFeedback({
        tone: 'error',
        text: cause instanceof Error ? cause.message : t('No se pudo guardar el municipio'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const savePlace = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !placeForm || !selectedDestinationId) return;

    setIsSaving(true);
    setFeedback(null);

    try {
      const endpoint = placeForm.id
        ? `/admin/places/${placeForm.id}`
        : `/admin/destinos/${selectedDestinationId}/places`;

      const saved = await api<Place>(
        endpoint,
        {
          method: placeForm.id ? 'PUT' : 'POST',
          body: JSON.stringify({
            ...placeForm,
            latitud: Number(placeForm.latitud),
            longitud: Number(placeForm.longitud),
            sortOrder: Number(placeForm.sortOrder || 0),
            isActive: placeForm.isActive !== false,
          }),
        },
        token,
      );

      markEditorSaved(`place:${placeForm?.id || 'new'}`);
      setEditorialRevision((value) => value + 1);
      setPlaceForm(null);
      await loadPlaces();
      setEditorialItems((current) => [
        ...current.filter((item) => !(item.resource === 'places' && item.id === saved.id)),
        {
          id: saved.id,
          resource: 'places',
          title: saved.nombre,
          editorialStatus: saved.editorialStatus,
          submittedAt: saved.submittedAt || new Date().toISOString(),
          reviewedAt: saved.reviewedAt,
          createdBy: saved.createdBy,
          isActive: saved.isActive,
        },
      ]);
      setFeedback({
        tone: 'success',
        text: placeForm.id ? t('Lugar actualizado') : t('Lugar creado y enviado a revisión'),
      });
    } catch (cause) {
      setFeedback({
        tone: 'error',
        text: cause instanceof Error ? cause.message : t('No se pudo guardar el lugar'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const removeResource = async (resource: AdminResource, id: string) => {
    const confirmed = confirm(
      t('¿Eliminar este elemento definitivamente? Esta acción no se puede deshacer.'),
    );
    if (!token || !confirmed) return;

    try {
      await api(`/admin/${resource}/${id}`, { method: 'DELETE' }, token);

      if (resource === 'places') {
        setPlaces((currentPlaces) => currentPlaces.filter((place) => place.id !== id));
      } else {
        setEditorialRevision((value) => value + 1);
        await loadAdminData();
        void refreshCounts();
      }

      setFeedback({ tone: 'success', text: t('Elemento eliminado') });
    } catch (cause) {
      setFeedback({
        tone: 'error',
        text: cause instanceof Error ? cause.message : t('No se pudo eliminar'),
      });
    }
  };

  const transitionEditorial = async (
    resource: EditorialResource,
    ids: string[],
    status: EditorialStatus,
  ) => {
    if (!token) throw new Error(t('La sesión de administración ha expirado'));
    const idSet = new Set(ids);
    const previousEditorial = editorialItems;
    const previousDestinations = destinations;
    const previousMunicipalities = municipalities;
    const previousPlaces = places;
    const previousActivities = activities;
    const previousTravelTypes = travelTypes;
    const reviewedAt =
      status === 'published' || status === 'archived' ? new Date().toISOString() : null;
    const optimistic = <
      T extends { id: string; editorialStatus: EditorialStatus; isActive?: boolean },
    >(
      rows: T[],
    ) =>
      rows.map((row) =>
        idSet.has(row.id)
          ? {
              ...row,
              editorialStatus: status,
              reviewedAt,
              ...(typeof row.isActive === 'boolean' ? { isActive: status === 'published' } : {}),
            }
          : row,
      );

    setEditorialItems((current) => optimistic(current));
    if (resource === 'destinos') setDestinations((current) => optimistic(current));
    if (resource === 'municipios') setMunicipalities((current) => optimistic(current));
    if (resource === 'places') setPlaces((current) => optimistic(current));
    if (resource === 'activities') setActivities((current) => optimistic(current));
    if (resource === 'tourism-types') setTravelTypes((current) => optimistic(current));

    try {
      await api(
        `/admin/editorial/${resource}/batch`,
        { method: 'PATCH', body: JSON.stringify({ ids, status }) },
        token,
      );
      void refreshCounts();
      if (resource === 'activities') await refreshActivities();
      if (resource === 'tourism-types') await refreshTourismTypes();
    } catch (cause) {
      setEditorialItems(previousEditorial);
      setDestinations(previousDestinations);
      setMunicipalities(previousMunicipalities);
      setPlaces(previousPlaces);
      setActivities(previousActivities);
      setTravelTypes(previousTravelTypes);
      throw cause;
    }
  };

  if (isAuthLoading) {
    return (
      <Shell footer={false}>
        <Loader />
      </Shell>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <Shell footer={false}>
        <section className="status-page">
          <Empty headingLevel="h1" icon={<ShieldCheck />} title={t('Acceso restringido')}>
            {t('Esta zona solo está disponible para administradores.')}
          </Empty>
        </section>
      </Shell>
    );
  }

  return (
    <Shell footer={false}>
      <PublicationWorkspace
        token={token!}
        initialTab={requestedTab}
        onResourceChange={setActiveTab}
        revision={editorialRevision}
        feedback={feedback}
        onDelete={async (entry) => {
          if (entry.resource === 'tipos-actividad') {
            setActivityToDelete(
              await api<Activity>(
                `/admin/publication/source/${entry.resource}/${entry.id}`,
                {},
                token,
              ),
            );
            return;
          }
          if (entry.resource === 'tipos-viaje') {
            setTravelTypeToDelete(
              await api<TourismType>(
                `/admin/publication/source/${entry.resource}/${entry.id}`,
                {},
                token,
              ),
            );
            return;
          }
          if (['destinos', 'municipios', 'places'].includes(entry.resource))
            await removeResource(entry.resource as AdminResource, entry.id);
        }}
        management={management}
        onManagementChange={(value) => {
          setManagement(value);
          if (value) setActiveTab(value);
        }}
        managementContent={
          management === 'editorial' ? (
            <EditorialReviewPanel
              revision={editorialRevision}
              onEdit={(item) => void editEditorialItem(item)}
              onTransition={transitionEditorial}
            />
          ) : management === 'reviews' ? (
            <ReviewsPanel
              reviews={reviews}
              query={reviewQuery}
              onQueryChange={setReviewQuery}
              onModerate={moderateReview}
              onBulkModerate={moderateReviews}
              onBulkDelete={deleteReviews}
            />
          ) : null
        }
        onOpenCatalog={async (tab, entry?: PublicationEntry) => {
          let record:
            | (MunicipalityRecord & Activity & TourismType & Place & { destinoId: string })
            | undefined;
          if (entry && !['destinos', 'municipios'].includes(tab))
            record = await api(
              `/admin/publication/source/${entry.resource}/${encodeURIComponent(entry.id)}`,
              {},
              token,
            );
          setFeedback(null);
          if (['actividades', 'tipos-viaje'].includes(tab)) setActiveTab(tab);
          if (entry && tab === 'municipios')
            setMunicipalityForm(await api<Municipio>(`/admin/municipios/${entry.id}`, {}, token));
          if (entry && tab === 'destinos') await openDestination({ id: entry.id });
          if (!entry) {
            if (tab === 'destinos') {
              await loadMunicipalityOptions();
              setDestinationForm({ ...EMPTY_DESTINATION, ...creationContext() });
            } else if (tab === 'municipios')
              setMunicipalityForm({ ...EMPTY_MUNICIPALITY, ...creationContext() });
            else if (tab === 'actividades')
              setActivityForm({ name: '', icon: 'Compass', sortOrder: 0, isActive: true });
            else if (tab === 'tipos-viaje')
              setTravelTypeForm({
                name: '',
                description: '',
                icon: 'Compass',
                colorKey: 'otro',
                colorValue: '#5f6470',
                sortOrder: 100,
                isActive: true,
              });
            else if (tab === 'places') {
              setPlaceChoices(await api<Destino[]>('/admin/destinos?options=1', {}, token));
              setSelectedDestinationId('');
              setPlaceForm({ ...EMPTY_PLACE, ...creationContext() });
            } else {
              setCatalogKind(
                tab === 'catalogo-actividades'
                  ? 'actividades'
                  : (tab as 'hoteles' | 'restaurantes'),
              );
              setCatalogInitial({ nombre: '', isPublished: false, ...creationContext() });
              setCatalogOpen(true);
            }
          }
          if (record) {
            if (['catalogo-actividades', 'hoteles', 'restaurantes'].includes(tab)) {
              setCatalogKind(
                tab === 'catalogo-actividades'
                  ? 'actividades'
                  : (tab as 'hoteles' | 'restaurantes'),
              );
              setCatalogInitial(record);
              setCatalogOpen(true);
            } else if (tab === 'actividades') setActivityForm(record);
            else if (tab === 'tipos-viaje') setTravelTypeForm(record);
            else {
              setSelectedDestinationId(record.destinoId);
              setPlaceForm(record);
            }
          }
        }}
      />
      {isDestinationLoading && (
        <div role="status" className="admin-editor-loading">
          <Loader />
          Abriendo ficha…
        </div>
      )}
      {catalogOpen && token && (
        <Dialog
          title={catalogInitial?.id ? 'Editar ficha' : 'Crear ficha'}
          busy={catalogSaving}
          onClose={() => {
            if (
              !catalogSaving &&
              (!catalogEditing || confirm('¿Cerrar la ficha? Se perderán los cambios sin guardar.'))
            ) {
              setCatalogOpen(false);
              setCatalogInitial(null);
            }
          }}
          className="admin-catalog-dialog"
        >
          <MunicipalityCatalogEditor
            key={`${catalogKind}:${catalogInitial?.id || 'new'}`}
            standalone
            editorOnly
            initialEditRecord={catalogInitial}
            kind={catalogKind}
            token={token}
            ids={[]}
            onChange={() => {}}
            onEditingChange={setCatalogEditing}
            onSavingChange={setCatalogSaving}
            onManageHighlights={(id) => void openDestination({ id }, 'essentials')}
            onSaved={() => {
              setCatalogEditing(false);
              setCatalogSaving(false);
              setEditorialRevision((value) => value + 1);
              setCatalogOpen(false);
              setCatalogInitial(null);
              setFeedback({
                tone: 'success',
                text: 'Ficha guardada. Puedes revisar su publicación en el flujo.',
              });
            }}
            onCancel={() => setCatalogOpen(false)}
          />
        </Dialog>
      )}
      {destinationForm && token && (
        <DestinationEditor
          initial={destinationForm}
          municipalities={municipalityOptions}
          token={token}
          onChange={updateDestinationList}
          onActivityCreated={(activity) =>
            setActivities((current) =>
              [...current.filter((item) => item.id !== activity.id), activity].sort(
                (first, second) =>
                  first.sortOrder - second.sortOrder || first.name.localeCompare(second.name, 'es'),
              ),
            )
          }
          onTourismTypeCreated={(type) =>
            setTravelTypes((current) =>
              [...current.filter((item) => item.id !== type.id), type].sort(
                (first, second) =>
                  first.sortOrder - second.sortOrder || first.name.localeCompare(second.name, 'es'),
              ),
            )
          }
          onClose={closeDestination}
        />
      )}

      {municipalityForm && (
        <MunicipalityEditorModal
          token={token!}
          error={feedback?.tone === 'error' ? feedback.text : undefined}
          form={municipalityForm}
          isSaving={isSaving}
          onChange={setMunicipalityForm}
          onSubmit={saveMunicipality}
          onClose={() => setMunicipalityForm(null)}
        />
      )}

      {placeForm && !placeForm.id && !selectedDestinationId && (
        <Dialog title="Destino del nuevo lugar" onClose={() => setPlaceForm(null)}>
          <label>
            Elige el destino al que pertenece
            <select
              aria-label="Destino del lugar"
              value={selectedDestinationId}
              onChange={(event) => setSelectedDestinationId(event.target.value)}
            >
              <option value="">Selecciona un destino</option>
              {placeChoices
                .filter((d) => !d.countryCode || d.countryCode === creationContext().countryCode)
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre}
                  </option>
                ))}
            </select>
          </label>
        </Dialog>
      )}
      {placeForm && (placeForm.id || selectedDestinationId) && (
        <PlaceEditorModal
          error={feedback?.tone === 'error' ? feedback.text : undefined}
          form={placeForm}
          isSaving={isSaving}
          onChange={setPlaceForm}
          onSubmit={savePlace}
          onClose={() => setPlaceForm(null)}
        />
      )}

      {activityForm && (
        <ActivityEditorModal
          error={feedback?.tone === 'error' ? feedback.text : undefined}
          initial={activityForm}
          isSaving={isSaving}
          onSave={saveActivity}
          onClose={() => setActivityForm(null)}
        />
      )}

      {activityToDelete && (
        <ActivityDeleteDialog
          activity={activityToDelete}
          isDeleting={isSaving}
          onConfirm={async () => {
            await deleteActivity();
            setEditorialRevision((n) => n + 1);
          }}
          onClose={() => setActivityToDelete(null)}
        />
      )}
      {travelTypeForm && (
        <TourismTypeEditorModal
          error={feedback?.tone === 'error' ? feedback.text : undefined}
          initial={travelTypeForm}
          isSaving={isSaving}
          onSave={saveTravelType}
          onClose={() => setTravelTypeForm(null)}
        />
      )}
      {travelTypeToDelete && (
        <TourismTypeDeleteDialog
          type={travelTypeToDelete}
          isDeleting={isSaving}
          onConfirm={async () => {
            await deleteTravelType();
            setEditorialRevision((n) => n + 1);
          }}
          onClose={() => setTravelTypeToDelete(null)}
        />
      )}
    </Shell>
  );
}
