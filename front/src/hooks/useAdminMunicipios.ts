import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi } from '../api/admin';
import { useAuth } from '../context/AuthContext';
import type { AdminMunicipio, AdminMobileView, MunicipioFormState } from '../types/admin';
import {
  emptyMunicipioForm,
  municipioFormToPayload,
  municipioToForm,
  normalizeAdminMunicipio,
} from '../utils/admin/municipioForm';

export function useAdminMunicipios(enabled: boolean) {
  const { token } = useAuth();
  const [rows, setRows] = useState<AdminMunicipio[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<MunicipioFormState>(emptyMunicipioForm());
  const [mobileView, setMobileView] = useState<AdminMobileView>('list');

  const load = useCallback(async () => {
    if (!token || !enabled) return;
    setLoading(true);
    try {
      const list = await adminApi.listMunicipios(token);
      setRows(list.map(normalizeAdminMunicipio));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los municipios');
    } finally {
      setLoading(false);
    }
  }, [token, enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.nombre.toLowerCase().includes(q));
  }, [rows, query]);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const resetForm = useCallback(() => {
    setEditingId(null);
    setForm(emptyMunicipioForm());
    setFormOpen(false);
    setMobileView('list');
  }, []);

  const openCreate = useCallback(() => {
    setEditingId(null);
    setForm(emptyMunicipioForm());
    setFormOpen(true);
    setError('');
    setSuccess('');
    setMobileView('form');
    scrollTop();
  }, []);

  const openEdit = useCallback((id: string) => {
    const found = rows.find((m) => m.id === id);
    if (!found) return;
    setEditingId(id);
    setForm(municipioToForm(found));
    setFormOpen(true);
    setError('');
    setSuccess('');
    setMobileView('form');
    scrollTop();
  }, [rows]);

  const cancelForm = useCallback(() => {
    resetForm();
    setError('');
  }, [resetForm]);

  const save = useCallback(async () => {
    if (!token) return;
    if (!form.nombre.trim()) {
      setError('El nombre del municipio es obligatorio');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = municipioFormToPayload(form);
      if (editingId) {
        const updated = await adminApi.updateMunicipio(editingId, payload, token);
        setRows((prev) =>
          prev
            .map((m) =>
              m.id === editingId
                ? normalizeAdminMunicipio({ ...updated, destinosCount: m.destinosCount })
                : m,
            )
            .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
        );
        setSuccess('Municipio actualizado. Los cambios se ven en todos los destinos donde esté.');
      } else {
        const created = await adminApi.createMunicipio(payload, token);
        setRows((prev) =>
          [...prev, normalizeAdminMunicipio(created)].sort((a, b) =>
            a.nombre.localeCompare(b.nombre, 'es'),
          ),
        );
        setSuccess('Municipio creado. Ya puedes añadirlo a cualquier destino.');
      }
      resetForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el municipio');
    } finally {
      setSaving(false);
    }
  }, [token, form, editingId, resetForm]);

  const remove = useCallback(async (id: string, nombre: string, destinosCount = 0) => {
    if (!token) return;
    const extra =
      destinosCount > 0
        ? ` Está en ${destinosCount} destino${destinosCount === 1 ? '' : 's'} y se quitará de todos.`
        : '';
    if (!window.confirm(`¿Eliminar «${nombre}» del catálogo?${extra}`)) return;
    try {
      await adminApi.deleteMunicipio(id, token);
      setRows((prev) => prev.filter((m) => m.id !== id));
      if (editingId === id) resetForm();
      setSuccess('Municipio eliminado del catálogo.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar');
    }
  }, [token, editingId, resetForm]);

  return {
    query,
    setQuery,
    loading,
    saving,
    error,
    success,
    editingId,
    form,
    setForm,
    formOpen,
    rows,
    filtered,
    openCreate,
    openEdit,
    cancelForm,
    save,
    remove,
    reload: load,
    showList: mobileView === 'list',
    showForm: mobileView === 'form',
    editorOpen: formOpen,
  };
}
