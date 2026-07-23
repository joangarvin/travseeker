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
    <section className="flex flex-col flex-1 min-h-0 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-10 pb-24 lg:pb-4 lg:overflow-hidden">
      {(error || success) && (
        <div className="shrink-0 space-y-2 mb-4">
          {error && <AdminAlert message={error} variant="error" />}
          {success && <AdminAlert message={success} variant="success" />}
        </div>
      )}

      {tab === 'destinos' && (
        <>
          <div className="lg:hidden flex flex-col gap-4">
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

          <div className="hidden lg:flex flex-1 min-h-0 gap-8 overflow-hidden">
            <aside
              className="w-[38%] shrink-0 h-full min-h-0 overflow-y-auto overscroll-contain admin-panel-scroll pr-1"
              aria-label="Lista de destinos"
            >
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

            <main
              className="flex-1 min-w-0 h-full min-h-0 overflow-y-auto overscroll-contain admin-panel-scroll pl-1"
              aria-label="Editor de destino"
            >
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
          <div className="lg:hidden flex flex-col gap-4">
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

          <div className="hidden lg:flex flex-1 min-h-0 gap-8 overflow-hidden">
            <aside
              className="w-[38%] shrink-0 h-full min-h-0 overflow-y-auto overscroll-contain admin-panel-scroll pr-1"
              aria-label="Lista de municipios"
            >
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

            <main
              className="flex-1 min-w-0 h-full min-h-0 overflow-y-auto overscroll-contain admin-panel-scroll pl-1"
              aria-label="Editor de municipio"
            >
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
                <div className="rounded-2xl border border-dashed border-[var(--color-border-strong)] p-10 text-center space-y-3">
                  <p className="text-[var(--color-muted)] text-sm">
                    Elige un municipio de la lista o crea uno nuevo.
                  </p>
                  <button
                    type="button"
                    onClick={municipios.openCreate}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--color-brand)] text-[var(--color-on-brand)] text-sm font-semibold"
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
