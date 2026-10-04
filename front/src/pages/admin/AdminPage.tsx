import { markEditorSaved } from '../../utils/editorDraft';
import { useSearchParams } from 'react-router-dom';
import { t } from '../../i18n';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
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
  const [params, setParams] = useSearchParams();
  const tabNames: AdminTab[] = [
    'editorial',
    'destinos',
    'tipos-viaje',
    'actividades',
    'municipios',
    'reviews',
    'places',
  ];
  const activeTab = tabNames.includes(params.get('tab') as AdminTab)
    ? (params.get('tab') as AdminTab)
    : 'editorial';
  const setActiveTab = (tab: AdminTab) => {
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
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [catalogStatus, setCatalogStatus] = useState('all');
  const [serverCounts, setServerCounts] = useState<Record<string, number>>({});
  const [placesLoading, setPlacesLoading] = useState(false);
  const placesRequest = useRef<AbortController | null>(null);
  const adminRequest = useRef<AbortController | null>(null);
  const [destinations, setDestinations] = useState<Destino[]>([]);
  const [municipalityOptions, setMunicipalityOptions] = useState<Municipio[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipio[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [travelTypes, setTravelTypes] = useState<TourismType[]>([]);
  const [editorialRevision, setEditorialRevision] = useState(0);
  const [editorialItems, setEditorialItems] = useState<EditorialItem[]>([]);
  const [selectedDestinationId, setSelectedDestinationId] = useState('');
  const [destinationQuery, setDestinationQuery] = useState(() =>
    activeTab === 'destinos' ? params.get('q') || '' : '',
  );
  const [municipalityQuery, setMunicipalityQuery] = useState(() =>
    activeTab === 'municipios' ? params.get('q') || '' : '',
  );
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

  const activeQuery =
    activeTab === 'destinos'
      ? destinationQuery
      : activeTab === 'municipios'
        ? municipalityQuery
        : '';
  const refreshCounts = async () => {
    try {
      setServerCounts(await api<Record<string, number>>('/admin/counts', {}, token));
    } catch {
      /* Panels remain usable when counts are unavailable. */
    }
  };
  const loadAdminData = async () => {
    if (!token || user?.role !== 'admin') return;
    adminRequest.current?.abort();
    const controller = new AbortController();
    adminRequest.current = controller;
    if (activeTab === 'editorial') {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const pageQuery = `?meta=1&limit=40&offset=${offset}&q=${encodeURIComponent(activeQuery)}&status=${catalogStatus}`;
      const options = { signal: controller.signal };
      if (activeTab === 'destinos') {
        const page = await api<{ items: Destino[]; total: number }>(
          `/admin/destinos${pageQuery}`,
          options,
          token,
        );
        if (!controller.signal.aborted) {
          setDestinations(page.items);
          setCatalogTotal(page.total);
        }
      } else if (activeTab === 'municipios') {
        const page = await api<{ items: Municipio[]; total: number }>(
          `/admin/municipios${pageQuery}`,
          options,
          token,
        );
        if (!controller.signal.aborted) {
          setMunicipalities(page.items);
          setCatalogTotal(page.total);
        }
      } else if (activeTab === 'reviews')
        setReviews(await api<Review[]>('/admin/reviews', options, token));
      else if (activeTab === 'actividades')
        setActivities(await api<Activity[]>('/admin/activities', options, token));
      else if (activeTab === 'tipos-viaje')
        setTravelTypes(await api<TourismType[]>('/admin/tourism-types', options, token));
      else if (activeTab === 'places') {
        const choices = await api<Destino[]>('/admin/destinos?options=1', options, token);
        if (!controller.signal.aborted) {
          setDestinations(choices);
          setSelectedDestinationId((current) => current || choices[0]?.id || '');
        }
      }
    } catch (cause) {
      if (!controller.signal.aborted)
        setFeedback({
          tone: 'error',
          text: cause instanceof Error ? cause.message : t('No se pudo cargar la administración'),
        });
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
    }
  };
  const loadPlaces = async () => {
    placesRequest.current?.abort();
    const controller = new AbortController();
    placesRequest.current = controller;
    setPlaces([]);
    if (!token || !selectedDestinationId || activeTab !== 'places') {
      setPlacesLoading(false);
      return;
    }
    setPlacesLoading(true);
    try {
      const records = await api<Place[]>(
        `/admin/destinos/${selectedDestinationId}/places`,
        { signal: controller.signal },
        token,
      );
      if (!controller.signal.aborted) setPlaces(records);
    } catch (cause) {
      if (!controller.signal.aborted)
        setFeedback({
          tone: 'error',
          text: cause instanceof Error ? cause.message : t('No se pudieron cargar los lugares'),
        });
    } finally {
      if (!controller.signal.aborted) setPlacesLoading(false);
    }
  };
  useEffect(() => {
    if (token && user?.role === 'admin') void refreshCounts();
  }, [token, user?.role]);
  useEffect(() => {
    const timer = window.setTimeout(() => void loadAdminData(), activeQuery ? 250 : 0);
    return () => {
      window.clearTimeout(timer);
      adminRequest.current?.abort();
    };
  }, [token, user?.role, activeTab, activeQuery, offset, catalogStatus]);
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
  useEffect(() => {
    void loadPlaces();
    return () => placesRequest.current?.abort();
  }, [token, selectedDestinationId, activeTab]);

  const filteredDestinations = useMemo(() => destinations, [destinationQuery, destinations]);

  const filteredMunicipalities = useMemo(() => municipalities, [municipalities, municipalityQuery]);

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

  const loadMunicipalityOptions = () =>
    api<Municipio[]>('/admin/municipios?options=1', {}, token).then(setMunicipalityOptions);

  const openDestination = async (destination: Destino) => {
    setIsDestinationLoading(true);
    setFeedback(null);

    try {
      const [record] = await Promise.all([
        api<Destino>(`/admin/destinos/${destination.id}`, {}, token),
        loadMunicipalityOptions(),
      ]);
      setDestinationForm(record);
    } catch (cause) {
      setFeedback({
        tone: 'error',
        text: cause instanceof Error ? cause.message : t('No se pudo abrir el destino completo'),
      });
    } finally {
      setIsDestinationLoading(false);
    }
  };

  const editEditorialItem = async (item: EditorialItem) => {
    if (item.resource === 'destinos') {
      await openDestination({ id: item.id } as Destino);
      return;
    }
    setFeedback(null);
    try {
      const record = await api<Municipio & Place & Activity & TourismType & { destinoId: string }>(
        `/admin/editorial/${item.resource}/${item.id}`,
        {},
        token,
      );
      if (item.resource === 'municipios') setMunicipalityForm(record);
      if (item.resource === 'activities') setActivityForm(record);
      if (item.resource === 'tourism-types') setTravelTypeForm(record);
      if (item.resource === 'places') {
        setSelectedDestinationId(record.destinoId);
        setPlaceForm(record);
      }
    } catch (cause) {
      setFeedback({
        tone: 'error',
        text: cause instanceof Error ? cause.message : t('No se pudo abrir el contenido'),
      });
    }
  };

  const updateDestinationList = (destination: Destino) => {
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
      setEditorialRevision((value) => value + 1);
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
      markEditorSaved(`activity:${activity?.id || 'new'}`);
      setEditorialRevision((value) => value + 1);
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
        text: activity.id ? t('Actividad actualizada') : t('Actividad creada y enviada a revisión'),
      });
    } catch (cause) {
      setFeedback({
        tone: 'error',
        text: cause instanceof Error ? cause.message : t('No se pudo guardar la actividad'),
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
        text: t('Actividad eliminada de {0} destinos', { 0: result.removedFromDestinations }),
      });
    } catch (cause) {
      setFeedback({
        tone: 'error',
        text: cause instanceof Error ? cause.message : t('No se pudo eliminar la actividad'),
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
      markEditorSaved(`tourism:${type.id || 'new'}`);
      setEditorialRevision((value) => value + 1);
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
        text: type.id
          ? t('Tipo de viaje actualizado')
          : t('Tipo de viaje creado y enviado a revisión'),
      });
    } catch (cause) {
      setFeedback({
        tone: 'error',
        text: cause instanceof Error ? cause.message : t('No se pudo guardar el tipo de viaje'),
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
        text: t('Tipo eliminado de {0} destinos', { 0: result.removedFromDestinations }),
      });
    } catch (cause) {
      setFeedback({
        tone: 'error',
        text: cause instanceof Error ? cause.message : t('No se pudo eliminar el tipo de viaje'),
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

  const moderateReview = async (
    id: string,
    patch: { status?: ReviewStatus; adminResponse?: string | null },
  ) => {
    if (!token) throw new Error(t('La sesión de administración ha expirado'));
    const previous = reviews.find((review) => review.id === id);
    if (!previous) throw new Error(t('La reseña ya no está disponible'));

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
    if (!token) throw new Error(t('La sesión de administración ha expirado'));
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
    if (!token) throw new Error(t('La sesión de administración ha expirado'));
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
          <Empty headingLevel="h1" icon={<ShieldCheck />} title={t('Acceso restringido')}>
            {t('Esta zona solo está disponible para administradores.')}
          </Empty>
        </section>
      </Shell>
    );
  }

  const resourceCounts: Record<AdminTab, number> = {
    editorial:
      serverCounts.editorial ??
      editorialItems.filter((item) => item.editorialStatus === 'pending').length,
    destinos: serverCounts.destinos ?? destinations.length,
    'tipos-viaje': serverCounts['tourism-types'] ?? travelTypes.length,
    actividades: serverCounts.activities ?? activities.length,
    municipios: serverCounts.municipios ?? municipalities.length,
    reviews: serverCounts.reviews ?? reviews.length,
    places: serverCounts.places ?? places.length,
  };

  return (
    <Shell footer={false}>
      <div className="admin-heading">
        <PageHeading title={t('Administración')}>
          <p>
            {t(
              'Gestiona destinos, tipos de viaje, actividades, municipios, lugares y reseñas sin tocar código.',
            )}
          </p>
        </PageHeading>
      </div>

      <div className="admin-layout">
        <AdminNavigation activeTab={activeTab} counts={resourceCounts} onChange={setActiveTab} />

        <section
          key={activeTab}
          className="admin-workspace"
          aria-busy={isLoading}
          id="admin-panel"
          role="tabpanel"
          aria-labelledby={`admin-tab-${activeTab}`}
        >
          {feedback && (
            <Notice tone={feedback.tone}>
              {feedback.text}
              {feedback.tone === 'error' && (
                <button
                  type="button"
                  className="button button--quiet"
                  onClick={() => {
                    setFeedback(null);
                    void loadAdminData();
                    if (activeTab === 'places') void loadPlaces();
                  }}
                >
                  {t('Reintentar')}
                </button>
              )}
            </Notice>
          )}
          {isLoading && <p role="status">{t('Cargando…')}</p>}
          <>
            {activeTab === 'editorial' && (
              <EditorialReviewPanel
                revision={editorialRevision}
                onEdit={(item) => void editEditorialItem(item)}
                onTransition={transitionEditorial}
              />
            )}
            {activeTab === 'destinos' && (
              <DestinationsPanel
                total={catalogTotal}
                status={catalogStatus}
                onStatusChange={setCatalogStatus}
                destinations={filteredDestinations}
                query={destinationQuery}
                isEditorLoading={isDestinationLoading}
                onQueryChange={setDestinationQuery}
                onCreate={() => {
                  void loadMunicipalityOptions()
                    .then(() => setDestinationForm({ ...EMPTY_DESTINATION }))
                    .catch((cause) => setFeedback({ tone: 'error', text: cause.message }));
                }}
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
                total={catalogTotal}
                status={catalogStatus}
                onStatusChange={setCatalogStatus}
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
                loading={placesLoading}
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
          {['destinos', 'municipios'].includes(activeTab) && (
            <nav className="pagination" aria-label={t('Páginas del catálogo')}>
              <button
                type="button"
                className="button button--quiet"
                disabled={offset === 0 || isLoading}
                onClick={() => setOffset((value) => Math.max(0, value - 40))}
              >
                {t('Anterior')}
              </button>
              <span>
                {t('{0} resultados', { 0: catalogTotal })} ·{' '}
                {t('Página {0}', { 0: Math.floor(offset / 40) + 1 })}
              </span>
              <button
                type="button"
                className="button button--quiet"
                disabled={offset + 40 >= catalogTotal || isLoading}
                onClick={() => setOffset((value) => value + 40)}
              >
                {t('Siguiente')}
              </button>
            </nav>
          )}
        </section>
      </div>

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
          onClose={() => setDestinationForm(null)}
        />
      )}

      {municipalityForm && (
        <MunicipalityEditorModal
          error={feedback?.tone === 'error' ? feedback.text : undefined}
          form={municipalityForm}
          isSaving={isSaving}
          onChange={setMunicipalityForm}
          onSubmit={saveMunicipality}
          onClose={() => setMunicipalityForm(null)}
        />
      )}

      {placeForm && (
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
          onConfirm={() => void deleteActivity()}
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
          onConfirm={() => void deleteTravelType()}
          onClose={() => setTravelTypeToDelete(null)}
        />
      )}
    </Shell>
  );
}
