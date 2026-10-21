import { Eye, EyeOff, Check, Clock3 } from 'lucide-react';
export default function Publication({
  ready,
  show,
  onReady,
  onShow,
  teaser = true,
}: {
  ready: boolean;
  show: boolean;
  onReady: (ready: boolean) => void;
  onShow: (show: boolean) => void;
  teaser?: boolean;
}) {
  return (
    <div className="ex-publication">
      <fieldset>
        <legend>1. Preparación del contenido</legend>
        <div className="ex-segment">
          {[false, true].map((value) => (
            <label key={String(value)} data-checked={ready === value || undefined}>
              <input
                type="radio"
                name="preparation"
                checked={ready === value}
                onChange={() => onReady(value)}
              />
              {value ? <Check size={16} /> : <Clock3 size={16} />}{' '}
              {value ? 'Acabado' : 'En preparación'}
            </label>
          ))}
        </div>
        <p>Marcar Acabado no publica el contenido automáticamente.</p>
      </fieldset>
      <div className="ex-visibility">
        <div>
          {show ? <Eye size={20} /> : <EyeOff size={20} />}
          <span>
            <strong>2. Mostrar en la web</strong>
            <small>
              {!ready && !teaser
                ? 'Disponible cuando el contenido esté acabado.'
                : !ready
                  ? 'Mostrará un anuncio Próximamente, sin abrir la ficha.'
                  : 'Actívalo cuando quieras publicar la ficha completa.'}
            </small>
          </span>
        </div>
        <label className="ex-switch">
          <input
            type="checkbox"
            aria-label="Mostrar en la web"
            checked={show}
            disabled={!ready && !teaser}
            onChange={(e) => onShow(e.target.checked)}
          />
          <span aria-hidden="true" />
          <b>{show ? 'Sí' : 'No'}</b>
          <span className="sr-only">Mostrar en la web</span>
        </label>
      </div>
    </div>
  );
}
