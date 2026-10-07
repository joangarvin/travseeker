import { useEffect, useState } from 'react';
import { Plus, Search, ArrowUp, ArrowDown, Edit3, X } from 'lucide-react';
import { api } from '../../../services/api';
import { Button, Field, ImageUploader, Notice } from '../../../components/ui';
import type { MunicipalityCatalog, MunicipalityRecord } from '../../../types';

const specificFields: Record<MunicipalityCatalog, [keyof MunicipalityRecord, string][]> = {
  actividades: [
    ['category', 'Tipo de actividad'],
    ['duration', 'Duración'],
    ['bestTime', 'Mejor momento'],
  ],
  hoteles: [
    ['stars', 'Estrellas (1–5)'],
    ['amenities', 'Servicios y accesibilidad'],
  ],
  restaurantes: [
    ['cuisine', 'Tipo de cocina'],
    ['openingHours', 'Horarios'],
  ],
};
const EMPTY_RECORDS: MunicipalityRecord[] = [];
const names = { actividades: 'actividad', hoteles: 'hotel', restaurantes: 'restaurante' };

type Props = {
  standalone?: boolean;
  revision?: number;
  onSaved?: () => void;
  onManageHighlights?: (id: string) => void;
  kind: MunicipalityCatalog;
  token: string;
  ids: string[];
  initialRecords?: MunicipalityRecord[];
  onChange: (ids: string[]) => void;
  onEditingChange: (editing: boolean) => void;
};

