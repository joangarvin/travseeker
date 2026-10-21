import { RecordTable, Badge, type ViewProps } from './views';
import { countryResult } from './model';
export default function Mesa(p: ViewProps) {
  return p.area === 'content' ? (
    <RecordTable {...p} />
  ) : (
    <div className="ex-table-wrap">
      <table className="ex-table">
        <thead>
          <tr>
            <th>País</th>
            <th>Catálogo</th>
            <th>Publicación</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {p.data.countries.map((c) => (
            <tr key={c.id}>
              <td>
                <strong>{c.name}</strong>
                <small>{c.id}</small>
              </td>
              <td>{p.data.entries.filter((e) => e.country === c.id).length} contenidos</td>
              <td>
                <Badge value={countryResult(c)} />
              </td>
              <td>
                <div className="ex-inline-actions">
                  <button className="ex-link" onClick={() => p.editCountry(c)}>
                    Gestionar
                  </button>
                  <button className="ex-link" onClick={() => p.selectCountry(c.id)}>
                    Ver contenido
                  </button>
                  <button className="ex-link" onClick={() => p.preview(c.id)}>
                    Vista pública
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
