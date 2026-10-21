import { RecordCard, CountryCard, type ViewProps } from './views';
import { entryResult, labels, type Result } from './model';
export default function Flujo(p: ViewProps) {
  if (p.area === 'countries')
    return (
      <div className="ex-countries-grid">
        {p.data.countries.map((c) => (
          <CountryCard key={c.id} country={c} {...p} />
        ))}
      </div>
    );
  const columns: Result[] = ['draft', 'ready', 'public', 'upcoming', 'blocked'];
  return (
    <div className="ex-board">
      {columns
        .filter(
          (col) =>
            p.entries.some((e) => entryResult(e, p.data.countries) === col) ||
            ['draft', 'ready', 'public'].includes(col),
        )
        .map((col) => (
          <section key={col} className="ex-column">
            <header>
              <span className={`ex-state-mark ex-state-mark--${col}`} />
              <h3>{labels[col]}</h3>
              <span>
                {p.entries.filter((e) => entryResult(e, p.data.countries) === col).length}
              </span>
            </header>
            {p.entries
              .filter((e) => entryResult(e, p.data.countries) === col)
              .map((e) => (
                <RecordCard key={e.id} entry={e} {...p} />
              ))}
            {!p.entries.some((e) => entryResult(e, p.data.countries) === col) && (
              <p className="ex-column-empty">Nada en este estado.</p>
            )}
          </section>
        ))}
    </div>
  );
}
