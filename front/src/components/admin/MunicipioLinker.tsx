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
    <div className="admin-linker">
      <p className="admin-form__muted">
        Elige municipios del catálogo. Para crear o cambiar precios y conexiones, ve a la pestaña
        Municipios.
      </p>

      <button type="button" onClick={onGoToCatalog} className="admin-linker__link">
        Crear o editar municipios →
      </button>

      <div className="admin-dest-card__tags">
        {linked.map((m) => (
          <span key={m.id} className="admin-chip admin-chip--muted">
            {m.nombre}
            <button
              type="button"
              onClick={() => onUnlink(m.id, m.nombre)}
              className="admin-chip__remove"
              aria-label={`Quitar ${m.nombre} de este destino`}
              title="Solo lo quita de este destino"
            >
              <Trash2 className="icon-sm" />
            </button>
          </span>
        ))}
        {linked.length === 0 && (
          <span className="admin-hint-xs">Ninguno en este destino aún</span>
        )}
      </div>

      <div className="admin-field">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar municipio para añadir…"
          className={adminInputClass}
        />
        {suggestions.length > 0 ? (
          <ul className="admin-suggest-list">
            {suggestions.map((m) => (
              <li key={m.id} className="admin-suggest-list__item">
                <button
                  type="button"
                  disabled={linking}
                  onClick={() => {
                    onLink(m.id);
                    setQuery('');
                  }}
                  className="admin-suggest-list__btn"
                >
                  <span className="admin-suggest-list__name">{m.nombre}</span>
                  <span className="admin-suggest-list__action">
                    <Plus className="icon-sm" />
                    Añadir
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : query.trim() ? (
          <p className="admin-hint-xs">
            No hay coincidencias libres. Créalo en la pestaña Municipios.
          </p>
        ) : catalog.filter((m) => !linkedIds.has(m.id)).length === 0 ? (
          <p className="admin-hint-xs">
            Todos los municipios del catálogo ya están en este destino, o el catálogo está vacío.
          </p>
        ) : null}
      </div>
    </div>
  );
}
