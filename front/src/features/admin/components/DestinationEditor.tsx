import { useSearchParams } from 'react-router-dom';
import { markEditorSaved } from '../../../utils/editorDraft';
import { t } from '../../../i18n';
import { useState, type FormEvent } from 'react';
import {
  BookOpen,
  CalendarRange,
  CheckCircle2,
  Image as ImageIcon,
  Link2,
  ListChecks,
  MapPinned,
  Tag,
} from 'lucide-react';
import { AdminModal } from '../../../components/admin/AdminModal';
import { Button, Notice } from '../../../components/ui';
import { useActivities, useTourismTypes } from '../../../contexts';
import { api } from '../../../services/api';
import type { Activity, Destino, Municipio, Place } from '../../../types';
import type { TourismType } from '../../../types';
import { parseTagValues, plain } from '../../../utils';
import { isTourismValue, serializeTourismValues, tourismValues } from '../../tourism/tourism';
import { activityValues, serializeActivityValues } from '../../activities/activities';
import {
  DestinationContentSection,
  DestinationIdentitySection,
  DestinationImageSection,
  DestinationLocationSection,
  DestinationMunicipalitiesSection,
  DestinationSeasonSection,
} from './DestinationEditorSections';
import { ActivityEditorModal } from './ActivityEditorModal';
import { TourismTypeEditorModal } from './TourismTypeEditorModal';
import { DestinationEssentialsSection } from './DestinationEssentialsSection';
import { PlaceEditorModal } from './PlaceEditorModal';

type EditorSection =
  'identity' | 'content' | 'essentials' | 'season' | 'image' | 'location' | 'municipalities';

type EditorMessage = {
  tone: 'error' | 'success';
  text: string;
};

type DestinationEditorProps = {
  initial: Partial<Destino>;
  municipalities: Municipio[];
  token: string;
  onChange: (destination: Destino) => void;
  onActivityCreated?: (activity: Activity) => void;
  onTourismTypeCreated?: (type: TourismType) => void;
  onClose: () => void;
};

const editorSections = [
  { id: 'identity', label: t('Identidad'), Icon: Tag },
  { id: 'content', label: t('Contenido'), Icon: BookOpen },
  { id: 'essentials', label: t('Imprescindibles'), Icon: ListChecks },
  { id: 'season', label: t('Temporadas'), Icon: CalendarRange },
  { id: 'image', label: t('Portada'), Icon: ImageIcon },
  { id: 'location', label: t('Localización'), Icon: MapPinned },
  { id: 'municipalities', label: t('Municipios'), Icon: Link2 },
] as const;

function normalizeDestination(destination: Partial<Destino>): Partial<Destino> {
  const secondaryValues = parseTagValues(destination.tipoTurismoSecundario);
  return {
    ...destination,
    ubicacion: plain(destination.ubicacion),
    tipoTurismoPrincipal: serializeTourismValues([
      ...tourismValues(destination.tipoTurismoPrincipal),
      ...secondaryValues.filter(isTourismValue),
    ]),
    tipoTurismoSecundario: serializeActivityValues(activityValues(secondaryValues)),
    presupuesto: plain(destination.presupuesto),
    masificacion: plain(destination.masificacion),
  };
}

