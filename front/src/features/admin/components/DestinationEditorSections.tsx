import { CoordinatePicker } from '../../../components/admin/CoordinatePicker';
import { MunicipioCombobox } from '../../../components/admin/MunicipioCombobox';
import { Field, ImageUploader, Notice } from '../../../components/ui';
import type { Destino, Municipio } from '../../../types';
import { plain } from '../../../utils';
import { TourismMultiSelect } from '../../tourism/TourismMultiSelect';
import { serializeTourismValues } from '../../tourism/tourism';
import { ActivityMultiSelect } from '../../activities/ActivityMultiSelect';
import { serializeActivityValues } from '../../activities/activities';

export type DestinationUpdater = <Key extends keyof Destino>(key: Key, value: Destino[Key]) => void;

type DestinationSectionProps = {
  form: Partial<Destino>;
  update: DestinationUpdater;
};

type DestinationIdentitySectionProps = DestinationSectionProps & {
  onRequestCreateActivity?: (name: string) => void;
  onRequestCreateTourismType?: () => void;
};

const BUDGET_OPTIONS = ['Bajo', 'Medio-Bajo', 'Medio', 'Medio-Alto', 'Alto'];
const CROWD_OPTIONS = ['Leve', 'Bajo', 'Medio-Bajo', 'Medio', 'Medio-Alto', 'Alto'];

export function DestinationIdentitySection({
  form,
  update,
  onRequestCreateActivity,
  onRequestCreateTourismType,
}: DestinationIdentitySectionProps) {
  return (
    <section className="editor-section" aria-labelledby="editor-identity">
      <SectionHeading
        number="01"
        id="editor-identity"
        title="Identidad y clasificación"
        description="Cómo se llama, dónde está y qué clase de experiencia propone."
      />

      <div className="form-grid">
        <Field label="Nombre del destino" htmlFor="admin-name">
          <input
            id="admin-name"
            value={form.nombre || ''}
            onChange={(event) => update('nombre', event.target.value)}
            required
          />
        </Field>
        <Field label="Zona o región" htmlFor="admin-location">
          <input
            id="admin-location"
            value={form.ubicacion || ''}
            onChange={(event) => update('ubicacion', event.target.value)}
            required
            placeholder="Navarra · Interior"
          />
        </Field>
        <TourismMultiSelect
          id="admin-type"
          label="Tipos de viaje"
          value={form.tipoTurismoPrincipal}
          hint="Selecciona una o varias formas de viaje que definan el destino."
          required
          onRequestCreate={onRequestCreateTourismType}
          onChange={(values) => update('tipoTurismoPrincipal', serializeTourismValues(values))}
        />
        <ActivityMultiSelect
          id="admin-activities"
          label="Actividades"
          value={form.tipoTurismoSecundario}
          hint="Opcional. Selecciona actividades del catálogo. Si falta una, créala con su icono."
          onRequestCreate={onRequestCreateActivity}
          onChange={(values) => update('tipoTurismoSecundario', serializeActivityValues(values))}
        />
        <SelectField
          id="admin-budget"
          label="Presupuesto"
          value={form.presupuesto}
          options={BUDGET_OPTIONS}
          onChange={(value) => update('presupuesto', value)}
        />
        <SelectField
          id="admin-crowd"
          label="Afluencia general"
          value={form.masificacion}
          options={CROWD_OPTIONS}
          onChange={(value) => update('masificacion', value)}
        />
      </div>

      <Field
        label="Etiqueta interna o agrupación"
        htmlFor="admin-item"
        hint="Opcional. Úsala para ordenar o agrupar destinos internamente."
      >
        <input
          id="admin-item"
          value={form.destinosItem || ''}
          onChange={(event) => update('destinosItem', event.target.value)}
        />
      </Field>
    </section>
  );
}

export function DestinationContentSection({ form, update }: DestinationSectionProps) {
  return (
    <section className="editor-section" aria-labelledby="editor-content">
      <SectionHeading
        number="02"
        id="editor-content"
        title="Texto y contenido"
        description="Escribe para ayudar a decidir, no para vender el destino."
      />
      <Field
        label="Descripción"
        htmlFor="admin-description"
        hint="Puedes usar párrafos, listas y texto en negrita."
      >
        <textarea
          id="admin-description"
          className="editor-textarea"
          value={form.descripcion || ''}
          onChange={(event) => update('descripcion', event.target.value)}
          required
        />
      </Field>
    </section>
  );
}

const SEASONS = [
  ['mesesNovAbril', 'Noviembre — abril'],
  ['mesesMayJunSeptOct', 'Mayo — junio / septiembre — octubre'],
  ['mesesJulioAgosto', 'Julio — agosto'],
] as const;

