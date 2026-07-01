import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi } from '../api/admin';
import { destinosApi } from '../api/destinos';
import { useAuth } from '../context/AuthContext';
import type { AdminDestinoRow, AdminMobileView, DestinoFormState } from '../types/admin';
import {
  destinoDetailToForm,
  destinoFormToPayload,
  emptyDestinoForm,
} from '../utils/admin/destinoForm';
import { parseJsonSafe } from '../utils/parseJson';

export function useAdminPanel() {
  const { token } = useAuth();
  const [rows, setRows] = useState<AdminDestinoRow[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DestinoFormState>(emptyDestinoForm());
  const [municipioText, setMunicipioText] = useState<Record<string, string>>({});
  const [mobileView, setMobileView] = useState<AdminMobileView>('list');
  const [loadingEditId, setLoadingEditId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setRows(await adminApi.listDestinos(token));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando panel');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.nombre.toLowerCase().includes(q) ||
        parseJsonSafe(r.ubicacion).toLowerCase().includes(q),
    );
  }, [rows, query]);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const openCreate = useCallback(() => {
    setEditingId(null);
    setForm(emptyDestinoForm());
    setError('');
    setSuccess('');
    setMobileView('form');
    scrollTop();
  }, []);

  const openEdit = useCallback(async (id: string) => {
    setLoadingEditId(id);
    setError('');
    setSuccess('');
    setEditingId(id);
    if (window.innerWidth < 1024) setMobileView('form');
    try {
      const detail = await destinosApi.getById(id);
      setForm(destinoDetailToForm(detail));
    } catch (e) {
      setEditingId(null);
      if (window.innerWidth < 1024) setMobileView('list');
      setError(e instanceof Error ? e.message : 'No se pudo cargar el destino');
    } finally {
      setLoadingEditId(null);
    }
  }, []);

  const cancelForm = useCallback(() => {
    setEditingId(null);
    setLoadingEditId(null);
    setForm(emptyDestinoForm());
    setMobileView('list');
    setError('');
  }, []);

  const saveDestino = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = destinoFormToPayload(form);
      if (editingId) {
        await adminApi.updateDestino(editingId, payload, token);
        setSuccess('Destino actualizado correctamente.');
        await load();
      } else {
        await adminApi.createDestino(payload, token);
        setSuccess('Destino publicado correctamente.');
        setMobileView('list');
        setEditingId(null);
        setForm(emptyDestinoForm());
        await load();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }, [token, form, editingId, load]);

  const removeDestino = useCallback(async (id: string, nombre: string) => {
    if (!token) return;
    if (!window.confirm(`¿Eliminar «${nombre}» y todos sus municipios?`)) return;
    await adminApi.deleteDestino(id, token);
    if (editingId === id) cancelForm();
    await load();
  }, [token, editingId, cancelForm, load]);

  const addMunicipio = useCallback(async (destinoId: string) => {
    if (!token) return;
    const nombre = (municipioText[destinoId] || '').trim();
    if (!nombre) return;
    await adminApi.createMunicipio(destinoId, { nombre }, token);
    setMunicipioText((prev) => ({ ...prev, [destinoId]: '' }));
    await load();
  }, [token, municipioText, load]);

  const removeMunicipio = useCallback(async (id: string) => {
    if (!token) return;
    await adminApi.deleteMunicipio(id, token);
    await load();
  }, [token, load]);

  const setMunicipioDraft = useCallback((destinoId: string, value: string) => {
    setMunicipioText((prev) => ({ ...prev, [destinoId]: value }));
  }, []);

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
    mobileView,
    filtered,
    openCreate,
    openEdit,
    cancelForm,
    saveDestino,
    removeDestino,
    addMunicipio,
    removeMunicipio,
    municipioText,
    setMunicipioDraft,
    loadingEditId,
    showList: mobileView === 'list',
    showForm: mobileView === 'form',
    editorOpen: editingId !== null || mobileView === 'form',
  };
}