export function MunicipalityCatalogEditor({
  kind,
  standalone = false,
  revision = 0,
  onSaved,
  onManageHighlights,
  token,
  ids,
  initialRecords = EMPTY_RECORDS,
  onChange,
  onEditingChange,
}: Props) {
  const [destinations, setDestinations] = useState<{ id: string; nombre: string }[]>([]);
  const [highlightDestination, setHighlightDestination] = useState('');
  const [sources, setSources] = useState<{ id: string; nombre: string; destino: string }[]>([]);
  const [sourceId, setSourceId] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [records, setRecords] = useState(initialRecords);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<Partial<MunicipalityRecord> | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [all, setAll] = useState(standalone);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!standalone || kind !== 'actividades') return;
    const controller = new AbortController();
    api<{ id: string; nombre: string }[]>(
      '/admin/destinos?options=1',
      { signal: controller.signal },
      token,
    )
      .then(setDestinations)
      .catch((cause) => {
        if (!controller.signal.aborted) setError(cause.message);
      });
    return () => controller.abort();
  }, [standalone, kind, token]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      api<MunicipalityRecord[]>(
        `/admin/fichas/${kind}?q=${encodeURIComponent(query)}&offset=${offset}${standalone && kind === 'actividades' ? '&unified=1' : ''}`,
        { signal: controller.signal },
        token,
      )
        .then((rows) => {
          setHasMore(rows.length === 100);
          setRecords((previous) => [
            ...(standalone && offset === 0
              ? []
              : previous.filter((record) => !rows.some((row) => row.id === record.id))),
            ...rows,
          ]);
          setError('');
        })
        .catch((cause) => {
          if (!controller.signal.aborted)
            setError(cause instanceof Error ? cause.message : 'No se pudo cargar el catálogo');
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [kind, query, token, retry, offset, standalone, revision]);
  useEffect(() => {
    if (initialRecords.length)
      setRecords((previous) => [
        ...previous.filter((row) => !initialRecords.some((record) => record.id === row.id)),
        ...initialRecords,
      ]);
  }, [initialRecords]);
  useEffect(() => {
    if (!importOpen) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      api<{ id: string; nombre: string; destino: string }[]>(
        `/admin/fichas/actividades/imprescindibles?q=${encodeURIComponent(query)}`,
        { signal: controller.signal },
        token,
      )
        .then(setSources)
        .catch((cause) => {
          if (!controller.signal.aborted)
            setError(
              cause instanceof Error ? cause.message : 'No se pudieron cargar las actividades',
            );
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [importOpen, query, token]);
  const importSource = async () => {
    if (!sourceId) return;
    setSaving(true);
    setError('');
    try {
      const record = await api<MunicipalityRecord>(
        '/admin/fichas/actividades',
        { method: 'POST', body: JSON.stringify({ essentialItemId: sourceId }) },
        token,
      );
      setRecords((previous) => [...previous.filter((row) => row.id !== record.id), record]);
      if (!ids.includes(record.id)) onChange([...ids, record.id]);
      onSaved?.();
      setImportOpen(false);
      setSourceId('');
      setMessage(
        standalone
          ? 'Actividad añadida al catálogo conservando su vínculo con el imprescindible original.'
          : 'Actividad existente asociada al catálogo. Conserva su vínculo con el imprescindible original. Guarda el municipio para confirmar la asociación.',
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo asociar la actividad');
    } finally {
      setSaving(false);
    }
  };
  useEffect(() => {
    onEditingChange(!!draft || saving);
  }, [draft, saving, onEditingChange]);
  const edit = (value: Partial<MunicipalityRecord> | null) => {
    setDraft(value);
    setError('');
  };
  const save = async () => {
    if (!draft) return;
    setSaving(true);
    setError('');
    try {
      const saved = await api<MunicipalityRecord>(
        `/admin/fichas/${kind}${draft.id ? `/${draft.id}` : ''}`,
        { method: draft.id ? 'PUT' : 'POST', body: JSON.stringify(draft) },
        token,
      );
      setRecords((current) => [
        ...current.filter((row) => row.id !== saved.id && row.id !== draft.id),
        saved,
      ]);
      if (!draft.id && !ids.includes(saved.id)) onChange([...ids, saved.id]);
      setMessage(
        draft.id
          ? 'Ficha actualizada en el catálogo. Se aplica en todos los destinos y municipios que la utilizan.'
          : standalone
            ? 'Ficha creada en el catálogo. Ya está disponible para asociarla a los municipios.'
            : 'Ficha creada en el catálogo. Guarda el municipio para confirmar su asociación.',
      );
      onSaved?.();
      edit(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la ficha');
    } finally {
      setSaving(false);
    }
  };
  useEffect(() => {
    if (!standalone || (!draft && !saving)) return;
    const protect = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', protect);
    return () => window.removeEventListener('beforeunload', protect);
  }, [standalone, draft, saving]);
  const Heading = standalone ? 'h2' : 'h3';
  const move = (index: number, direction: number) => {
    const next = [...ids];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    onChange(next);
  };
  const filtered = records.filter((row) =>
    `${row.nombre} ${row.address}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );
  return (
    <section className="municipality-catalog-editor">
      <header>
        <Heading>
          {kind === 'actividades'
            ? 'Actividades'
            : kind === 'hoteles'
              ? 'Hoteles y alojamientos'
              : 'Restaurantes'}
        </Heading>
        <span>{standalone ? `${records.length} fichas cargadas` : `${ids.length} asociados`}</span>
      </header>
      <p>
        {standalone
          ? 'Gestiona las fichas compartidas. Una actividad puede aparecer en municipios y ser un imprescindible de un destino; sus datos se editan una sola vez.'
          : 'Asocia una ficha existente o crea una nueva. Quitarla del municipio conserva la ficha en el catálogo.'}
      </p>
      {message && <Notice tone="success">{message}</Notice>}
      {error && (
        <Notice
          tone="error"
          action={
            <Button type="button" variant="quiet" onClick={() => setRetry((value) => value + 1)}>
              Reintentar
            </Button>
          }
        >
          {error}
        </Notice>
      )}
      <div className="municipality-catalog-editor__tools">
        <label>
          <Search aria-hidden />
          <input
            aria-label={`Buscar ${kind}`}
            disabled={!!draft || saving}
            value={query}
            onChange={(event) => {
              setOffset(0);
              setQuery(event.target.value);
              setAll(true);
            }}
            placeholder={`Buscar en el catálogo de ${kind}`}
          />
        </label>
        <Button
          type="button"
          variant="secondary"
          disabled={!!draft}
          onClick={() => edit({ nombre: '', isPublished: false })}
        >
          <Plus />
          Crear {names[kind]}
        </Button>
      </div>
      {kind === 'actividades' && !standalone && (
        <Button
          type="button"
          variant="secondary"
          disabled={!!draft || saving}
          onClick={() => setImportOpen((value) => !value)}
        >
          Reutilizar un imprescindible de un destino
        </Button>
      )}
      {standalone && kind === 'actividades' && onManageHighlights && (
        <div className="municipality-source-picker">
          <label>
            Imprescindibles de un destino
            <select
              value={highlightDestination}
              disabled={!!draft || saving}
              onChange={(event) => setHighlightDestination(event.target.value)}
            >
              <option value="">Selecciona un destino</option>
              {destinations.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.nombre}
                </option>
              ))}
            </select>
          </label>
          <Button
            type="button"
            variant="secondary"
            disabled={!highlightDestination || !!draft || saving}
            onClick={() => onManageHighlights(highlightDestination)}
          >
            Elegir actividades imprescindibles
          </Button>
        </div>
      )}
      {importOpen && (
        <div className="municipality-source-picker">
          <p>
            Busca por el título en el campo del catálogo. La actividad mantiene sus datos
            compartidos con el destino original.
          </p>
          <label>
            Actividad existente
            <select value={sourceId} onChange={(event) => setSourceId(event.target.value)}>
              <option value="">Selecciona una actividad</option>
              {sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.destino} · {source.nombre}
                </option>
              ))}
            </select>
          </label>
          <Button
            type="button"
            loading={saving}
            disabled={!sourceId}
            onClick={() => void importSource()}
          >
            Asociar actividad existente
          </Button>
        </div>
      )}
      {!standalone && (
        <button
          type="button"
          className="button button--quiet"
          onClick={() => setAll((value) => !value)}
        >
          {all ? 'Ver solo asociados' : 'Explorar catálogo completo'}
        </button>
      )}
      {loading && <p role="status">Cargando catálogo…</p>}
      <ul className="municipality-catalog-editor__list">
        {(all
          ? filtered
          : ids
              .map((id) => records.find((row) => row.id === id))
              .filter((row): row is MunicipalityRecord => !!row)
        ).map((row) => {
          const index = ids.indexOf(row.id);
          return (
            <li key={row.id}>
              <label>
                {!standalone && (
                  <input
                    type="checkbox"
                    checked={index >= 0}
                    disabled={!!draft}
                    onChange={() =>
                      onChange(index >= 0 ? ids.filter((id) => id !== row.id) : [...ids, row.id])
                    }
                  />
                )}
                <span>
                  <strong>{row.nombre}</strong>
                  <small>
                    {row.isPublished ? 'Publicado' : 'Borrador'}
                    {row.address ? ` · ${row.address}` : ''}
                    {row.essentialItemId ? ' · Imprescindible de un destino' : ''}
                  </small>
                </span>
              </label>
              <div>
                {!standalone && index >= 0 && (
                  <>
                    <button
                      type="button"
                      disabled={index === 0 || !!draft}
                      onClick={() => move(index, -1)}
                      aria-label={`Subir ${row.nombre}`}
                    >
                      <ArrowUp />
                    </button>
                    <button
                      type="button"
                      disabled={index === ids.length - 1 || !!draft}
                      onClick={() => move(index, 1)}
                      aria-label={`Bajar ${row.nombre}`}
                    >
                      <ArrowDown />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  disabled={!!draft}
                  onClick={() => edit(row)}
                  aria-label={`Editar ${row.nombre}`}
                >
                  <Edit3 />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {standalone && !loading && !records.length && (
        <p>No hay fichas que coincidan con la búsqueda. Puedes crear una nueva.</p>
      )}
      {standalone && hasMore && (
        <Button
          type="button"
          variant="secondary"
          disabled={loading || !!draft}
          onClick={() => setOffset((value) => value + 100)}
        >
          Cargar más fichas
        </Button>
      )}
      {!draft && !ids.length && !all && (
        <p>Todavía no hay {kind} asociados. Explora el catálogo o crea una ficha.</p>
      )}
      {draft && (
        <fieldset className="municipality-record-form" disabled={saving}>
          <legend>{draft.id ? `Editar ${draft.nombre}` : `Crear ${names[kind]}`}</legend>
          <p>
            Las fichas se reutilizan: editar una cambia su información en todos los municipios
            asociados.{' '}
            {!standalone && 'La publicación de la ficha es independiente de guardar el municipio.'}{' '}
            {draft.essentialItemId && (
              <strong>
                Esta actividad está vinculada a un imprescindible: los cambios también se aplican en
                su destino original.
              </strong>
            )}
          </p>
          <ImageUploader
            id={`catalog-photo-${kind}`}
            token={token}
            endpoint="/upload/municipio"
            label="Fotografía"
            value={draft.imagen}
            onChange={(imagen) => setDraft({ ...draft, imagen })}
            onRemove={() => setDraft({ ...draft, imagen: '' })}
          />
          {[
            ['nombre', 'Nombre'],
            ['descripcion', 'Descripción'],
            ['imagenAlt', 'Texto alternativo de la foto'],
            ['address', 'Dirección'],
            ['price', 'Precio orientativo y unidad (persona, noche…)'],
            ['phone', 'Teléfono'],
            ['website', 'Web oficial'],
            ['bookingUrl', 'Enlace de reserva'],
            ...specificFields[kind],
          ].map(([key, label]) => (
            <Field key={key} label={label} htmlFor={`record-${kind}-${key}`}>
              <textarea
                id={`record-${kind}-${key}`}
                rows={key === 'descripcion' ? 4 : 1}
                value={String(draft[key as keyof MunicipalityRecord] ?? '')}
                onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
              />
            </Field>
          ))}
          <div className="admin-form-grid admin-form-grid--two">
            {(['latitud', 'longitud'] as const).map((key) => (
              <Field
                key={key}
                label={key === 'latitud' ? 'Latitud' : 'Longitud'}
                htmlFor={`record-${kind}-${key}`}
              >
                <input
                  type="number"
                  step="any"
                  id={`record-${kind}-${key}`}
                  value={draft[key] ?? ''}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      [key]: event.target.value === '' ? null : Number(event.target.value),
                    })
                  }
                />
              </Field>
            ))}
          </div>
          <label>
            <input
              type="checkbox"
              checked={draft.isPublished === true}
              onChange={(event) => setDraft({ ...draft, isPublished: event.target.checked })}
            />{' '}
            Publicar esta ficha
          </label>
          <div className="municipality-catalog-editor__tools">
            <Button type="button" loading={saving} onClick={() => void save()}>
              Guardar ficha en el catálogo
            </Button>
            <Button type="button" variant="quiet" disabled={saving} onClick={() => edit(null)}>
              <X />
              Cancelar
            </Button>
          </div>
        </fieldset>
      )}
    </section>
  );
}
