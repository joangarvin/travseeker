import { Plus, ShieldCheck } from 'lucide-react';

interface Props {
  onCreate: () => void;
}

export default function DestinoListEmpty({ onCreate }: Props) {
  return (
    <div className="admin-empty">
      <p className="admin-empty__text">No hay destinos todavía.</p>
      <button type="button" onClick={onCreate} className="ui-btn ui-btn--primary admin-btn-new">
        <Plus className="icon-sm" />
        Crear el primero
      </button>
    </div>
  );
}

export function DestinoEditorPlaceholder({ onCreate }: Props) {
  return (
    <div className="admin-placeholder">
      <ShieldCheck className="admin-placeholder__icon" />
      <h3 className="admin-placeholder__title">Selecciona un destino</h3>
      <p className="admin-placeholder__text">
        Haz clic en un destino de la lista para editarlo, o crea uno nuevo.
      </p>
      <button type="button" onClick={onCreate} className="ui-btn ui-btn--primary admin-btn-new">
        <Plus className="icon-sm" />
        Nuevo destino
      </button>
    </div>
  );
}
