import { useEffect, useRef, useState, type DragEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { t } from '../../../i18n';
import type { CollectionDetail, ItineraryDay } from '../../../types';
import { addTripDays, getTripDuration } from '../../../utils/tripDuration';
import { optimizeItinerary, itineraryDistance } from '../../../utils/itineraryPlanner';
import { resolveItineraryDate } from '../../../utils/itineraryExport';
import { destinationFor, generateItinerary, isoDate, normalizeDays } from '../itineraryModel';

type ItineraryEditorProps = {
  collection: CollectionDetail;
  canEdit?: boolean;
  onSave?: (itinerary: ItineraryDay[], endDate?: string) => Promise<void>;
  onDirtyChange?: (dirty: boolean) => void;
  onDraftChange?: (days: ItineraryDay[]) => void;
  focusDay?: { index: number };
};

const EMPTY_ITINERARY: ItineraryDay[] = [];

export function useItineraryEditor({
  collection,
  canEdit,
  onSave,
  onDirtyChange,
  onDraftChange,
  focusDay,
}: ItineraryEditorProps) {
  const savedItinerary = collection.itinerary ?? EMPTY_ITINERARY;
  const initialDays = savedItinerary.length
    ? normalizeDays(savedItinerary, collection.startDate)
    : canEdit
      ? generateItinerary(collection)
      : [];
  const [days, setDays] = useState<ItineraryDay[]>(initialDays);
  const [searchParams] = useSearchParams();
  const requestedDay = Number(searchParams.get('day'));
  const [selectedDay, setSelectedDay] = useState(
    Number.isInteger(requestedDay) && requestedDay > 0 ? requestedDay - 1 : 0,
  );
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [addingActivity, setAddingActivity] = useState<number | null>(null);
  const [activityDraft, setActivityDraft] = useState('');
  useEffect(() => {
    if (focusDay !== undefined) {
      setSelectedDay(focusDay.index);
      setEditingDay(null);
    }
  }, [focusDay]);
  const activeDay = Math.min(selectedDay, Math.max(0, days.length - 1));
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [generationOpen, setGenerationOpen] = useState(false);
  const [previousRoute, setPreviousRoute] = useState<ItineraryDay[] | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<'info' | 'error' | 'success'>('info');
  const draggedIndex = useRef<number | null>(null);

  useEffect(() => {
    onDraftChange?.(days);
  }, [days, onDraftChange]);
  const destinationSignature = collection.items.map((item) => item.destino.id).join('|');
  useEffect(() => {
    setPreviousRoute(null);
    setDays(
      savedItinerary.length
        ? normalizeDays(savedItinerary, collection.startDate)
        : canEdit
          ? generateItinerary(collection)
          : [],
    );
  }, [savedItinerary, destinationSignature, collection.startDate, collection.endDate, canEdit]);

  const savedDays = savedItinerary.length
    ? normalizeDays(savedItinerary, collection.startDate)
    : [];
  const dirty = JSON.stringify(days) !== JSON.stringify(savedDays);
  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);
  const extendsDates = Boolean(
    collection.startDate &&
    collection.endDate &&
    days.length >
      getTripDuration({ startDate: collection.startDate, endDate: collection.endDate }).days,
  );
  const suggestedDraft = canEdit && !savedItinerary.length && days.length > 0;
  const hasDates = days.some((day) => resolveItineraryDate(day, collection));

  useEffect(() => {
    if (!dirty) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    const guardNavigation = (event: MouseEvent) => {
      const anchor = (event.target as Element)?.closest?.('a');
      if (
        !anchor ||
        anchor.target === '_blank' ||
        anchor.hasAttribute('download') ||
        anchor.getAttribute('href')?.startsWith('#')
      )
        return;
      if (!confirm(t('Hay cambios sin guardar. ¿Salir del viaje y descartarlos?'))) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener('click', guardNavigation, true);
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => {
      window.removeEventListener('beforeunload', warnBeforeLeaving);
      document.removeEventListener('click', guardNavigation, true);
    };
  }, [dirty]);

  const updateDay = (index: number, patch: Partial<ItineraryDay>) => {
    setFeedback('');
    setDays((current) =>
      normalizeDays(
        current.map((day, dayIndex) => (dayIndex === index ? { ...day, ...patch } : day)),
        collection.startDate,
      ),
    );
  };

  const moveDay = (from: number, to: number) => {
    if (to < 0 || to >= days.length || from === to) return;
    setSelectedDay(to);
    setEditingDay(to);
    setFeedback('');
    setDays((current) => {
      const reordered = [...current];
      const [moved] = reordered.splice(from, 1);
      reordered.splice(to, 0, moved);
      return normalizeDays(reordered, collection.startDate);
    });
  };

  const dropDay = (event: DragEvent<HTMLElement>, to: number) => {
    event.preventDefault();
    if (draggedIndex.current !== null) moveDay(draggedIndex.current, to);
    draggedIndex.current = null;
  };

  const addDay = () => {
    const lastDestinationId = days.at(-1)?.destinationId;
    const destination =
      (lastDestinationId ? destinationFor(collection, lastDestinationId) : undefined) ||
      collection.items[0]?.destino;
    if (!destination) return;
    setSelectedDay(days.length);
    setEditingDay(days.length);
    setFeedback('');
    setDays((current) =>
      normalizeDays(
        [
          ...current,
          {
            dayNumber: current.length + 1,
            destinationId: destination.id,
            baseMunicipioId: destination.municipios?.[0]?.id,
            plannedActivities: [],
          },
        ],
        collection.startDate,
      ),
    );
  };

  const applyRoute = (next: ItineraryDay[]) => {
    setPreviousRoute(days);
    setDays(normalizeDays(next, collection.startDate));
    setSelectedDay(0);
    setEditingDay(null);
    setAddingActivity(null);
    setFeedbackTone('info');
  };

  const autoGenerate = () => {
    setGenerationOpen(false);
    const next = generateItinerary(collection);
    applyRoute(next);
    const duration = getTripDuration({
      startDate: collection.startDate,
      endDate: collection.endDate,
      destinationCount: collection.items.length,
    });
    setFeedback(
      next.length > duration.days
        ? t(
            'Hemos añadido días para incluir todos los destinos. Al guardar se actualizará la fecha final del viaje.',
          )
        : t(
            'Estancias consecutivas y paradas ordenadas por proximidad. Revisa la propuesta antes de guardar.',
          ),
    );
  };

  const improveRoute = () => {
    const destinations = collection.items.map((item) => item.destino);
    const before = itineraryDistance(days, destinations);
    if (before === undefined) {
      setFeedbackTone('info');
      setFeedback(
        t(
          'Faltan coordenadas en algunas paradas. Selecciona una base con ubicación para poder mejorar la ruta.',
        ),
      );
      return;
    }
    const next = optimizeItinerary(days, destinations);
    const after = itineraryDistance(next, destinations)!;
    if (before - after < 0.001) {
      setFeedbackTone('info');
      setFeedback(
        t(
          'No hemos encontrado una ruta más corta manteniendo el punto de partida y las estancias.',
        ),
      );
      return;
    }
    applyRoute(
      collection.startDate ? next : next.map((day, index) => ({ ...day, date: days[index]?.date })),
    );
    setFeedback(
      `${t('Ruta mejorada:')} ≈${Math.round(before)} → ≈${Math.round(after)} km. ${t('Estimación en línea recta. Conservamos actividades, notas y bases; las fechas siguen el nuevo orden.')}`,
    );
  };

  const undoRoute = () => {
    if (!previousRoute) return;
    setDays(previousRoute);
    setPreviousRoute(null);
    setSelectedDay(0);
    setEditingDay(null);
    setAddingActivity(null);
    setFeedbackTone('info');
    setFeedback(t('Se ha recuperado el itinerario anterior.'));
  };

  const save = async () => {
    if (!onSave) return;
    setSaving(true);
    setFeedback('');
    try {
      const start = isoDate(collection.startDate);
      const alignedEndDate = start && days.length ? addTripDays(start, days.length - 1) : undefined;
      await onSave(days, alignedEndDate);
      setPreviousRoute(null);
      setFeedback(t('Itinerario guardado'));
      setFeedbackTone('success');
    } catch (cause) {
      setFeedback(cause instanceof Error ? cause.message : t('No se pudo guardar el itinerario'));
      setFeedbackTone('error');
    } finally {
      setSaving(false);
    }
  };

  return {
    days,
    setDays,
    savedItinerary,
    activeDay,
    setSelectedDay,
    editingDay,
    setEditingDay,
    addingActivity,
    setAddingActivity,
    activityDraft,
    setActivityDraft,
    draggedIndex,
    saving,
    feedback,
    setFeedback,
    feedbackTone,
    setFeedbackTone,
    generationOpen,
    setGenerationOpen,
    previousRoute,
    dirty,
    extendsDates,
    suggestedDraft,
    hasDates,
    updateDay,
    moveDay,
    dropDay,
    addDay,
    autoGenerate,
    improveRoute,
    undoRoute,
    save,
  };
}

export type ItineraryEditor = ReturnType<typeof useItineraryEditor>;
