import { Eye, Pencil, ArrowUpRight } from 'lucide-react';
import { labels, type Result, type Country, type Entry } from './model';
export function Badge({ value }: { value: Result }) {
  return <span className={`ex-badge ex-badge--${value}`}>{labels[value]}</span>;
}
export function Flow({
  entries,
  onEdit,
  onOpen,
}: {
  entries: Entry[];
  onEdit: (entry: Entry) => void;
  onOpen: (entry: Entry) => void;
}) {
  if (!entries.length) return null;
  const columns: Result[] = ['draft', 'ready', 'public', 'upcoming', 'blocked'];
  return (
    <div className="ex-board">
      {columns
        .filter(
          (state) =>
            entries.some((e) => e.state === state) || ['draft', 'ready', 'public'].includes(state),
        )
        .map((state) => (
          <section
            className="ex-column"
            key={state}
            data-empty={!entries.some((e) => e.state === state) || undefined}
          >
            <header>
              <span className={`ex-state-mark ex-state-mark--${state}`} />
              <h3>{labels[state]}</h3>
              <span>{entries.filter((e) => e.state === state).length}</span>
            </header>
            {entries
              .filter((e) => e.state === state)
              .map((entry) => (
                <article key={entry.id} className="ex-record-card">
                  <span>
                    {entry.global ? 'Catálogo global' : entry.region || entry.countryCode}
                  </span>
                  <button className="ex-record-title" onClick={() => onOpen(entry)}>
                    <strong>{entry.title}</strong>
                    <ArrowUpRight size={16} />
                  </button>
                  <button
                    className="ex-publication-action"
                    onClick={() => onEdit(entry)}
                    aria-label={`Publicación de ${entry.title}`}
                  >
                    <Badge value={state} />
                  </button>
                  <small>
                    {entry.preparationComplete ? 'Acabado' : 'En preparación'} · Mostrar{' '}
                    {entry.showOnWebsite ? 'sí' : 'no'}
                  </small>
                  <button className="ex-link" onClick={() => onOpen(entry)}>
                    Editar ficha <Pencil size={14} />
                  </button>
                </article>
              ))}
            {!entries.some((e) => e.state === state) && (
              <p className="ex-column-empty">No hay fichas en esta página.</p>
            )}
          </section>
        ))}
    </div>
  );
}
export function Countries({
  countries,
  onEdit,
  onSelect,
  onPreview,
}: {
  countries: Country[];
  onEdit: (country: Country) => void;
  onSelect: (code: string) => void;
  onPreview: (code: string) => void;
}) {
  return (
    <div className="ex-countries-grid">
      {countries.map((country) => (
        <article className="ex-country-card" key={country.code}>
          <div className="ex-country-card-head">
            <span className="ex-country-code">{country.code}</span>
            <Badge value={country.state} />
          </div>
          <h3>{country.name}</h3>
          <p>
            {country.contentCount} contenidos · {country.completeCount} acabados
          </p>
          <div className="ex-country-actions">
            <button className="ex-link" onClick={() => onSelect(country.code)}>
              Ver contenido <ArrowUpRight size={16} />
            </button>
            <button
              className="ex-icon"
              aria-label={`Editar país ${country.name}`}
              onClick={() => onEdit(country)}
            >
              <Pencil size={17} />
            </button>
            <button
              className="ex-icon"
              aria-label={`Vista pública de ${country.name}`}
              onClick={() => onPreview(country.code)}
            >
              <Eye size={18} />
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
