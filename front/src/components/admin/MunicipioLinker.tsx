import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { AdminMunicipio } from '../../types/admin';
import { adminInputClass } from './AdminField';

interface Props {
  linked: { id: string; nombre: string }[];
  catalog: AdminMunicipio[];
  linking: boolean;
  onLink: (municipioId: string) => void;
  onUnlink: (municipioId: string, nombre: string) => void;
  onGoToCatalog: () => void;
}

export default function MunicipioLinker({
  linked,
  catalog,
  linking,
  onLink,
  onUnlink,
  onGoToCatalog,
}: Props) {
  const [query, setQuery] = useState('');
  const linkedIds = useMemo(() => new Set(linked.map((m) => m.id)), [linked]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog
      .filter((m) => !linkedIds.has(m.id))
      .filter((m) => !q || m.nombre.toLowerCase().includes(q))
      .slice(0, 8);
  }, [catalog, linkedIds, query]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-muted)]">
        Elige municipios del catálogo. Para crear o cambiar precios y conexiones, ve a la pestaña
        Municipios.
      </p>

      <button
        type="button"
        onClick={onGoToCatalog}
        className="text-sm font-semibold text-[var(--color-brand-dark)] hover:underline"
      >
        Crear o editar municipios →
      </button>

      <div className="flex flex-wrap gap-1.5">
        {linked.map((m) => (
          <span
            key={m.id}
            className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-full bg-[var(--color-secondary)] text-xs text-[var(--color-primary)]"
          >
            {m.nombre}
            <button
              type="button"
              onClick={() => onUnlink(m.id, m.nombre)}
              className="p-1 rounded-full text-[var(--color-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
              aria-label={`Quitar ${m.nombre} de este destino`}
              title="Solo lo quita de este destino"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </span>
        ))}
        {linked.length === 0 && (
          <span className="text-xs text-[var(--color-muted)]">Ninguno en este destino aún</span>
        )}
      </div>

      <div className="space-y-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar municipio para añadir…"
          className={adminInputClass}
        />
        {suggestions.length > 0 ? (
          <ul className="rounded-xl border border-[var(--color-border)] divide-y divide-[var(--color-border)] overflow-hidden">
            {suggestions.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  disabled={linking}
                  onClick={() => {
                    onLink(m.id);
                    setQuery('');
                  }}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-sm hover:bg-[var(--color-secondary)] disabled:opacity-50"
                >
                  <span className="text-[var(--color-primary)] font-medium truncate">{m.nombre}</span>
                  <span className="inline-flex items-center gap-1 text-[var(--color-brand-dark)] shrink-0">
                    <Plus className="w-4 h-4" />
                    Añadir
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : query.trim() ? (
          <p className="text-xs text-[var(--color-muted)]">
            No hay coincidencias libres. Créalo en la pestaña Municipios.
          </p>
        ) : catalog.filter((m) => !linkedIds.has(m.id)).length === 0 ? (
          <p className="text-xs text-[var(--color-muted)]">
            Todos los municipios del catálogo ya están en este destino, o el catálogo está vacío.
          </p>
        ) : null}
      </div>
    </div>
  );
}
