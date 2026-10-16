import { useState, type Dispatch, type SetStateAction } from 'react';
import { t } from '../../../i18n';
import { api } from '../../../services/api';
import { markEditorSaved } from '../../../utils/editorDraft';
import { activityValues } from '../../activities/activities';
import { tourismValues } from '../../tourism/tourism';
import type { Activity, Destino, TourismType } from '../../../types';
import type { AdminFeedback } from '../types';
import type { EditorialItem } from '../components/EditorialReviewPanel';

type Options = {
  token: string | null;
  activities: Activity[];
  setActivities: Dispatch<SetStateAction<Activity[]>>;
  travelTypes: TourismType[];
  setTravelTypes: Dispatch<SetStateAction<TourismType[]>>;
  setDestinations: Dispatch<SetStateAction<Destino[]>>;
  setEditorialItems: Dispatch<SetStateAction<EditorialItem[]>>;
  setEditorialRevision: Dispatch<SetStateAction<number>>;
  setFeedback: Dispatch<SetStateAction<AdminFeedback | null>>;
  setIsSaving: Dispatch<SetStateAction<boolean>>;
  refreshActivities: () => Promise<void>;
  refreshTourismTypes: () => Promise<void>;
};

export function useAdminTaxonomies({
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
}: Options) {
  const [activityForm, setActivityForm] = useState<Partial<Activity> | null>(null);
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null);
  const [travelTypeForm, setTravelTypeForm] = useState<Partial<TourismType> | null>(null);
  const [travelTypeToDelete, setTravelTypeToDelete] = useState<TourismType | null>(null);

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

  return {
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
  };
}
