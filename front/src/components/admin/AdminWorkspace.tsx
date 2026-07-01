import type { useAdminPanel } from '../../hooks/useAdminPanel';
import AdminAlert from './AdminAlert';
import DestinoForm from './DestinoForm';
import { DestinoEditorPlaceholder } from './DestinoListEmpty';
import DestinoList from './DestinoList';

type AdminPanelState = ReturnType<typeof useAdminPanel>;

interface Props extends AdminPanelState {}

export default function AdminWorkspace({
  query,
  setQuery,
  loading,
  saving,
  error,
  success,
  editingId,
  form,
  setForm,
  filtered,
  municipioText,
  showList,
  showForm,
  editorOpen,
  loadingEditId,
  openCreate,
  openEdit,
  cancelForm,
  saveDestino,
  removeDestino,
  addMunicipio,
  removeMunicipio,
  setMunicipioDraft,
}: Props) {
  return (
    <section className="flex flex-col flex-1 min-h-0 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-10 pb-24 lg:pb-4 lg:overflow-hidden">
      {(error || success) && (
        <div className="shrink-0 space-y-2 mb-4">
          {error && <AdminAlert message={error} variant="error" />}
          {success && <AdminAlert message={success} variant="success" />}
        </div>
      )}

      {/* Móvil: una sola columna con scroll de página */}
      <div className="lg:hidden flex flex-col gap-4">
        {!showForm && (
          <DestinoList
            rows={filtered}
            loading={loading}
            query={query}
            editingId={editingId}
            municipioText={municipioText}
            hiddenOnMobile={false}
            onQueryChange={setQuery}
            onCreate={openCreate}
            onEdit={openEdit}
            onDelete={removeDestino}
            onMunicipioDraftChange={setMunicipioDraft}
            onAddMunicipio={addMunicipio}
            onRemoveMunicipio={removeMunicipio}
          />
        )}
        {showForm && (
          <DestinoForm
            form={form}
            editingId={editingId}
            saving={saving}
            loading={loadingEditId !== null}
            onChange={setForm}
            onSubmit={saveDestino}
            onCancel={cancelForm}
          />
        )}
      </div>

      {/* Escritorio: dos columnas con scroll independiente */}
      <div className="hidden lg:flex flex-1 min-h-0 gap-8 overflow-hidden">
        <aside
          className="w-[38%] shrink-0 h-full min-h-0 overflow-y-auto overscroll-contain admin-panel-scroll pr-1"
          aria-label="Lista de destinos"
        >
          <DestinoList
            rows={filtered}
            loading={loading}
            query={query}
            editingId={editingId}
            municipioText={municipioText}
            hiddenOnMobile={false}
            onQueryChange={setQuery}
            onCreate={openCreate}
            onEdit={openEdit}
            onDelete={removeDestino}
            onMunicipioDraftChange={setMunicipioDraft}
            onAddMunicipio={addMunicipio}
            onRemoveMunicipio={removeMunicipio}
          />
        </aside>

        <main
          className="flex-1 min-w-0 h-full min-h-0 overflow-y-auto overscroll-contain admin-panel-scroll pl-1"
          aria-label="Editor de destino"
        >
          {editorOpen ? (
            <DestinoForm
              form={form}
              editingId={editingId}
              saving={saving}
              loading={loadingEditId !== null}
              onChange={setForm}
              onSubmit={saveDestino}
              onCancel={cancelForm}
            />
          ) : (
            <DestinoEditorPlaceholder onCreate={openCreate} />
          )}
        </main>
      </div>
    </section>
  );
}
