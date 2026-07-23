import { ChevronRight, Edit3, MapPin, Trash2 } from 'lucide-react';
import type { AdminDestinoRow } from '../../types/admin';
import { readStoredText } from '../../utils/admin/storedText';

interface Props {
  row: AdminDestinoRow;
  active: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string, nombre: string) => void;
  onUnlinkMunicipio: (destinoId: string, municipioId: string, nombre: string) => void;
}

export default function DestinoListItem({
  row,
  active,
  onEdit,
  onDelete,
  onUnlinkMunicipio,
}: Props) {
  const hasMap = row.latitud != null && row.longitud != null;

  return (
    <article
      className={`rounded-2xl border bg-[var(--color-surface)] overflow-hidden transition-shadow ${
        active
          ? 'border-[var(--color-brand)] shadow-md ring-1 ring-[var(--color-brand)]/20'
          : 'border-[var(--color-border)]'
      }`}
    >
      <button
        type="button"
        onClick={() => onEdit(row.id)}
        className="w-full text-left p-4 flex items-start gap-3 hover:bg-[var(--color-secondary)]/50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-[var(--color-primary)] truncate">{row.nombre}</h3>
            {hasMap ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--color-brand)]/15 text-[var(--color-brand-dark)]">
                <MapPin className="w-3 h-3" /> Mapa
              </span>
            ) : (
              <span className="text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400">
                Sin mapa
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">
            {readStoredText(row.ubicacion)} · {readStoredText(row.presupuesto)} ·{' '}
            {row.municipios.length} municipios
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-[var(--color-muted)] shrink-0 mt-0.5 lg:hidden" />
        <Edit3 className="w-4 h-4 text-[var(--color-muted)] shrink-0 mt-1 hidden lg:block" />
      </button>

      <div className="px-4 pb-4 border-t border-[var(--color-border)] pt-3 space-y-2">
        <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">
          Municipios en este destino
        </p>
        <div className="flex flex-wrap gap-1.5">
          {row.municipios.map((m) => (
            <span
              key={m.id}
              className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-full bg-[var(--color-secondary)] text-xs text-[var(--color-primary)]"
            >
              {m.nombre}
              <button
                type="button"
                onClick={() => onUnlinkMunicipio(row.id, m.id, m.nombre)}
                className="p-1 rounded-full text-[var(--color-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
                aria-label={`Quitar ${m.nombre}`}
                title="Solo lo quita de este destino"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </span>
          ))}
          {row.municipios.length === 0 && (
            <span className="text-xs text-[var(--color-muted)]">Ninguno aún</span>
          )}
        </div>
        <p className="text-xs text-[var(--color-muted)]">
          El contenido (precios, conexiones…) se gestiona en la pestaña Municipios.
        </p>
        <button
          type="button"
          onClick={() => onDelete(row.id, row.nombre)}
          className="text-xs text-[var(--color-danger)] hover:underline mt-1"
        >
          Eliminar destino
        </button>
      </div>
    </article>
  );
}
