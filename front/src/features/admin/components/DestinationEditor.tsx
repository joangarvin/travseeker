import { useMemo, useState, type FormEvent } from 'react';
import {
  BookOpen,
  CalendarRange,
  CheckCircle2,
  Image as ImageIcon,
  Link2,
  MapPinned,
  Tag,
} from 'lucide-react';
import { AdminModal } from '../../../components/admin/AdminModal';
import { Button, Notice } from '../../../components/ui';
import { api } from '../../../services/api';
import type { Destino, Municipio } from '../../../types';
import { plain } from '../../../utils';
import {
  DestinationContentSection,
  DestinationIdentitySection,
  DestinationImageSection,
  DestinationLocationSection,
  DestinationMunicipalitiesSection,
  DestinationSeasonSection,
} from './DestinationEditorSections';

type EditorSection = 'identity' | 'content' | 'season' | 'image' | 'location' | 'municipalities';

type EditorMessage = {
  tone: 'error' | 'success';
  text: string;
};

type DestinationEditorProps = {
  initial: Partial<Destino>;
  municipalities: Municipio[];
  token: string;
  onChange: (destination: Destino) => void;
  onClose: () => void;
};

const editorSections = [
  { id: 'identity', label: 'Identidad', Icon: Tag },
  { id: 'content', label: 'Contenido', Icon: BookOpen },
  { id: 'season', label: 'Temporadas', Icon: CalendarRange },
  { id: 'image', label: 'Portada', Icon: ImageIcon },
  { id: 'location', label: 'Localización', Icon: MapPinned },
  { id: 'municipalities', label: 'Municipios', Icon: Link2 },
] as const;

function normalizeDestination(destination: Partial<Destino>): Partial<Destino> {
  return {
    ...destination,
    ubicacion: plain(destination.ubicacion),
    tipoTurismoPrincipal: plain(destination.tipoTurismoPrincipal),
    tipoTurismoSecundario: plain(destination.tipoTurismoSecundario),
    presupuesto: plain(destination.presupuesto),
    masificacion: plain(destination.masificacion),
  };
}

export function DestinationEditor({
  initial,
  municipalities,
  token,
  onChange,
  onClose,
}: DestinationEditorProps) {
  const [form, setForm] = useState<Partial<Destino>>(() => normalizeDestination(initial));
  const [activeSection, setActiveSection] = useState<EditorSection>('identity');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<EditorMessage | null>(null);
  const [municipalityQuery, setMunicipalityQuery] = useState('');
  const associatedMunicipalities = form.municipios || [];

  const municipalityCandidates = useMemo(
    () =>
      municipalities
        .filter(
          (municipality) =>
            !associatedMunicipalities.some((current) => current.id === municipality.id) &&
            municipality.nombre.toLowerCase().includes(municipalityQuery.toLowerCase()),
        )
        .slice(0, 30),
    [associatedMunicipalities, municipalities, municipalityQuery],
  );

  const updateField = <Key extends keyof Destino>(key: Key, value: Destino[Key]) => {
    setForm((currentForm) => ({ ...currentForm, [key]: value }));
  };

  const saveDestination = async (event?: FormEvent) => {
    event?.preventDefault();
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

      setForm(result);
      onChange(result);
      setMessage({
        tone: 'success',
        text: form.id ? 'Destino actualizado' : 'Destino creado. Ya puedes asociar municipios.',
      });
    } catch (cause) {
      setMessage({
        tone: 'error',
        text: cause instanceof Error ? cause.message : 'No se pudo guardar el destino',
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
        text: cause instanceof Error ? cause.message : 'No se pudo asociar el municipio',
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
        text: cause instanceof Error ? cause.message : 'No se pudo retirar el municipio',
      });
    }
  };

  return (
    <AdminModal
      wide
      title={form.id ? `Editar ${form.nombre}` : 'Crear un destino'}
      subtitle="Completa cada apartado. Puedes guardar y continuar cuando quieras."
      onClose={onClose}
    >
      <form className="admin-editor" onSubmit={saveDestination}>
        <nav className="admin-editor__nav" aria-label="Apartados del destino" role="tablist">
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
              <span>{label}</span>
              {id === 'municipalities' && <b>{associatedMunicipalities.length}</b>}
            </button>
          ))}
        </nav>

        <div className="admin-editor__content">
          {message && <Notice tone={message.tone}>{message.text}</Notice>}
          {activeSection === 'identity' && (
            <DestinationIdentitySection form={form} update={updateField} />
          )}
          {activeSection === 'content' && (
            <DestinationContentSection form={form} update={updateField} />
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
              associated={associatedMunicipalities}
              candidates={municipalityCandidates}
              municipalityCount={municipalities.length}
              query={municipalityQuery}
              onQueryChange={setMunicipalityQuery}
              onLink={(municipality) => void linkMunicipality(municipality)}
              onUnlink={(municipality) => void unlinkMunicipality(municipality)}
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
          <Button type="button" variant="quiet" onClick={onClose}>
            Cerrar
          </Button>
          <Button type="submit" loading={isSaving}>
            Guardar cambios
          </Button>
        </footer>
      </form>
    </AdminModal>
  );
}
