import { readEditorialPage } from '../adminResponses';
import { EditorialPreview } from './EditorialPreview';
import { t, intlLocale } from '../../../i18n';
import { useEffect, useState, type KeyboardEvent } from 'react';
import { Archive, Check, RotateCcw, Search, Eye } from 'lucide-react';
import { AdminModal } from '../../../components/admin/AdminModal';
import { Button, Empty, Toast, Notice } from '../../../components/ui';
import type { EditorialActor, EditorialStatus } from '../../../types';
import { imageUrl, responsiveImageUrl } from '../../../utils/media';
import type { EditorialResource } from '../types';
import { EditorialStatusBadge } from './EditorialStatusBadge';

export type EditorialItem = {
  id: string;
  resource: EditorialResource;
  title: string;
  editorialStatus: EditorialStatus;
  submittedAt: string;
  reviewedAt?: string | null;
  createdBy?: EditorialActor | null;
  reviewedBy?: EditorialActor | null;
  isActive?: boolean;
};

import { api } from '../../../services/api';
import { useAuth } from '../../../contexts';

type EditorialTab = EditorialStatus | 'all';

const RESOURCE_LABELS: Record<EditorialResource, string> = {
  destinos: t('Destino'),
  activities: t('Actividad'),
  'tourism-types': t('Tipo de viaje'),
  municipios: t('Municipio'),
  places: t('Lugar'),
};

