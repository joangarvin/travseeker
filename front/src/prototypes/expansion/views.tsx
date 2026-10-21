import { ArrowUpRight, Globe2, MapPin, Pencil, Eye } from 'lucide-react';
import {
  countryResult,
  entryResult,
  labels,
  type Country,
  type Entry,
  type Snapshot,
  type Result,
} from './model';
export type ViewProps = {
  data: Snapshot;
  entries: Entry[];
  edit: (e: Entry) => void;
  editCountry: (c: Country) => void;
  selectCountry: (id: string) => void;
  preview: (id: string) => void;
  area: 'content' | 'countries';
};
export function Badge({ value }: { value: Result }) {
  return <span className={`ex-badge ex-badge--${value}`}>{labels[value]}</span>;
}
export function RecordTable({ entries, data, edit }: Pick<ViewProps, 'entries' | 'data' | 'edit'>) {
  return (
    <div className="ex-table-wrap">
      <table className="ex-table">
        <thead>
          <tr>
            <th>Contenido</th>
            <th>País y región</th>
            <th>Preparación</th>
            <th>Resultado público</th>
            <th>
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id}>
              <td>
                <strong>{e.title}</strong>
                <small>{e.kind}</small>
              </td>
              <td>
                {data.countries.find((c) => c.id === e.country)?.name}
                <small>{e.region}</small>
              </td>
              <td>
                <span className={`ex-dot ${e.ready ? 'ex-dot--ready' : ''}`} />
                {e.ready ? 'Acabado' : 'En preparación'}
              </td>
              <td>
                <Badge value={entryResult(e, data.countries)} />
              </td>
              <td>
                <button
                  className="ex-icon"
                  aria-label={`Editar ${e.title}`}
                  onClick={() => edit(e)}
                >
                  <Pencil size={17} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function CountryCard({
  country,
  data,
  editCountry,
  selectCountry,
  preview,
}: Pick<ViewProps, 'data' | 'editCountry' | 'selectCountry' | 'preview'> & { country: Country }) {
  const list = data.entries.filter((e) => e.country === country.id);
  return (
    <article className="ex-country-card">
      <div className="ex-country-card-head">
        <span className="ex-country-code">{country.id}</span>
        <Badge value={countryResult(country)} />
      </div>
      <h3>{country.name}</h3>
      <p>
        {list.length} contenidos · {list.filter((e) => e.ready).length} acabados
      </p>
      <div className="ex-country-actions">
        <button className="ex-link" onClick={() => selectCountry(country.id)}>
          Ver contenido <ArrowUpRight size={16} />
        </button>
        <button
          className="ex-icon"
          aria-label={`Editar país ${country.name}`}
          onClick={() => editCountry(country)}
        >
          <Pencil size={17} />
        </button>
        <button
          className="ex-icon"
          aria-label={`Vista pública de ${country.name}`}
          onClick={() => preview(country.id)}
        >
          <Eye size={18} />
        </button>
      </div>
    </article>
  );
}
export function RecordCard({
  entry,
  data,
  edit,
}: Pick<ViewProps, 'data' | 'edit'> & { entry: Entry }) {
  return (
    <button className="ex-record-card" onClick={() => edit(entry)}>
      <span>
        {entry.kind} · {entry.region}
      </span>
      <strong>{entry.title}</strong>
      <Badge value={entryResult(entry, data.countries)} />
      <small>
        {entry.ready ? 'Acabado' : 'En preparación'} · Mostrar {entry.show ? 'sí' : 'no'}
        <ArrowUpRight size={15} />
      </small>
    </button>
  );
}
export function TerritoryIcon() {
  return (
    <span className="ex-territory-icon">
      <Globe2 size={20} />
      <MapPin size={16} />
    </span>
  );
}
