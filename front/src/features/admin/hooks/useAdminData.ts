import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { t } from '../../../i18n';
import { api } from '../../../services/api';
import type { Activity, Destino, Municipio, Place, Review, TourismType } from '../../../types';
import type { AdminFeedback, AdminTab } from '../types';
import { readCatalogPage } from '../adminResponses';

type Options = {
  token: string | null;
  isAdmin: boolean;
  activeTab: AdminTab;
  activeQuery: string;
  offset: number;
  catalogStatus: string;
  setFeedback: Dispatch<SetStateAction<AdminFeedback | null>>;
  setReviews: Dispatch<SetStateAction<Review[]>>;
};

export function useAdminData({
  token,
  isAdmin,
  activeTab,
  activeQuery,
  offset,
  catalogStatus,
  setFeedback,
  setReviews,
}: Options) {
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [serverCounts, setServerCounts] = useState<Record<string, number>>({});
  const [placesLoading, setPlacesLoading] = useState(false);
  const placesRequest = useRef<AbortController | null>(null);
  const adminRequest = useRef<AbortController | null>(null);
  const [destinations, setDestinations] = useState<Destino[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipio[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [travelTypes, setTravelTypes] = useState<TourismType[]>([]);
  const [selectedDestinationId, setSelectedDestinationId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const refreshCounts = useCallback(async () => {
    try {
      setServerCounts(await api<Record<string, number>>('/admin/counts', {}, token));
    } catch {
      /* Panels remain usable when counts are unavailable. */
    }
  }, [token]);

  const loadAdminData = useCallback(async () => {
    if (!token || !isAdmin) return;
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
          const checked = readCatalogPage<Destino>(page);
          setDestinations(checked.items);
          setCatalogTotal(checked.total);
        }
      } else if (activeTab === 'municipios') {
        const page = await api<{ items: Municipio[]; total: number }>(
          `/admin/municipios${pageQuery}`,
          options,
          token,
        );
        if (!controller.signal.aborted) {
          const checked = readCatalogPage<Municipio>(page);
          setMunicipalities(checked.items);
          setCatalogTotal(checked.total);
        }
      } else if (activeTab === 'reviews') {
        const records = await api<Review[]>('/admin/reviews', options, token);
        if (!controller.signal.aborted) setReviews(records);
      } else if (activeTab === 'actividades') {
        const records = await api<Activity[]>('/admin/activities', options, token);
        if (!controller.signal.aborted) setActivities(records);
      } else if (activeTab === 'tipos-viaje') {
        const records = await api<TourismType[]>('/admin/tourism-types', options, token);
        if (!controller.signal.aborted) setTravelTypes(records);
      } else if (activeTab === 'places') {
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
          text:
            cause instanceof Error ? t(cause.message) : t('No se pudo cargar la administración'),
        });
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
    }
  }, [token, isAdmin, activeTab, activeQuery, offset, catalogStatus, setFeedback, setReviews]);

  const loadPlaces = useCallback(async () => {
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
  }, [token, selectedDestinationId, activeTab, setFeedback]);

  useEffect(() => {
    if (token && isAdmin) void refreshCounts();
  }, [token, isAdmin, refreshCounts]);
  useEffect(() => {
    const timer = window.setTimeout(() => void loadAdminData(), activeQuery ? 250 : 0);
    return () => {
      window.clearTimeout(timer);
      adminRequest.current?.abort();
    };
  }, [loadAdminData, activeQuery]);
  useEffect(() => {
    void loadPlaces();
    return () => placesRequest.current?.abort();
  }, [loadPlaces]);

  return {
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
    placesLoading,
    isLoading,
    catalogTotal,
    serverCounts,
    refreshCounts,
    loadAdminData,
    loadPlaces,
  };
}
