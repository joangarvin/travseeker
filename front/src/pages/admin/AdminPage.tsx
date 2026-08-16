import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ShieldCheck } from 'lucide-react';
import { PageHeading, Shell } from '../../components/layout';
import { Empty, Loader, Notice } from '../../components/ui';
import { useActivities, useAuth, useTourismTypes } from '../../contexts';
import { ActivitiesPanel } from '../../features/admin/components/ActivitiesPanel';
import { ActivityDeleteDialog } from '../../features/admin/components/ActivityDeleteDialog';
import { ActivityEditorModal } from '../../features/admin/components/ActivityEditorModal';
import { TourismTypesPanel } from '../../features/admin/components/TourismTypesPanel';
import { TourismTypeEditorModal } from '../../features/admin/components/TourismTypeEditorModal';
import { TourismTypeDeleteDialog } from '../../features/admin/components/TourismTypeDeleteDialog';
import { AdminNavigation } from '../../features/admin/components/AdminNavigation';
import { DestinationsPanel } from '../../features/admin/components/DestinationsPanel';
import { MunicipalitiesPanel } from '../../features/admin/components/MunicipalitiesPanel';
import { MunicipalityEditorModal } from '../../features/admin/components/MunicipalityEditorModal';
import { PlaceEditorModal } from '../../features/admin/components/PlaceEditorModal';
import { PlacesPanel } from '../../features/admin/components/PlacesPanel';
import { ReviewsPanel, type ReviewStatus } from '../../features/admin/components/ReviewsPanel';
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
import { DestinationEditor } from '../../features/admin/components/DestinationEditor';
import {
  EMPTY_DESTINATION,
  EMPTY_MUNICIPALITY,
  EMPTY_PLACE,
  filterActivities,
  filterDestinationChoices,
  filterDestinations,
  filterMunicipalities,
  filterPlaces,
  filterTourismTypes,
} from '../../features/admin/adminCatalog';
import { activityValues } from '../../features/activities/activities';
import { tourismValues } from '../../features/tourism/tourism';
import { api } from '../../services/api';
import type {
  Activity,
  Destino,
  EditorialStatus,
  Municipio,
  Place,
  Review,
  TourismType,
} from '../../types';

