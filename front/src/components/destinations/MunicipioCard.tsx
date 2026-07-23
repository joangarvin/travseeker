import type { Municipio } from '../../types';

interface Props {
  municipio: Municipio;
  index?: number;
}

/** Ficha compacta de municipio: nombre, precio, tipología y conexiones. */
export default function MunicipioCard({ municipio, index = 0 }: Props) {
  const num = String(index + 1).padStart(2, '0');

  return (
    <article className="ui-card p-4 sm:p-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 hover:bg-[var(--color-surface-2)] transition-colors">
      <span className="font-mono text-sm text-[var(--color-muted)]/50 leading-none pt-1 select-none">{num}</span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 mb-2">
          <h3 className="font-serif text-lg font-medium text-[var(--color-primary)] tracking-tight">
            {municipio.nombre}
          </h3>
          {municipio.precios && (
            <span className="field-label text-[var(--color-brand-dark)] shrink-0">
              {municipio.precios.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}
            </span>
          )}
        </div>

        {municipio.tipoTurismo && (
          <div className="mb-2.5">
            <span className="field-label text-[var(--color-teja)] mr-2">Plan</span>
            <span
              className="text-sm text-[var(--color-muted)]"
              dangerouslySetInnerHTML={{ __html: municipio.tipoTurismo }}
            />
          </div>
        )}

        {municipio.conexiones && (
          <div>
            <span className="field-label text-[var(--color-teja)] mr-2">Cómo llegar</span>
            <span
              className="text-sm text-[var(--color-muted)] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: municipio.conexiones }}
            />
          </div>
        )}
      </div>
    </article>
  );
}
