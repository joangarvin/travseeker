import { t } from '../../i18n';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { EditorLanguage } from '../../features/admin/components/EditorLanguage';

export function AdminModal<Draft extends object = object>({
  title,
  subtitle,
  onClose,
  children,
  wide = false,
  draft,
  draftKey,
  onRestore,
  busy = false,
  error,
  savedVersion = 0,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  draft?: Draft;
  draftKey?: string;
  onRestore?: (draft: Draft) => void;
  busy?: boolean;
  error?: string;
  savedVersion?: number;
}) {
  const titleId = useId();
  const subtitleId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const { user } = useAuth();
  const serialized = JSON.stringify(draft);
  const [baseline, setBaseline] = useState(serialized);
  const version = useRef(savedVersion);
  const storageKey = draftKey ? `trav_editor_draft:${user?.id || 'session'}:${draftKey}` : null;
  const [confirmClose, setConfirmClose] = useState(false);
  const [recovery, setRecovery] = useState<{ value: object; base: string } | null>(() => {
    try {
      return storageKey ? JSON.parse(sessionStorage.getItem(storageKey) || 'null') : null;
    } catch {
      return null;
    }
  });
  const [saveAndClose, setSaveAndClose] = useState(false);
  const savingStarted = useRef(false);
  const dirty = serialized !== baseline;
  const forgetDraft = () => {
    if (storageKey) {
      try {
        sessionStorage.removeItem(storageKey);
      } catch {
        /* optional recovery */
      }
    }
  };

  useEffect(() => {
    const saved = (event: Event) => {
      if ((event as CustomEvent).detail !== draftKey) return;
      forgetDraft();
      setBaseline(serialized);
      setRecovery(null);
    };
    window.addEventListener('trav:editor-saved', saved);
    return () => window.removeEventListener('trav:editor-saved', saved);
  }, [draftKey, serialized, storageKey]);

  useEffect(() => {
    if (version.current !== savedVersion) {
      setBaseline(serialized);
      version.current = savedVersion;
      forgetDraft();
    } else if (!dirty && !recovery) {
      forgetDraft();
    } else if (dirty && storageKey) {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify({ base: baseline, value: draft }));
      } catch {
        /* dirty guard still works if storage is full */
      }
    }
  }, [serialized, savedVersion, storageKey]);

  useEffect(() => {
    if (!dirty && !busy) return;
    const preventUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', preventUnload);
    return () => window.removeEventListener('beforeunload', preventUnload);
  }, [dirty, busy]);

  useEffect(() => {
    if (!saveAndClose) return;
    if (error && !busy) {
      setSaveAndClose(false);
      savingStarted.current = false;
      return;
    }
    if (busy) savingStarted.current = true;
    else if (savingStarted.current) {
      savingStarted.current = false;
      setSaveAndClose(false);
      if (!error) {
        forgetDraft();
        onClose();
      }
    }
  }, [busy, error, saveAndClose, onClose]);

  const requestClose = () => {
    if (busy) return;
    if (dirty) setConfirmClose(true);
    else onClose();
  };
  const content = (
    <>
      {recovery && onRestore && (
        <div className="editor-recovery" role="status">
          <p>
            {recovery.base === baseline
              ? t('Hay un borrador sin guardar de esta sesión.')
              : t(
                  'Hay un borrador anterior. El contenido guardado ha cambiado; revisa antes de recuperarlo.',
                )}
          </p>
          <button
            type="button"
            onClick={() => {
              onRestore(recovery.value as Draft);
              setRecovery(null);
            }}
          >
            {t('Recuperar borrador')}
          </button>
          <button
            type="button"
            onClick={() => {
              forgetDraft();
              setRecovery(null);
            }}
          >
            {t('Descartar borrador')}
          </button>
        </div>
      )}
      {error && (
        <div className="notice notice--error editor-error" role="alert">
          {error}
        </div>
      )}
      {confirmClose && (
        <div className="editor-close-confirm" role="alert">
          <strong>{t('Tienes cambios sin guardar')}</strong>
          <p>{t('Guarda el contenido o sigue editando para no perderlo.')}</p>
          <div>
            <button
              type="button"
              className="button button--quiet"
              onClick={() => setConfirmClose(false)}
            >
              {t('Seguir editando')}
            </button>
            <button
              type="button"
              className="button button--quiet"
              onClick={() => {
                forgetDraft();
                onClose();
              }}
            >
              {t('Descartar cambios')}
            </button>
            <button
              type="button"
              className="button"
              disabled={busy}
              onClick={() => {
                const form = dialogRef.current?.querySelector('form');
                if (!form?.reportValidity()) return;
                setConfirmClose(false);
                setSaveAndClose(true);
                form.requestSubmit();
              }}
            >
              {t('Guardar y cerrar')}
            </button>
          </div>
        </div>
      )}
      <div
        className="admin-modal-body"
        onClickCapture={(event) => {
          // Existing footer Close controls share the same guard as backdrop/Escape.
          const button = (event.target as HTMLElement).closest('button');
          if (button?.dataset.closeEditor === 'true') {
            event.preventDefault();
            event.stopPropagation();
            requestClose();
          }
        }}
      >
        {children}
      </div>
    </>
  );
  return (
    <div className="modal-backdrop" onMouseDown={requestClose}>
      <section
        ref={dialogRef}
        className={`modal ${wide ? 'modal--editor' : 'modal--wide'}${draft ? ' modal--draft' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? subtitleId : undefined}
        aria-busy={busy}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="modal__close"
          onClick={requestClose}
          disabled={busy}
          aria-label={t('Cerrar')}
        >
          <X />
        </button>
        <header className="modal__heading">
          <h2 id={titleId}>{title}</h2>
          {subtitle && <p id={subtitleId}>{subtitle}</p>}
        </header>
        {draft ? <EditorLanguage>{content}</EditorLanguage> : content}
      </section>
    </div>
  );
}
