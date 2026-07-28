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
    <article className={`admin-dest-card${active ? ' admin-dest-card--active' : ''}`}>
      <button type="button" onClick={() => onEdit(row.id)} className="admin-dest-card__trigger">
        <div className="admin-dest-card__body">
          <div className="admin-dest-card__title-row">
            <h3 className="admin-dest-card__name">{row.nombre}</h3>
            {hasMap ? (
              <span className="admin-badge admin-badge--map">
                <MapPin className="icon-sm" /> Mapa
              </span>
            ) : (
              <span className="admin-badge admin-badge--warn">Sin mapa</span>
            )}
          </div>
          <p className="admin-dest-card__meta">
            {readStoredText(row.ubicacion)} · {readStoredText(row.presupuesto)} ·{' '}
            {row.municipios.length} municipios
          </p>
        </div>
        <ChevronRight className="admin-dest-card__chevron icon-md" />
        <Edit3 className="admin-dest-card__edit-icon icon-sm" />
      </button>

      <div className="admin-dest-card__footer">
        <p className="admin-dest-card__footer-label">Municipios en este destino</p>
        <div className="admin-dest-card__tags">
          {row.municipios.map((m) => (
            <span key={m.id} className="admin-chip admin-chip--brand">
              {m.nombre}
              <button
                type="button"
                onClick={() => onUnlinkMunicipio(row.id, m.id, m.nombre)}
                className="admin-chip__remove"
                aria-label={`Quitar ${m.nombre}`}
                title="Solo lo quita de este destino"
              >
                <Trash2 className="icon-sm" />
              </button>
            </span>
          ))}
          {row.municipios.length === 0 && (
            <span className="admin-hint-xs">Ninguno aún</span>
          )}
        </div>
        <p className="admin-dest-card__hint">
          El contenido (precios, conexiones…) se gestiona en la pestaña Municipios.
        </p>
        <button
          type="button"
          onClick={() => onDelete(row.id, row.nombre)}
          className="admin-dest-card__delete"
        >
          Eliminar destino
        </button>
      </div>
    </article>
  );
}