export default function AdminPage() {
  const { user, token, loading: isAuthLoading } = useAuth();
  const { refreshActivities } = useActivities();
  const { refreshTourismTypes } = useTourismTypes();
  const [activeTab, setActiveTab] = useState<AdminTab>('editorial');
  const [destinations, setDestinations] = useState<Destino[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipio[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [travelTypes, setTravelTypes] = useState<TourismType[]>([]);
  const [editorialItems, setEditorialItems] = useState<EditorialItem[]>([]);
  const [selectedDestinationId, setSelectedDestinationId] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [municipalityQuery, setMunicipalityQuery] = useState('');
  const [reviewQuery, setReviewQuery] = useState('');
  const [placeQuery, setPlaceQuery] = useState('');
  const [placeDestinationQuery, setPlaceDestinationQuery] = useState('');
  const [activityQuery, setActivityQuery] = useState('');
  const [travelTypeQuery, setTravelTypeQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDestinationLoading, setIsDestinationLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<AdminFeedback | null>(null);
  const [destinationForm, setDestinationForm] = useState<Partial<Destino> | null>(null);
  const [municipalityForm, setMunicipalityForm] = useState<Partial<Municipio> | null>(null);
  const [placeForm, setPlaceForm] = useState<Partial<Place> | null>(null);
  const [activityForm, setActivityForm] = useState<Partial<Activity> | null>(null);
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null);
  const [travelTypeForm, setTravelTypeForm] = useState<Partial<TourismType> | null>(null);
  const [travelTypeToDelete, setTravelTypeToDelete] = useState<TourismType | null>(null);

  const loadAdminData = async () => {
    if (!token || user?.role !== 'admin') return;

    setIsLoading(true);
    setFeedback(null);

    try {
      const [
        destinationData,
        municipalityData,
        reviewData,
        activityData,
        travelTypeData,
        editorialData,
      ] = await Promise.all([
        api<Destino[]>('/admin/destinos', {}, token),
        api<Municipio[]>('/admin/municipios', {}, token),
        api<Review[]>('/admin/reviews', {}, token),
        api<Activity[]>('/admin/activities', {}, token),
        api<TourismType[]>('/admin/tourism-types', {}, token),
        api<EditorialItem[]>('/admin/editorial?status=all', {}, token),
      ]);

      setDestinations(destinationData);
      setMunicipalities(municipalityData);
      setReviews(reviewData);
      setActivities(activityData);
      setTravelTypes(travelTypeData);
      setEditorialItems(editorialData);
      setSelectedDestinationId((currentId) => currentId || destinationData[0]?.id || '');
    } catch (cause) {
      setFeedback({
        tone: 'error',
        text: cause instanceof Error ? cause.message : 'No se pudo cargar la administración',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlaces = async () => {
    if (!token || !selectedDestinationId) return;

    try {
      setPlaces(await api<Place[]>(`/admin/destinos/${selectedDestinationId}/places`, {}, token));
    } catch (cause) {
      setFeedback({
        tone: 'error',
        text: cause instanceof Error ? cause.message : 'No se pudieron cargar los lugares',
      });
    }
  };

  useEffect(() => {
    void loadAdminData();
  }, [token, user?.role]);

  useEffect(() => {
    void loadPlaces();
  }, [token, selectedDestinationId]);

  const filteredDestinations = useMemo(
    () => filterDestinations(destinations, destinationQuery),
    [destinationQuery, destinations],
  );

  const filteredMunicipalities = useMemo(
    () => filterMunicipalities(municipalities, municipalityQuery),
    [municipalities, municipalityQuery],
  );

  const filteredPlaces = useMemo(() => filterPlaces(places, placeQuery), [placeQuery, places]);

  const filteredActivities = useMemo(
    () => filterActivities(activities, activityQuery),
    [activities, activityQuery],
  );
  const filteredTravelTypes = useMemo(
    () => filterTourismTypes(travelTypes, travelTypeQuery),
    [travelTypeQuery, travelTypes],
  );

  const destinationChoices = useMemo(
    () => filterDestinationChoices(destinations, placeDestinationQuery),
    [destinations, placeDestinationQuery],
  );

  const openDestination = async (destination: Destino) => {
    setIsDestinationLoading(true);
    setFeedback(null);

    try {
      setDestinationForm(await api<Destino>(`/admin/destinos/${destination.id}`, {}, token));
    } catch (cause) {
      setFeedback({
        tone: 'error',
        text: cause instanceof Error ? cause.message : 'No se pudo abrir el destino completo',
      });
    } finally {
      setIsDestinationLoading(false);
    }
  };

  const updateDestinationList = (destination: Destino) => {
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
      setMunicipalityForm(null);
      setFeedback({
        tone: 'success',
        text: municipalityForm.id
          ? 'Municipio actualizado'
          : 'Municipio creado y enviado a revisión',
      });
      await loadAdminData();
    } catch (cause) {
      setFeedback({
        tone: 'error',
        text: cause instanceof Error ? cause.message : 'No se pudo guardar el municipio',
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
        text: placeForm.id ? 'Lugar actualizado' : 'Lugar creado y enviado a revisión',
      });
    } catch (cause) {
      setFeedback({
        tone: 'error',
        text: cause instanceof Error ? cause.message : 'No se pudo guardar el lugar',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveActivity = async (activity: Partial<Activity>) => {
    if (!token) return;
    const previousName = activity.id
      ? activities.find((item) => item.id === activity.id)?.name
      : undefined;
    setIsSaving(true);
    setFeedback(null);
    try {
      const saved = await api<Activity>(
        `/admin/activities${activity.id ? `/${activity.id}` : ''}`,
        {
          method: activity.id ? 'PUT' : 'POST',
          body: JSON.stringify(activity),
        },
        token,
      );
      setActivities((current) =>
        [...current.filter((item) => item.id !== saved.id), saved].sort(
          (first, second) =>
            first.sortOrder - second.sortOrder || first.name.localeCompare(second.name, 'es'),
        ),
      );
      if (previousName && previousName !== saved.name) {
        setDestinations((current) =>
          current.map((destination) => ({
            ...destination,
            tipoTurismoSecundario: JSON.stringify(
              activityValues(destination.tipoTurismoSecundario).map((name) =>
                name === previousName ? saved.name : name,
              ),
            ),
          })),
        );
      }
      setActivityForm(null);
      setEditorialItems((current) => [
        ...current.filter((item) => !(item.resource === 'activities' && item.id === saved.id)),
        {
          id: saved.id,
          resource: 'activities',
          title: saved.name,
          editorialStatus: saved.editorialStatus,
          submittedAt: saved.submittedAt || new Date().toISOString(),
          reviewedAt: saved.reviewedAt,
          createdBy: saved.createdBy,
          isActive: saved.isActive,
        },
      ]);
      await refreshActivities();
      setFeedback({
        tone: 'success',
        text: activity.id ? 'Actividad actualizada' : 'Actividad creada y enviada a revisión',
      });
    } catch (cause) {
      setFeedback({
        tone: 'error',
        text: cause instanceof Error ? cause.message : 'No se pudo guardar la actividad',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteActivity = async () => {
    if (!token || !activityToDelete) return;
    setIsSaving(true);
    setFeedback(null);
    try {
      const result = await api<{ removedFromDestinations: number }>(
        `/admin/activities/${activityToDelete.id}`,
        { method: 'DELETE' },
        token,
      );
      setActivities((current) => current.filter((item) => item.id !== activityToDelete.id));
      setDestinations((current) =>
        current.map((destination) => ({
          ...destination,
          tipoTurismoSecundario: JSON.stringify(
            activityValues(destination.tipoTurismoSecundario).filter(
              (name) => name !== activityToDelete.name,
            ),
          ),
        })),
      );
      setActivityToDelete(null);
      await refreshActivities();
      setFeedback({
        tone: 'success',
        text: `Actividad eliminada de ${result.removedFromDestinations} destinos`,
      });
    } catch (cause) {
      setFeedback({
        tone: 'error',
        text: cause instanceof Error ? cause.message : 'No se pudo eliminar la actividad',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveTravelType = async (type: Partial<TourismType>) => {
    if (!token) return;
    const previousName = type.id
      ? travelTypes.find((item) => item.id === type.id)?.name
      : undefined;
    setIsSaving(true);
    setFeedback(null);
    try {
      const saved = await api<TourismType>(
        `/admin/tourism-types${type.id ? `/${type.id}` : ''}`,
        { method: type.id ? 'PUT' : 'POST', body: JSON.stringify(type) },
        token,
      );
      setTravelTypes((current) =>
        [...current.filter((item) => item.id !== saved.id), saved].sort(
          (first, second) =>
            first.sortOrder - second.sortOrder || first.name.localeCompare(second.name, 'es'),
        ),
      );
      if (previousName && previousName !== saved.name) {
        setDestinations((current) =>
          current.map((destination) => ({
            ...destination,
            tipoTurismoPrincipal: JSON.stringify(
              tourismValues(destination.tipoTurismoPrincipal).map((name) =>
                name === previousName ? saved.name : name,
              ),
            ),
          })),
        );
      }
      setTravelTypeForm(null);
      setEditorialItems((current) => [
        ...current.filter((item) => !(item.resource === 'tourism-types' && item.id === saved.id)),
        {
          id: saved.id,
          resource: 'tourism-types',
          title: saved.name,
          editorialStatus: saved.editorialStatus,
          submittedAt: saved.submittedAt || new Date().toISOString(),
          reviewedAt: saved.reviewedAt,
          createdBy: saved.createdBy,
          isActive: saved.isActive,
        },
      ]);
      await refreshTourismTypes();
      setFeedback({
        tone: 'success',
        text: type.id ? 'Tipo de viaje actualizado' : 'Tipo de viaje creado y enviado a revisión',
      });
    } catch (cause) {
      setFeedback({
        tone: 'error',
        text: cause instanceof Error ? cause.message : 'No se pudo guardar el tipo de viaje',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTravelType = async () => {
    if (!token || !travelTypeToDelete) return;
    setIsSaving(true);
    setFeedback(null);
    try {
      const result = await api<{ removedFromDestinations: number }>(
        `/admin/tourism-types/${travelTypeToDelete.id}`,
        { method: 'DELETE' },
        token,
      );
      setTravelTypes((current) => current.filter((item) => item.id !== travelTypeToDelete.id));
      setDestinations((current) =>
        current.map((destination) => ({
          ...destination,
          tipoTurismoPrincipal: JSON.stringify(
            tourismValues(destination.tipoTurismoPrincipal).filter(
              (name) => name !== travelTypeToDelete.name,
            ),
          ),
        })),
      );
      setTravelTypeToDelete(null);
      await refreshTourismTypes();
      setFeedback({
        tone: 'success',
        text: `Tipo eliminado de ${result.removedFromDestinations} destinos`,
      });
    } catch (cause) {
      setFeedback({
        tone: 'error',
        text: cause instanceof Error ? cause.message : 'No se pudo eliminar el tipo de viaje',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const removeResource = async (resource: AdminResource, id: string) => {
    const confirmed = confirm(
      '¿Eliminar este elemento definitivamente? Esta acción no se puede deshacer.',
    );
    if (!token || !confirmed) return;

    try {
      await api(`/admin/${resource}/${id}`, { method: 'DELETE' }, token);

      if (resource === 'places') {
        setPlaces((currentPlaces) => currentPlaces.filter((place) => place.id !== id));
      } else {
        await loadAdminData();
      }

      setFeedback({ tone: 'success', text: 'Elemento eliminado' });
    } catch (cause) {
      setFeedback({
        tone: 'error',
        text: cause instanceof Error ? cause.message : 'No se pudo eliminar',
      });
    }
  };

  const transitionEditorial = async (
    resource: EditorialResource,
    ids: string[],
    status: EditorialStatus,
  ) => {
    if (!token) throw new Error('La sesión de administración ha expirado');
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

  const moderateReview = async (
    id: string,
    patch: { status?: ReviewStatus; adminResponse?: string | null },
  ) => {
    if (!token) throw new Error('La sesión de administración ha expirado');
    const previous = reviews.find((review) => review.id === id);
    if (!previous) throw new Error('La reseña ya no está disponible');

    setReviews((current) =>
      current.map((review) =>
        review.id === id
          ? {
              ...review,
              ...patch,
              respondedAt:
                patch.adminResponse === undefined
                  ? review.respondedAt
                  : patch.adminResponse?.trim()
                    ? new Date().toISOString()
                    : null,
            }
          : review,
      ),
    );

    try {
      const saved = await api<Review>(
        `/admin/reviews/${id}`,
        { method: 'PATCH', body: JSON.stringify(patch) },
        token,
      );
      setReviews((current) => current.map((review) => (review.id === id ? saved : review)));
    } catch (cause) {
      setReviews((current) => current.map((review) => (review.id === id ? previous : review)));
      throw cause;
    }
  };

  const moderateReviews = async (ids: string[], status: ReviewStatus) => {
    if (!token) throw new Error('La sesión de administración ha expirado');
    const selected = new Set(ids);
    const previous = reviews.filter((review) => selected.has(review.id));
    setReviews((current) =>
      current.map((review) => (selected.has(review.id) ? { ...review, status } : review)),
    );

    try {
      await api(
        '/admin/reviews/batch',
        { method: 'PATCH', body: JSON.stringify({ reviewIds: ids, status }) },
        token,
      );
    } catch (cause) {
      const previousById = new Map(previous.map((review) => [review.id, review]));
      setReviews((current) => current.map((review) => previousById.get(review.id) || review));
      throw cause;
    }
  };

  const deleteReviews = async (ids: string[]) => {
    if (!token) throw new Error('La sesión de administración ha expirado');
    const selected = new Set(ids);
    const previous = reviews;
    setReviews((current) => current.filter((review) => !selected.has(review.id)));

    try {
      await api(
        '/admin/reviews/batch',
        { method: 'DELETE', body: JSON.stringify({ reviewIds: ids }) },
        token,
      );
    } catch (cause) {
      setReviews(previous);
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
          <Empty headingLevel="h1" icon={<ShieldCheck />} title="Acceso restringido">
            Esta zona solo está disponible para administradores.
          </Empty>
        </section>
      </Shell>
    );
  }

  const resourceCounts: Record<AdminTab, number> = {
    editorial: editorialItems.filter((item) => item.editorialStatus === 'pending').length,
    destinos: destinations.length,
    'tipos-viaje': travelTypes.length,
    actividades: activities.length,
    municipios: municipalities.length,
    reviews: reviews.length,
    places: places.length,
  };

  return (
    <Shell footer={false}>
      <PageHeading kicker="Back office" title="Administración">
        <p>
          Gestiona destinos, tipos de viaje, actividades, municipios, lugares y reseñas sin tocar
          código.
        </p>
      </PageHeading>

      <div className="admin-layout">
        <AdminNavigation activeTab={activeTab} counts={resourceCounts} onChange={setActiveTab} />

        <section
          className="admin-workspace"
          id="admin-panel"
          role="tabpanel"
          aria-labelledby={`admin-tab-${activeTab}`}
        >
          {feedback && <Notice tone={feedback.tone}>{feedback.text}</Notice>}
          {isLoading ? (
            <Loader />
          ) : (
            <>
              {activeTab === 'editorial' && (
                <EditorialReviewPanel items={editorialItems} onTransition={transitionEditorial} />
              )}
              {activeTab === 'destinos' && (
                <DestinationsPanel
                  destinations={filteredDestinations}
                  query={destinationQuery}
                  isEditorLoading={isDestinationLoading}
                  onQueryChange={setDestinationQuery}
                  onCreate={() => setDestinationForm({ ...EMPTY_DESTINATION })}
                  onEdit={(destination) => void openDestination(destination)}
                  onDelete={(id) => void removeResource('destinos', id)}
                />
              )}

              {activeTab === 'actividades' && (
                <ActivitiesPanel
                  activities={filteredActivities}
                  query={activityQuery}
                  onQueryChange={setActivityQuery}
                  onCreate={() =>
                    setActivityForm({ name: '', icon: 'Compass', sortOrder: 0, isActive: true })
                  }
                  onEdit={setActivityForm}
                  onDelete={setActivityToDelete}
                />
              )}
              {activeTab === 'tipos-viaje' && (
                <TourismTypesPanel
                  types={filteredTravelTypes}
                  query={travelTypeQuery}
                  onQueryChange={setTravelTypeQuery}
                  onCreate={() =>
                    setTravelTypeForm({
                      name: '',
                      description: '',
                      icon: 'Compass',
                      colorKey: 'otro',
                      colorValue: '#5f6470',
                      sortOrder: 100,
                      isActive: true,
                    })
                  }
                  onEdit={setTravelTypeForm}
                  onDelete={setTravelTypeToDelete}
                />
              )}

              {activeTab === 'municipios' && (
                <MunicipalitiesPanel
                  municipalities={filteredMunicipalities}
                  query={municipalityQuery}
                  onQueryChange={setMunicipalityQuery}
                  onCreate={() => setMunicipalityForm({ ...EMPTY_MUNICIPALITY })}
                  onEdit={setMunicipalityForm}
                  onDelete={(id) => void removeResource('municipios', id)}
                />
              )}

              {activeTab === 'reviews' && (
                <ReviewsPanel
                  reviews={reviews}
                  query={reviewQuery}
                  onQueryChange={setReviewQuery}
                  onModerate={moderateReview}
                  onBulkModerate={moderateReviews}
                  onBulkDelete={deleteReviews}
                />
              )}

              {activeTab === 'places' && (
                <PlacesPanel
                  places={filteredPlaces}
                  destinations={destinationChoices}
                  selectedDestinationId={selectedDestinationId}
                  placeQuery={placeQuery}
                  destinationQuery={placeDestinationQuery}
                  onPlaceQueryChange={setPlaceQuery}
                  onDestinationQueryChange={setPlaceDestinationQuery}
                  onDestinationChange={setSelectedDestinationId}
                  onCreate={() => setPlaceForm({ ...EMPTY_PLACE })}
                  onEdit={setPlaceForm}
                  onDelete={(id) => void removeResource('places', id)}
                />
              )}
            </>
          )}
        </section>
      </div>

      {destinationForm && token && (
        <DestinationEditor
          initial={destinationForm}
          municipalities={municipalities}
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
          onClose={() => setDestinationForm(null)}
        />
      )}

      {municipalityForm && (
        <MunicipalityEditorModal
          form={municipalityForm}
          isSaving={isSaving}
          onChange={setMunicipalityForm}
          onSubmit={saveMunicipality}
          onClose={() => setMunicipalityForm(null)}
        />
      )}

      {placeForm && (
        <PlaceEditorModal
          form={placeForm}
          isSaving={isSaving}
          onChange={setPlaceForm}
          onSubmit={savePlace}
          onClose={() => setPlaceForm(null)}
        />
      )}

      {activityForm && (
        <ActivityEditorModal
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
          onConfirm={() => void deleteActivity()}
          onClose={() => setActivityToDelete(null)}
        />
      )}
      {travelTypeForm && (
        <TourismTypeEditorModal
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
          onConfirm={() => void deleteTravelType()}
          onClose={() => setTravelTypeToDelete(null)}
        />
      )}
    </Shell>
  );
}
