import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function AdminModal({
  title,
  subtitle,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const titleId = useId();
  const subtitleId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeOnEscape);
    dialogRef.current?.querySelector<HTMLElement>('button, input, select, textarea')?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
      previousFocus?.focus();
    };
  }, []);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        ref={dialogRef}
        className={`modal ${wide ? 'modal--editor' : 'modal--wide'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? subtitleId : undefined}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="modal__close" onClick={onClose} aria-label="Cerrar">
          <X />
        </button>
        <header className="modal__heading">
          <h2 id={titleId}>{title}</h2>
          {subtitle && <p id={subtitleId}>{subtitle}</p>}
        </header>
        {children}
      </section>
    </div>
  );
}