export function DestinationEditor({
  initial,
  municipalities,
  token,
  onChange,
  onActivityCreated,
  onTourismTypeCreated,
  onClose,
}: DestinationEditorProps) {
  const { refreshActivities } = useActivities();
  const { refreshTourismTypes } = useTourismTypes();
  const [form, setForm] = useState<Partial<Destino>>(() => normalizeDestination(initial));
  const [editorParams, setEditorParams] = useSearchParams();
  const requestedSection = editorParams.get('section');
  const activeSection: EditorSection = editorSections.some(
    (section) => section.id === requestedSection,
  )
    ? (requestedSection as EditorSection)
    : 'identity';
  const setActiveSection = (section: EditorSection) =>
    setEditorParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set('section', section);
        return next;
      },
      { replace: true },
    );
  const [savedVersion, setSavedVersion] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<EditorMessage | null>(null);
  const [activityDraft, setActivityDraft] = useState<Partial<Activity> | null>(null);
  const [isActivitySaving, setIsActivitySaving] = useState(false);
  const [tourismTypeDraft, setTourismTypeDraft] = useState<Partial<TourismType> | null>(null);
  const [isTourismTypeSaving, setIsTourismTypeSaving] = useState(false);
  const [placeDraft, setPlaceDraft] = useState<Partial<Place> | null>(null);
  const [placeTarget, setPlaceTarget] = useState<{ groupId: string; itemId: string } | null>(null);
  const [isPlaceSaving, setIsPlaceSaving] = useState(false);
  const associatedMunicipalities = form.municipios || [];

  const updateField = <Key extends keyof Destino>(key: Key, value: Destino[Key]) => {
    setForm((currentForm) => ({ ...currentForm, [key]: value }));
  };

  const saveDestination = async (event?: FormEvent) => {
    event?.preventDefault();
    if (isSaving) return;
    if (!plain(form.descripcion)) {
      setActiveSection('content');
      setMessage({ tone: 'error', text: t('Añade una descripción en español.') });
      return;
    }
    if (!tourismValues(form.tipoTurismoPrincipal).length) {
      setActiveSection('identity');
      setMessage({ tone: 'error', text: t('Selecciona al menos un tipo principal.') });
      return;
    }
    if (!plain(form.imprescindibles) && !form.essentialGroups?.length) {
      setActiveSection('essentials');
      setMessage({ tone: 'error', text: t('Añade al menos un imprescindible.') });
      return;
    }
    setIsSaving(true);
    setMessage(null);

    try {
      const payload = {
        ...form,
        mesesJulioAgosto: Number(form.mesesJulioAgosto),
        mesesMayJunSeptOct: Number(form.mesesMayJunSeptOct),
        mesesNovAbril: Number(form.mesesNovAbril),
        latitud: form.latitud ?? null,
        longitud: form.longitud ?? null,
      };
      const result = await api<Destino>(
        `/admin/destinos${form.id ? `/${form.id}` : ''}`,
        { method: form.id ? 'PUT' : 'POST', body: JSON.stringify(payload) },
        token,
      );

      markEditorSaved(`destination:${form.id || 'new'}`);
      setForm(result);
      setSavedVersion((value) => value + 1);
      onChange(result);
      setMessage({
        tone: 'success',
        text: form.id
          ? t('Destino actualizado')
          : t('Destino creado y enviado a revisión. Ya puedes asociar municipios.'),
      });
    } catch (cause) {
      setMessage({
        tone: 'error',
        text: cause instanceof Error ? cause.message : t('No se pudo guardar el destino'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const linkMunicipality = async (municipality: Municipio) => {
    if (!form.id) return;

    try {
      await api(
        `/admin/destinos/${form.id}/municipios`,
        { method: 'POST', body: JSON.stringify({ municipioId: municipality.id }) },
        token,
      );
      setForm((currentForm) => ({
        ...currentForm,
        municipios: [...(currentForm.municipios || []), municipality].sort((first, second) =>
          first.nombre.localeCompare(second.nombre, 'es'),
        ),
      }));
    } catch (cause) {
      setMessage({
        tone: 'error',
        text: cause instanceof Error ? cause.message : t('No se pudo asociar el municipio'),
      });
    }
  };

  const unlinkMunicipality = async (municipality: Municipio) => {
    if (!form.id) return;

    try {
      await api(
        `/admin/destinos/${form.id}/municipios/${municipality.id}`,
        { method: 'DELETE' },
        token,
      );
      setForm((currentForm) => ({
        ...currentForm,
        municipios: (currentForm.municipios || []).filter(
          (current) => current.id !== municipality.id,
        ),
      }));
    } catch (cause) {
      setMessage({
        tone: 'error',
        text: cause instanceof Error ? cause.message : t('No se pudo retirar el municipio'),
      });
    }
  };

  const changeMunicipalities = async (selectedIds: string[]) => {
    const currentIds = new Set(associatedMunicipalities.map((municipality) => municipality.id));
    const nextIds = new Set(selectedIds);
    const added = municipalities.find(
      (municipality) => nextIds.has(municipality.id) && !currentIds.has(municipality.id),
    );
    if (added) {
      await linkMunicipality(added);
      return;
    }
    const removed = associatedMunicipalities.find((municipality) => !nextIds.has(municipality.id));
    if (removed) await unlinkMunicipality(removed);
  };

  const createActivity = async (activity: Partial<Activity>) => {
    setIsActivitySaving(true);
    setMessage(null);
    try {
      const created = await api<Activity>(
        '/admin/activities',
        { method: 'POST', body: JSON.stringify(activity) },
        token,
      );
      const selectedActivities = activityValues(form.tipoTurismoSecundario);
      updateField(
        'tipoTurismoSecundario',
        serializeActivityValues([...selectedActivities, created.name]),
      );
      onActivityCreated?.(created);
      await refreshActivities();
      markEditorSaved(`activity:${activityDraft?.id || 'new'}`);
      setActivityDraft(null);
      setMessage({
        tone: 'success',
        text: t('{0} se ha creado y enviado a revisión. Queda seleccionado para este destino.', {
          0: created.name,
        }),
      });
    } catch (cause) {
      setMessage({
        tone: 'error',
        text: cause instanceof Error ? cause.message : t('No se pudo crear la actividad'),
      });
    } finally {
      setIsActivitySaving(false);
    }
  };

  const createTourismType = async (type: Partial<TourismType>) => {
    setIsTourismTypeSaving(true);
    setMessage(null);
    try {
      const created = await api<TourismType>(
        '/admin/tourism-types',
        { method: 'POST', body: JSON.stringify(type) },
        token,
      );
      updateField(
        'tipoTurismoPrincipal',
        serializeTourismValues([...tourismValues(form.tipoTurismoPrincipal), created.name]),
      );
      onTourismTypeCreated?.(created);
      await refreshTourismTypes();
      markEditorSaved(`tourism:${tourismTypeDraft?.id || 'new'}`);
      setTourismTypeDraft(null);
      setMessage({
        tone: 'success',
        text: t('{0} se ha creado y enviado a revisión. Queda seleccionado.', { 0: created.name }),
      });
    } catch (cause) {
      setMessage({
        tone: 'error',
        text: cause instanceof Error ? cause.message : t('No se pudo crear el tipo de viaje'),
      });
    } finally {
      setIsTourismTypeSaving(false);
    }
  };

  const requestEssentialPlace = ({
    groupId,
    itemId,
    place,
  }: {
    groupId: string;
    itemId: string;
    place?: Place;
  }) => {
    if (!form.id) {
      setMessage({ tone: 'error', text: t('Guarda primero el destino para situar el punto.') });
      return;
    }
    setPlaceTarget({ groupId, itemId });
    setPlaceDraft(
      place || {
        nombre: '',
        categoria: '',
        descripcion: '',
        website: '',
        sortOrder: form.places?.length || 0,
        isActive: true,
      },
    );
  };

  const saveEssentialPlace = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.id || !placeDraft || !placeTarget) return;
    setIsPlaceSaving(true);
    setMessage(null);
    try {
      const saved = await api<Place>(
        placeDraft.id ? `/admin/places/${placeDraft.id}` : `/admin/destinos/${form.id}/places`,
        {
          method: placeDraft.id ? 'PUT' : 'POST',
          body: JSON.stringify(placeDraft),
        },
        token,
      );
      setForm((current) => {
        const currentPlaces = current.places || [];
        const places = currentPlaces.some((place) => place.id === saved.id)
          ? currentPlaces.map((place) => (place.id === saved.id ? saved : place))
          : [...currentPlaces, saved];
        const essentialGroups = (current.essentialGroups || []).map((group) => ({
          ...group,
          items: group.items.map((item) => {
            if (item.placeId === saved.id) return { ...item, place: saved };
            if (group.id === placeTarget.groupId && item.id === placeTarget.itemId) {
              return { ...item, placeId: saved.id, place: saved };
            }
            return item;
          }),
        }));
        return { ...current, places, essentialGroups };
      });
      markEditorSaved(`place:${placeDraft?.id || 'new'}`);
      setPlaceDraft(null);
      setPlaceTarget(null);
      setMessage({
        tone: 'success',
        text: t('{0} se ha creado, enviado a revisión y vinculado al imprescindible.', {
          0: saved.nombre,
        }),
      });
    } catch (cause) {
      setMessage({
        tone: 'error',
        text: cause instanceof Error ? cause.message : t('No se pudo guardar la ubicación'),
      });
    } finally {
      setIsPlaceSaving(false);
    }
  };

  return (
    <>
      <AdminModal
        draft={form}
        draftKey={`destination:${initial.id || 'new'}`}
        onRestore={setForm}
        busy={isSaving || isPlaceSaving || isActivitySaving || isTourismTypeSaving}
        savedVersion={savedVersion}
        error={message?.tone === 'error' ? message.text : undefined}
        wide
        fullPage
        title={form.id ? t('Editar {0}', { 0: form.nombre }) : t('Crear un destino')}
        subtitle={t('Completa cada apartado. Puedes guardar y continuar cuando quieras.')}
        onClose={onClose}
      >
        <form className="admin-editor" onSubmit={saveDestination}>
          <nav className="admin-editor__nav" aria-label={t('Apartados del destino')} role="tablist">
            {editorSections.map(({ id, label, Icon }) => (
              <button
                type="button"
                role="tab"
                aria-selected={activeSection === id}
                className={activeSection === id ? 'is-active' : ''}
                onClick={() => setActiveSection(id)}
                key={id}
              >
                <Icon />
                <span>{t(label)}</span>
                {id === 'municipalities' && <b>{associatedMunicipalities.length}</b>}
              </button>
            ))}
          </nav>

          <div className="admin-editor__content">
            {message?.tone === 'success' && <Notice tone={message.tone}>{message.text}</Notice>}
            {activeSection === 'identity' && (
              <DestinationIdentitySection
                form={form}
                update={updateField}
                onRequestCreateActivity={(name) =>
                  setActivityDraft({ name, icon: 'Compass', sortOrder: 0, isActive: true })
                }
                onRequestCreateTourismType={() =>
                  setTourismTypeDraft({
                    name: '',
                    description: '',
                    icon: 'Compass',
                    colorKey: 'otro',
                    colorValue: '#5f6470',
                    sortOrder: 100,
                    isActive: true,
                  })
                }
              />
            )}
            {activeSection === 'content' && (
              <DestinationContentSection form={form} update={updateField} />
            )}
            {activeSection === 'essentials' && (
              <DestinationEssentialsSection
                groups={form.essentialGroups || []}
                places={form.places || []}
                destinationId={form.id}
                token={token}
                update={updateField}
                onRequestPlace={requestEssentialPlace}
              />
            )}
            {activeSection === 'season' && (
              <DestinationSeasonSection form={form} update={updateField} />
            )}
            {activeSection === 'image' && (
              <DestinationImageSection form={form} update={updateField} token={token} />
            )}
            {activeSection === 'location' && (
              <DestinationLocationSection form={form} update={updateField} />
            )}
            {activeSection === 'municipalities' && (
              <DestinationMunicipalitiesSection
                destinationId={form.id}
                allMunicipios={municipalities}
                selectedIds={associatedMunicipalities.map((municipality) => municipality.id)}
                onChange={changeMunicipalities}
              />
            )}
          </div>

          <footer className="admin-editor__footer">
            <span aria-live="polite">
              {message?.tone === 'success' && (
                <>
                  <CheckCircle2 /> {message.text}
                </>
              )}
            </span>
            <Button type="button" variant="quiet" data-close-editor="true">
              {t('Cerrar')}
            </Button>
            <Button type="submit" loading={isSaving}>
              {t('Guardar cambios')}
            </Button>
          </footer>
        </form>
      </AdminModal>
      {activityDraft && (
        <ActivityEditorModal
          initial={activityDraft}
          error={message?.tone === 'error' ? message.text : undefined}
          isSaving={isActivitySaving}
          onSave={createActivity}
          onClose={() => setActivityDraft(null)}
        />
      )}
      {tourismTypeDraft && (
        <TourismTypeEditorModal
          initial={tourismTypeDraft}
          error={message?.tone === 'error' ? message.text : undefined}
          isSaving={isTourismTypeSaving}
          onSave={createTourismType}
          onClose={() => setTourismTypeDraft(null)}
        />
      )}
      {placeDraft && (
        <PlaceEditorModal
          form={placeDraft}
          error={message?.tone === 'error' ? message.text : undefined}
          isSaving={isPlaceSaving}
          onChange={setPlaceDraft}
          onSubmit={saveEssentialPlace}
          onClose={() => {
            setPlaceDraft(null);
            setPlaceTarget(null);
          }}
        />
      )}
    </>
  );
}