export function DestinationSeasonSection({ form, update }: DestinationSectionProps) {
  return (
    <section className="editor-section" aria-labelledby="editor-season">
      <SectionHeading
        number="04"
        id="editor-season"
        title="Afluencia por temporada"
        description="0 significa muy tranquilo; 100, máxima ocupación."
      />
      <div className="season-editor">
        {SEASONS.map(([key, label]) => (
          <label key={key}>
            <span>
              <b>{label}</b>
              <output>{Number(form[key] || 0)}%</output>
            </span>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={Number(form[key] || 0)}
              onChange={(event) => update(key, Number(event.target.value))}
            />
          </label>
        ))}
      </div>
    </section>
  );
}

type DestinationImageSectionProps = DestinationSectionProps & {
  token: string;
};

export function DestinationImageSection({ form, update, token }: DestinationImageSectionProps) {
  return (
    <section className="editor-section" aria-labelledby="editor-image">
      <SectionHeading
        number="05"
        id="editor-image"
        title="Imagen de portada"
        description="Sube el archivo directamente o pega una URL existente."
      />
      <ImageUploader
        id="destination-cover"
        label="Portada del destino"
        value={form.imagen}
        token={token}
        endpoint="/upload/destino"
        extraData={form.id ? { destinoId: form.id } : undefined}
        onChange={(url) => update('imagen', url)}
      />
      <Field
        label="URL de la imagen"
        htmlFor="admin-image"
        hint="Se actualiza automáticamente cuando subes un archivo."
      >
        <input
          id="admin-image"
          type="url"
          value={form.imagen || ''}
          onChange={(event) => update('imagen', event.target.value)}
          required
        />
      </Field>
    </section>
  );
}

export function DestinationLocationSection({ form, update }: DestinationSectionProps) {
  return (
    <section className="editor-section" aria-labelledby="editor-map">
      <SectionHeading
        number="06"
        id="editor-map"
        title="Punto en el mapa"
        description="Haz clic en la localización aproximada y ajusta las coordenadas si hace falta."
      />
      <CoordinatePicker
        latitude={form.latitud}
        longitude={form.longitud}
        onChange={(latitude, longitude) => {
          update('latitud', latitude);
          update('longitud', longitude);
        }}
      />
      <div className="form-grid">
        <CoordinateField
          id="admin-lat"
          label="Latitud"
          value={form.latitud}
          min={-90}
          max={90}
          onChange={(value) => update('latitud', value)}
        />
        <CoordinateField
          id="admin-lng"
          label="Longitud"
          value={form.longitud}
          min={-180}
          max={180}
          onChange={(value) => update('longitud', value)}
        />
      </div>
    </section>
  );
}

type DestinationMunicipalitiesSectionProps = {
  destinationId?: string;
  allMunicipios: Municipio[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void | Promise<void>;
};

export function DestinationMunicipalitiesSection({
  destinationId,
  allMunicipios,
  selectedIds,
  onChange,
}: DestinationMunicipalitiesSectionProps) {
  return (
    <section className="editor-section" aria-labelledby="editor-municipalities">
      <SectionHeading
        number="07"
        id="editor-municipalities"
        title="Municipios asociados"
        description="Estos municipios aparecerán en la ficha pública del destino."
      />

      {!destinationId ? (
        <Notice>Guarda primero el destino para poder asociar municipios.</Notice>
      ) : (
        <MunicipioCombobox
          allMunicipios={allMunicipios}
          selectedIds={selectedIds}
          onChange={onChange}
        />
      )}
    </section>
  );
}

type SectionHeadingProps = {
  number: string;
  id: string;
  title: string;
  description: string;
};

export function SectionHeading({ number, id, title, description }: SectionHeadingProps) {
  return (
    <header>
      <span>{number}</span>
      <div>
        <h3 id={id}>{title}</h3>
        <p>{description}</p>
      </div>
    </header>
  );
}

type SelectFieldProps = {
  id: string;
  label: string;
  value?: string | null;
  options: string[];
  onChange: (value: string) => void;
};

function SelectField({ id, label, value, options, onChange }: SelectFieldProps) {
  return (
    <Field label={label} htmlFor={id}>
      <select
        id={id}
        value={plain(value)}
        onChange={(event) => onChange(event.target.value)}
        required
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </Field>
  );
}

type CoordinateFieldProps = {
  id: string;
  label: string;
  value?: number | null;
  min: number;
  max: number;
  onChange: (value: number | null) => void;
};

function CoordinateField({ id, label, value, min, max, onChange }: CoordinateFieldProps) {
  return (
    <Field label={label} htmlFor={id}>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        step="any"
        value={value ?? ''}
        onChange={(event) =>
          onChange(event.target.value === '' ? null : Number(event.target.value))
        }
      />
    </Field>
  );
}
