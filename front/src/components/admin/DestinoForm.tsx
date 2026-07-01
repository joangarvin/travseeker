import { useMemo } from 'react';
import {
  BookOpen,
  Image as ImageIcon,
  MapPinned,
  Sparkles,
  Tags,
  X,
} from 'lucide-react';
import { TURISMO_OPTIONS, UBICACION_SUGGESTIONS } from '../../constants/admin';
import type { DestinoFormState } from '../../types/admin';
import { masificacionOptions, presupuestoOptions } from '../../utils/admin/destinoForm';
import { getImageUrl } from '../../utils/images';
import AdminField, { adminInputClass, adminTextareaClass } from './AdminField';
import AdminSectionCard from './AdminSectionCard';
import AdminSelect from './AdminSelect';
import DestinoFormActions from './DestinoFormActions';
import ImprescindiblesEditor from './ImprescindiblesEditor';
import LocationPickerMap from './LocationPickerMap';
import SeasonPicker from './SeasonPicker';

interface Props {
  form: DestinoFormState;
  editingId: string | null;
  saving: boolean;
  loading?: boolean;
  onChange: (form: DestinoFormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export default function DestinoForm({
  form,
  editingId,
  saving,
  loading = false,
  onChange,
  onSubmit,
  onCancel,
}: Props) {
  const patch = (partial: Partial<DestinoFormState>) => onChange({ ...form, ...partial });

  const imagePreview = useMemo(
    () => getImageUrl(form.imagen, form.nombre.length),
    [form.imagen, form.nombre],
  );

  return (
    <form onSubmit={onSubmit} className="space-y-4 pb-24 lg:pb-4">
      {loading && (
        <p className="text-sm text-[var(--color-muted)] rounded-xl bg-[var(--color-secondary)] px-4 py-3">
          Cargando datos del destino…
        </p>
      )}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-[var(--color-primary)]">
            {editingId ? 'Editar destino' : 'Nuevo destino'}
          </h2>
          <p className="text-sm text-[var(--color-muted)]">
            Rellena los campos como si fuera un documento. Los marcados con * son obligatorios.
          </p>
        </div>
        {editingId && (
          <button
            type="button"
            onClick={onCancel}
            className="lg:hidden inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-primary)] px-3 py-2 rounded-lg"
          >
            <X className="w-4 h-4" />
            Volver
          </button>
        )}
      </div>

      <AdminSectionCard
        icon={Sparkles}
        title="Lo esencial"
        description="Nombre y datos que verá el visitante de un vistazo."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label="Nombre del destino" required hint="Ej: Costa del Sol, Pirineo Aragonés…">
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => patch({ nombre: e.target.value })}
              placeholder="Escribe el nombre"
              className={adminInputClass}
              required
            />
          </AdminField>

          <AdminField label="Zona o región" required hint="Dónde se encuentra dentro de España.">
            <input
              type="text"
              list="ubicacion-sugerencias"
              value={form.ubicacion}
              onChange={(e) => patch({ ubicacion: e.target.value })}
              placeholder="Ej: Andalucía, Costa, Islas…"
              className={adminInputClass}
              required
            />
            <datalist id="ubicacion-sugerencias">
              {UBICACION_SUGGESTIONS.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </AdminField>
        </div>
      </AdminSectionCard>

      <AdminSectionCard
        icon={Tags}
        title="Cómo es el destino"
        description="Elige opciones de las listas. Así los filtros de la web funcionan mejor."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label="Presupuesto medio" required>
            <AdminSelect
              value={form.presupuesto}
              options={presupuestoOptions()}
              onChange={(presupuesto) => patch({ presupuesto })}
              required
            />
          </AdminField>

          <AdminField label="Nivel de masificación" required>
            <AdminSelect
              value={form.masificacion}
              options={masificacionOptions()}
              onChange={(masificacion) => patch({ masificacion })}
              required
            />
          </AdminField>

          <AdminField label="Tipo de turismo principal" required>
            <AdminSelect
              value={form.tipoTurismoPrincipal}
              options={TURISMO_OPTIONS}
              onChange={(tipoTurismoPrincipal) => patch({ tipoTurismoPrincipal })}
              required
            />
          </AdminField>

          <AdminField label="Tipo de turismo secundario" required>
            <AdminSelect
              value={form.tipoTurismoSecundario}
              options={TURISMO_OPTIONS}
              onChange={(tipoTurismoSecundario) => patch({ tipoTurismoSecundario })}
              required
            />
          </AdminField>
        </div>
      </AdminSectionCard>

      <AdminSectionCard
        icon={BookOpen}
        title="Descripción"
        description="Cuéntalo con tus palabras. Puedes usar párrafos separados por una línea en blanco."
      >
        <AdminField
          label="Texto principal"
          required
          hint="Escribe como en Word: un párrafo, línea en blanco, otro párrafo…"
        >
          <textarea
            value={form.descripcion}
            onChange={(e) => patch({ descripcion: e.target.value })}
            rows={8}
            placeholder="Describe el destino: paisaje, ambiente, para quién es ideal…"
            className={`${adminTextareaClass} min-h-[200px]`}
            required
          />
        </AdminField>
      </AdminSectionCard>

      <AdminSectionCard
        icon={Sparkles}
        title="Imprescindibles"
        description="Organiza las recomendaciones por categorías y añade puntos uno a uno."
      >
        <ImprescindiblesEditor
          sections={form.imprescindiblesSections}
          onChange={(imprescindiblesSections) => patch({ imprescindiblesSections })}
        />
      </AdminSectionCard>

      <AdminSectionCard
        icon={ImageIcon}
        title="Imagen de portada"
        description="Pega el enlace de una foto. Si no tienes, puedes usar una de Unsplash."
      >
        <AdminField
          label="Enlace de la imagen"
          required
          hint="Clic derecho en una foto → «Copiar dirección de imagen» y pégala aquí."
        >
          <input
            type="text"
            value={form.imagen}
            onChange={(e) => patch({ imagen: e.target.value })}
            placeholder="https://… o enlace de imagen existente"
            className={adminInputClass}
            required
          />
        </AdminField>
        {form.imagen && (
          <div className="rounded-xl overflow-hidden border border-[var(--color-border)] aspect-[16/9] max-h-48 bg-[var(--color-secondary)]">
            <img src={imagePreview} alt="Vista previa" className="w-full h-full object-cover" />
          </div>
        )}
      </AdminSectionCard>

      <AdminSectionCard
        icon={MapPinned}
        title="Temporadas y mapa"
        description="Indica cuándo hay más gente y marca el destino en el mapa."
      >
        <SeasonPicker
          verano={form.mesesJulioAgosto}
          media={form.mesesMayJunSeptOct}
          baja={form.mesesNovAbril}
          onChange={(key, value) => patch({ [key]: value })}
        />
        <LocationPickerMap
          lat={form.latitud}
          lng={form.longitud}
          onChange={(lat, lng) => patch({ latitud: lat, longitud: lng })}
        />
      </AdminSectionCard>

      <DestinoFormActions
        editing={Boolean(editingId)}
        saving={saving || loading}
        onCancel={onCancel}
      />
    </form>
  );
}
