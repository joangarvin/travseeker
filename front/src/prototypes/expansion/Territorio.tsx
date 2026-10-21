import { CountryCard, RecordCard, TerritoryIcon, type ViewProps } from './views';
export default function Territorio(p: ViewProps) {
  return p.area === 'countries' ? (
    <div className="ex-countries-grid">
      {p.data.countries.map((c) => (
        <CountryCard key={c.id} country={c} {...p} />
      ))}
    </div>
  ) : (
    <div className="ex-territory">
      <aside>
        <TerritoryIcon />
        <h3>Explorar el catálogo</h3>
        <p>Elige un país. El contexto se mantiene al cambiar de sección.</p>
        {p.data.countries.map((c) => (
          <button key={c.id} onClick={() => p.selectCountry(c.id)}>
            <span>{c.name}</span>
            <small>{p.data.entries.filter((e) => e.country === c.id).length}</small>
          </button>
        ))}
      </aside>
      <div className="ex-record-grid">
        {p.entries.map((e) => (
          <RecordCard key={e.id} entry={e} {...p} />
        ))}
      </div>
    </div>
  );
}