const DATE_FORMATTER = new Intl.DateTimeFormat(intlLocale, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function actorName(actor?: EditorialActor | null) {
  return (
    [actor?.nombre, actor?.apellidos].filter(Boolean).join(' ') ||
    actor?.email ||
    t('Autor desconocido')
  );
}

function AuthorAvatar({ actor }: { actor?: EditorialActor | null }) {
  const [failed, setFailed] = useState(false);
  const name = actorName(actor);
  const source = imageUrl(actor?.avatarUrl);
  if (source && !failed) {
    return (
      <img
        src={responsiveImageUrl(source, 96)}
        loading="lazy"
        decoding="async"
        alt=""
        onError={() => setFailed(true)}
      />
    );
  }
  return <span aria-hidden="true">{name.slice(0, 2).toUpperCase()}</span>;
}

function ArchiveDialog({
  count,
  busy,
  onClose,
  onConfirm,
}: {
  count: number;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AdminModal
      title={t('Archivar {0} {1}', { 0: count, 1: count === 1 ? 'contenido' : 'contenidos' })}
      subtitle={t('Dejarán de estar visibles en las superficies públicas.')}
      onClose={onClose}
    >
      <div className="editorial-archive-warning">
        <Archive aria-hidden="true" />
        <p>{t('Podrás recuperar el contenido más tarde desde la pestaña Archivado.')}</p>
      </div>
      <footer className="modal-actions">
        <Button type="button" variant="quiet" data-autofocus onClick={onClose}>
          {t('Cancelar')}
        </Button>
        <Button type="button" variant="danger" loading={busy} onClick={onConfirm}>
          {t('Archivar')}
        </Button>
      </footer>
    </AdminModal>
  );
}

export function EditorialReviewPanel({
  onEdit,
  revision,
  onTransition,
}: {
  onEdit: (item: EditorialItem) => void;
  revision: number;
  onTransition: (
    resource: EditorialResource,
    ids: string[],
    status: EditorialStatus,
  ) => Promise<void>;
}) {
  const [preview, setPreview] = useState<EditorialItem | null>(null);
  const [tab, setTab] = useState<EditorialTab>('pending');
  const [resource, setResource] = useState<EditorialResource | 'all'>('all');
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [busy, setBusy] = useState(false);
  const [archiveTargets, setArchiveTargets] = useState<EditorialItem[] | null>(null);
  const [toast, setToast] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const { token } = useAuth();
  const [items, setItems] = useState<EditorialItem[]>([]);
  const [counts, setCounts] = useState({ all: 0, draft: 0, pending: 0, published: 0, archived: 0 });
  const [cursors, setCursors] = useState<string[]>(['']);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const cursor = cursors.at(-1) || '';
  useEffect(() => {
    setCursors(['']);
    setSelectedIds(new Set());
  }, [query, resource, tab]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const timer = window.setTimeout(
      () => {
        const params = new URLSearchParams({
          status: tab,
          resource,
          q: query,
          limit: '40',
          cursor,
        });
        api<{ items: EditorialItem[]; counts: typeof counts; nextCursor: string | null }>(
          `/admin/editorial?${params}`,
          { signal: controller.signal },
          token,
        )
          .then((page) => {
            if (controller.signal.aborted) return;
            const checked = readEditorialPage<EditorialItem>(page);
            setItems(checked.items);
            setCounts(checked.counts);
            setNextCursor(checked.nextCursor);
            setError('');
            setSelectedIds(new Set());
          })
          .catch((cause) => {
            if (!controller.signal.aborted)
              setError(
                cause instanceof Error ? t(cause.message) : t('No se pudo cargar el contenido'),
              );
          })
          .finally(() => {
            if (!controller.signal.aborted) setLoading(false);
          });
      },
      query ? 250 : 0,
    );
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [tab, resource, query, cursor, token, retry, revision]);
  const visible = items;

  const tabs: Array<{ id: EditorialTab; label: string }> = [
    { id: 'pending', label: t('Pendientes') },
    { id: 'draft', label: t('Borradores') },
    { id: 'published', label: t('Publicados') },
    { id: 'archived', label: t('Archivados') },
    { id: 'all', label: t('Todos') },
  ];

  const selected = visible.filter((item) => selectedIds.has(`${item.resource}:${item.id}`));
  const allSelected = visible.length > 0 && selected.length === visible.length;

  const toggleAll = () =>
    setSelectedIds(
      allSelected ? new Set() : new Set(visible.map((item) => `${item.resource}:${item.id}`)),
    );

  const toggleOne = (id: string) =>
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const transition = async (targets: EditorialItem[], status: EditorialStatus) => {
    const actionable = targets.filter((item) => item.editorialStatus !== status);
    if (!actionable.length) {
      setToast({ tone: 'error', text: t('La selección ya está en estado {0}', { 0: status }) });
      return;
    }
    setBusy(true);
    try {
      const grouped = actionable.reduce(
        (groups, item) => {
          (groups[item.resource] ||= []).push(item);
          return groups;
        },
        {} as Partial<Record<EditorialResource, EditorialItem[]>>,
      );
      await Promise.all(
        Object.entries(grouped).map(([itemResource, group]) =>
          onTransition(
            itemResource as EditorialResource,
            (group || []).map((item) => item.id),
            status,
          ),
        ),
      );
      setSelectedIds(new Set());
      setToast({
        tone: 'success',
        text: `${actionable.length} ${actionable.length === 1 ? t('contenido actualizado') : t('contenidos actualizados')}`,
      });
    } catch (cause) {
      setToast({
        tone: 'error',
        text: cause instanceof Error ? cause.message : t('No se pudo actualizar el contenido'),
      });
    } finally {
      setBusy(false);
      setRetry((value) => value + 1);
    }
  };

  const confirmArchive = async () => {
    if (!archiveTargets) return;
    await transition(archiveTargets, 'archived');
    setArchiveTargets(null);
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    setTab(tabs[next].id);
    requestAnimationFrame(() => document.getElementById(`editorial-tab-${tabs[next].id}`)?.focus());
  };

  return (
    <div className="editorial-review">
      <header className="editorial-review__intro">
        <div>
          <span className="kicker">{t('Publicación')}</span>
          <h2>{t('Revisión editorial')}</h2>
          <p>{t('Una única cola para controlar qué contenido llega a TravSeeker.')}</p>
        </div>
        <div
          className="editorial-review__queue"
          aria-label={t('{0} contenidos pendientes', { 0: counts.pending })}
        >
          <strong>{counts.pending}</strong>
          <span>{t('por revisar')}</span>
        </div>
      </header>

      <div className="editorial-tabs" role="tablist" aria-label={t('Estados editoriales')}>
        {tabs.map((item, index) => (
          <button
            key={item.id}
            id={`editorial-tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            aria-controls="editorial-status-panel"
            tabIndex={tab === item.id ? 0 : -1}
            onClick={() => setTab(item.id)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
          >
            {t(item.label)} <span>{counts[item.id]}</span>
          </button>
        ))}
      </div>

      <div className="editorial-review__filters">
        <label className="editorial-search">
          <span className="sr-only">{t('Buscar contenido')}</span>
          <Search aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('Buscar contenido')}
          />
        </label>
        <label>
          <span>{t('Tipo de contenido')}</span>
          <select
            value={resource}
            onChange={(event) => setResource(event.target.value as typeof resource)}
          >
            <option value="all">{t('Todos los tipos')}</option>
            {Object.entries(RESOURCE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {t(label)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <Notice tone="error">
          {error}
          <Button variant="quiet" onClick={() => setRetry((value) => value + 1)}>
            {t('Reintentar')}
          </Button>
        </Notice>
      )}
      {loading && <p role="status">{t('Cargando…')}</p>}
      <div
        aria-busy={loading}
        id="editorial-status-panel"
        role="tabpanel"
        aria-labelledby={`editorial-tab-${tab}`}
      >
        {visible.length ? (
          <>
            <label className="editorial-select-all">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              {t('Seleccionar los')} {visible.length} {t('visibles')}
            </label>
            <div className="editorial-review__list">
              {visible.map((item) => (
                <article key={`${item.resource}-${item.id}`}>
                  <label className="editorial-card__check">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(`${item.resource}:${item.id}`)}
                      onChange={() => toggleOne(`${item.resource}:${item.id}`)}
                    />
                    <span className="sr-only">
                      {t('Seleccionar')} {item.title}
                    </span>
                  </label>
                  <div className="editorial-card__avatar">
                    <AuthorAvatar actor={item.createdBy} />
                  </div>
                  <div className="editorial-card__body">
                    <div className="editorial-card__heading">
                      <div>
                        <span>{RESOURCE_LABELS[item.resource]}</span>
                        <h3>{item.title}</h3>
                      </div>
                      <EditorialStatusBadge status={item.editorialStatus} />
                    </div>
                    <p>
                      {t('Enviado por')} <strong>{actorName(item.createdBy)}</strong> ·{' '}
                      {DATE_FORMATTER.format(new Date(item.submittedAt))}
                      {item.reviewedAt
                        ? t(' · Revisado {0}', {
                            0: DATE_FORMATTER.format(new Date(item.reviewedAt)),
                          })
                        : ''}
                    </p>
                    <div className="editorial-card__actions">
                      <Button
                        variant="quiet"
                        disabled={busy || loading}
                        onClick={() => setPreview(item)}
                      >
                        {t('Vista previa')}
                      </Button>
                      <Button
                        variant="quiet"
                        disabled={busy || loading}
                        onClick={() => onEdit(item)}
                      >
                        <Eye /> {t('Revisar y editar')}
                      </Button>
                      {item.editorialStatus !== 'published' && (
                        <Button
                          loading={busy}
                          disabled={loading}
                          onClick={() => void transition([item], 'published')}
                        >
                          <Check /> {t('Aprobar')}
                        </Button>
                      )}
                      {item.editorialStatus !== 'draft' && (
                        <Button
                          variant="quiet"
                          loading={busy}
                          disabled={loading}
                          onClick={() => void transition([item], 'draft')}
                        >
                          <RotateCcw /> {t('Borrador')}
                        </Button>
                      )}
                      {item.editorialStatus !== 'archived' && (
                        <Button
                          variant="quiet"
                          disabled={busy || loading}
                          onClick={() => setArchiveTargets([item])}
                        >
                          <Archive /> {t('Archivar')}
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : !loading && !error ? (
          <Empty title={t('No hay contenido en esta vista')}>
            {t('Cambia el estado, el tipo o la búsqueda para revisar otra parte de la cola.')}
          </Empty>
        ) : null}
      </div>

      <nav className="pagination" aria-label={t('Páginas de revisión')}>
        <Button
          variant="quiet"
          disabled={loading || cursors.length === 1}
          onClick={() => setCursors((current) => current.slice(0, -1))}
        >
          {t('Anterior')}
        </Button>
        <span>{t('Página {0}', { 0: cursors.length })}</span>
        <Button
          variant="quiet"
          disabled={loading || !nextCursor}
          onClick={() => nextCursor && setCursors((current) => [...current, nextCursor])}
        >
          {t('Siguiente')}
        </Button>
      </nav>
      {selected.length > 0 && (
        <div className="editorial-bulk" role="region" aria-label={t('Acciones por lote')}>
          <strong>
            {selected.length} {t('seleccionados')}
          </strong>
          <div>
            <Button
              loading={busy}
              disabled={loading}
              onClick={() => void transition(selected, 'published')}
            >
              <Check /> {t('Aprobar')}
            </Button>
            <Button
              variant="quiet"
              loading={busy}
              disabled={loading}
              onClick={() => void transition(selected, 'draft')}
            >
              <RotateCcw /> {t('Borrador')}
            </Button>
            <Button
              variant="danger"
              disabled={busy || loading}
              onClick={() => setArchiveTargets(selected)}
            >
              <Archive /> {t('Archivar')}
            </Button>
          </div>
        </div>
      )}
      {preview && (
        <EditorialPreview
          item={preview}
          onClose={() => setPreview(null)}
          onEdit={() => {
            setPreview(null);
            onEdit(preview);
          }}
        />
      )}
      {archiveTargets && (
        <ArchiveDialog
          count={archiveTargets.length}
          busy={busy}
          onClose={() => setArchiveTargets(null)}
          onConfirm={() => void confirmArchive()}
        />
      )}
      {toast && (
        <Toast tone={toast.tone} onDismiss={() => setToast(null)}>
          {toast.text}
        </Toast>
      )}
    </div>
  );
}
