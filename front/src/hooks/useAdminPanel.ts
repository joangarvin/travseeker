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
  const [mobileView, setMobileView] = useState<AdminMobileView>('list');
  const [loadingEditId, setLoadingEditId] = useState<string | null>(null);
  const [linkedMunicipios, setLinkedMunicipios] = useState<{ id: string; nombre: string }[]>([]);
  const [linkingMunicipio, setLinkingMunicipio] = useState(false);

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
    setLinkedMunicipios([]);
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
      setLinkedMunicipios(
        (detail.municipios ?? []).map((m) => ({ id: m.id, nombre: m.nombre })),
      );
    } catch (e) {
      setEditingId(null);
      setLinkedMunicipios([]);
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
    setLinkedMunicipios([]);
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
        const created = await adminApi.createDestino(payload, token);
        setSuccess('Destino publicado. Ya puedes añadir municipios del catálogo.');
        await load();
        if (created.id) {
          setEditingId(created.id);
          setLinkedMunicipios([]);
          if (window.innerWidth < 1024) setMobileView('form');
        } else {
          setMobileView('list');
          setEditingId(null);
          setForm(emptyDestinoForm());
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }, [token, form, editingId, load]);

  const removeDestino = useCallback(async (id: string, nombre: string) => {
    if (!token) return;
    if (!window.confirm(`¿Eliminar «${nombre}»? Los municipios del catálogo no se borran.`)) return;
    await adminApi.deleteDestino(id, token);
    if (editingId === id) cancelForm();
    await load();
  }, [token, editingId, cancelForm, load]);

  const linkMunicipio = useCallback(async (municipioId: string) => {
    if (!token || !editingId) return;
    setLinkingMunicipio(true);
    setError('');
    try {
      const linked = await adminApi.linkMunicipio(editingId, municipioId, token);
      setLinkedMunicipios((prev) =>
        [...prev, { id: linked.id, nombre: linked.nombre }].sort((a, b) =>
          a.nombre.localeCompare(b.nombre, 'es'),
        ),
      );
      setSuccess(`«${linked.nombre}» añadido a este destino.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo añadir el municipio');
    } finally {
      setLinkingMunicipio(false);
    }
  }, [token, editingId, load]);

  const unlinkMunicipio = useCallback(async (municipioId: string, nombre: string) => {
    if (!token || !editingId) return;
    if (!window.confirm(`¿Quitar «${nombre}» de este destino? La ficha del municipio no se elimina.`)) {
      return;
    }
    try {
      await adminApi.unlinkMunicipio(editingId, municipioId, token);
      setLinkedMunicipios((prev) => prev.filter((m) => m.id !== municipioId));
      setSuccess(`«${nombre}» quitado de este destino.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo quitar el municipio');
    }
  }, [token, editingId, load]);

  /** Unlink from list card (destino may not be open in editor). */
  const unlinkMunicipioFromDestino = useCallback(async (
    destinoId: string,
    municipioId: string,
    nombre: string,
  ) => {
    if (!token) return;
    if (!window.confirm(`¿Quitar «${nombre}» de este destino? La ficha no se elimina.`)) return;
    try {
      await adminApi.unlinkMunicipio(destinoId, municipioId, token);
      if (editingId === destinoId) {
        setLinkedMunicipios((prev) => prev.filter((m) => m.id !== municipioId));
      }
      setSuccess(`«${nombre}» quitado del destino.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo quitar el municipio');
    }
  }, [token, editingId, load]);

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
    linkedMunicipios,
    linkingMunicipio,
    linkMunicipio,
    unlinkMunicipio,
    unlinkMunicipioFromDestino,
    loadingEditId,
    showList: mobileView === 'list',
    showForm: mobileView === 'form',
    editorOpen: editingId !== null || mobileView === 'form',
    reload: load,
  };
}
