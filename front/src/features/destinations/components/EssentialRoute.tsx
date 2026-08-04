import { ExternalLink, MapPinned, Route } from 'lucide-react';
import type { EssentialGroup } from '../../../types';
import { plain, safeHtml } from '../../../utils';

type EssentialRouteProps = {
  groups?: EssentialGroup[];
  legacyHtml?: string;
};

function groupAnchor(group: EssentialGroup, index: number) {
  return `imprescindible-${group.id || index + 1}`;
}

function openStreetMapUrl(latitude: number, longitude: number) {
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;
}

export function EssentialRoute({ groups = [], legacyHtml = '' }: EssentialRouteProps) {
  const populatedGroups = groups.filter((group) => group.items?.length);
  const totalItems = populatedGroups.reduce((total, group) => total + group.items.length, 0);
  if (!populatedGroups.length && !plain(legacyHtml)) return null;

  return (
    <section className="essential-route" aria-labelledby="essential-route-title">
      <header className="essential-route__intro">
        <div>
          <p className="kicker">Cuaderno de ruta</p>
          <h2 id="essential-route-title">Lo que da sentido al viaje</h2>
        </div>
        <p>
          Una selección ordenada para entender qué merece tiempo, cómo encaja cada parada y qué
          conviene preparar antes de ir.
        </p>
        {!!totalItems && (
          <div className="essential-route__count" aria-label={`${totalItems} imprescindibles`}>
            <Route aria-hidden="true" />
            <strong>{String(totalItems).padStart(2, '0')}</strong>
            <span>paradas esenciales</span>
          </div>
        )}
      </header>

      {populatedGroups.length > 1 && (
        <nav className="essential-route__nav" aria-label="Secciones de imprescindibles">
          <span>Ir a</span>
          {populatedGroups.map((group, index) => (
            <a href={`#${groupAnchor(group, index)}`} key={group.id || group.title}>
              {String(index + 1).padStart(2, '0')} {group.title}
            </a>
          ))}
        </nav>
      )}

      {populatedGroups.length ? (
        <div className="essential-route__groups">
          {populatedGroups.map((group, groupIndex) => (
            <section
              className="essential-route__group"
              id={groupAnchor(group, groupIndex)}
              key={group.id || group.title}
              aria-labelledby={`${groupAnchor(group, groupIndex)}-title`}
            >
              <header>
                <span>{String(groupIndex + 1).padStart(2, '0')}</span>
                <div>
                  <p>Tramo {groupIndex + 1}</p>
                  <h3 id={`${groupAnchor(group, groupIndex)}-title`}>{group.title}</h3>
                </div>
              </header>
              <ol>
                {group.items.map((item, itemIndex) => {
                  const previousItemCount = populatedGroups
                    .slice(0, groupIndex)
                    .reduce((total, previousGroup) => total + previousGroup.items.length, 0);
                  const number = previousItemCount + itemIndex + 1;
                  return (
                    <li key={item.id || `${group.id}-${number}`}>
                      <span className="essential-route__number" aria-hidden="true">
                        {String(number).padStart(2, '0')}
                      </span>
                      <div>
                        <h4>{item.title}</h4>
                        {item.description && <p>{item.description}</p>}
                      </div>
                      {item.place && (
                        <a
                          className="essential-route__map-link"
                          href={openStreetMapUrl(item.place.latitud, item.place.longitud)}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Abrir ${item.place.nombre} en OpenStreetMap`}
                        >
                          <MapPinned aria-hidden="true" />
                          <span>Abrir mapa</span>
                          <ExternalLink aria-hidden="true" />
                        </a>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      ) : (
        <div
          className="essential-route__legacy prose"
          dangerouslySetInnerHTML={{ __html: safeHtml(legacyHtml) }}
        />
      )}
    </section>
  );
}
