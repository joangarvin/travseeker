import type { useAdminMunicipios } from '../../hooks/useAdminMunicipios';
import type { useAdminPanel } from '../../hooks/useAdminPanel';
import type { AdminMunicipio, AdminTab } from '../../types/admin';
import AdminAlert from './AdminAlert';
import DestinoForm from './DestinoForm';
import { DestinoEditorPlaceholder } from './DestinoListEmpty';
import DestinoList from './DestinoList';
import { MunicipioCatalogForm, MunicipioCatalogList } from './MunicipioCatalog';

type DestinoState = ReturnType<typeof useAdminPanel>;
type MunicipioState = ReturnType<typeof useAdminMunicipios>;

interface Props {
  tab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  destinos: DestinoState;
  municipios: MunicipioState;
  catalog: AdminMunicipio[];
}

export default function AdminWorkspace({
  tab,
  onTabChange,
  destinos,
  municipios,
  catalog,
}: Props) {
  const error = tab === 'destinos' ? destinos.error : municipios.error;
  const success = tab === 'destinos' ? destinos.success : municipios.success;

  const destinoFormProps = {
    form: destinos.form,
    editingId: destinos.editingId,
    saving: destinos.saving,
    loading: destinos.loadingEditId !== null,
    onChange: destinos.setForm,
    onSubmit: destinos.saveDestino,
    onCancel: destinos.cancelForm,
    municipioLinker: destinos.editingId
      ? {
          linked: destinos.linkedMunicipios,
          catalog,
          linking: destinos.linkingMunicipio,
          onLink: destinos.linkMunicipio,
          onUnlink: destinos.unlinkMunicipio,
          onGoToCatalog: () => onTabChange('municipios'),
        }
      : null,
  };

  const editingMunicipio = municipios.editingId
    ? municipios.rows.find((m) => m.id === municipios.editingId)
    : undefined;

  return (
    <section className="admin-workspace">
      {(error || success) && (
        <div className="admin-workspace__alerts">
          {error && <AdminAlert message={error} variant="error" />}
          {success && <AdminAlert message={success} variant="success" />}
        </div>
      )}

      {tab === 'destinos' && (
        <>
          <div className="admin-workspace__mobile">
            {!destinos.showForm && (
              <DestinoList
                rows={destinos.filtered}
                loading={destinos.loading}
                query={destinos.query}
                editingId={destinos.editingId}
                hiddenOnMobile={false}
                onQueryChange={destinos.setQuery}
                onCreate={destinos.openCreate}
                onEdit={destinos.openEdit}
                onDelete={destinos.removeDestino}
                onUnlinkMunicipio={destinos.unlinkMunicipioFromDestino}
              />
            )}
            {destinos.showForm && <DestinoForm {...destinoFormProps} />}
          </div>

          <div className="admin-workspace__split">
            <aside className="admin-workspace__aside admin-panel-scroll" aria-label="Lista de destinos">
              <DestinoList
                rows={destinos.filtered}
                loading={destinos.loading}
                query={destinos.query}
                editingId={destinos.editingId}
                hiddenOnMobile={false}
                onQueryChange={destinos.setQuery}
                onCreate={destinos.openCreate}
                onEdit={destinos.openEdit}
                onDelete={destinos.removeDestino}
                onUnlinkMunicipio={destinos.unlinkMunicipioFromDestino}
              />
            </aside>

            <main className="admin-workspace__main admin-panel-scroll" aria-label="Editor de destino">
              {destinos.editorOpen ? (
                <DestinoForm {...destinoFormProps} />
              ) : (
                <DestinoEditorPlaceholder onCreate={destinos.openCreate} />
              )}
            </main>
          </div>
        </>
      )}

      {tab === 'municipios' && (
        <>
          <div className="admin-workspace__mobile">
            {!municipios.showForm && (
              <MunicipioCatalogList
                rows={municipios.filtered}
                loading={municipios.loading}
                query={municipios.query}
                editingId={municipios.editingId}
                onQueryChange={municipios.setQuery}
                onCreate={municipios.openCreate}
                onEdit={municipios.openEdit}
                onDelete={municipios.remove}
              />
            )}
            {municipios.showForm && (
              <MunicipioCatalogForm
                editingId={municipios.editingId}
                form={municipios.form}
                saving={municipios.saving}
                destinosCount={editingMunicipio?.destinosCount}
                onChange={municipios.setForm}
                onSave={municipios.save}
                onCancel={municipios.cancelForm}
              />
            )}
          </div>

          <div className="admin-workspace__split">
            <aside className="admin-workspace__aside admin-panel-scroll" aria-label="Lista de municipios">
              <MunicipioCatalogList
                rows={municipios.filtered}
                loading={municipios.loading}
                query={municipios.query}
                editingId={municipios.editingId}
                onQueryChange={municipios.setQuery}
                onCreate={municipios.openCreate}
                onEdit={municipios.openEdit}
                onDelete={municipios.remove}
              />
            </aside>

            <main className="admin-workspace__main admin-panel-scroll" aria-label="Editor de municipio">
              {municipios.editorOpen ? (
                <MunicipioCatalogForm
                  editingId={municipios.editingId}
                  form={municipios.form}
                  saving={municipios.saving}
                  destinosCount={editingMunicipio?.destinosCount}
                  onChange={municipios.setForm}
                  onSave={municipios.save}
                  onCancel={municipios.cancelForm}
                />
              ) : (
                <div className="admin-empty admin-empty--spacious">
                  <p className="admin-empty__text admin-empty__text--sm">
                    Elige un municipio de la lista o crea uno nuevo.
                  </p>
                  <button
                    type="button"
                    onClick={municipios.openCreate}
                    className="ui-btn ui-btn--primary admin-btn-new"
                  >
                    Nuevo municipio
                  </button>
                </div>
              )}
            </main>
          </div>
        </>
      )}
    </section>
  );
}
