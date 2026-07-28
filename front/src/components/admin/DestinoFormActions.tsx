import { Save } from 'lucide-react';

interface Props {
  editing: boolean;
  saving: boolean;
  onCancel: () => void;
}

export default function DestinoFormActions({ editing, saving, onCancel }: Props) {
  return (
    <>
      <div className="admin-form__actions">
        {editing && (
          <button type="button" onClick={onCancel} className="ui-btn ui-btn--secondary">
            Cancelar
          </button>
        )}
        <button type="submit" disabled={saving} className="ui-btn ui-btn--primary">
          <Save className="icon-sm" />
          {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Publicar destino'}
        </button>
      </div>

      <div className="admin-form__actions-mobile safe-bottom">
        <div className="admin-form__actions-row">
          {editing && (
            <button type="button" onClick={onCancel} className="ui-btn ui-btn--secondary ui-btn--full">
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="ui-btn ui-btn--primary ui-btn--primary-grow"
          >
            <Save className="icon-sm" />
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </>
  );
}
