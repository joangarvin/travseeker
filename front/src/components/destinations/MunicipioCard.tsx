import type { Municipio } from '../../types';

interface Props {
  municipio: Municipio;
}

export default function MunicipioCard({ municipio }: Props) {
  return (
    <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-brand)]/20 transition-colors">
      <h3 className="font-semibold text-[var(--color-primary)] mb-4 uppercase tracking-wide text-sm">
        {municipio.nombre}
      </h3>
      {municipio.precios && (
        <div className="mb-4">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-brand)] block mb-1.5">Precios</span>
          <div className="text-sm text-[var(--color-muted)]" dangerouslySetInnerHTML={{ __html: municipio.precios }} />
        </div>
      )}
      {municipio.conexiones && (
        <div className="mb-4">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-brand)] block mb-1.5">Conexiones</span>
          <div className="text-sm text-[var(--color-muted)] leading-relaxed" dangerouslySetInnerHTML={{ __html: municipio.conexiones }} />
        </div>
      )}
      {municipio.tipoTurismo && (
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-brand)] block mb-1.5">Tipo de turismo</span>
          <div className="text-sm text-[var(--color-muted)]" dangerouslySetInnerHTML={{ __html: municipio.tipoTurismo }} />
        </div>
      )}
    </div>
  );
}
