import {
  state,
  filters,
  visible,
  currentDestination,
  photo,
  mapCanvas,
  icon,
  button,
  countries,
  destinationLink,
} from './shared.js';
export default function () {
  const d = visible().find((d) => d.id === state.selected) || visible()[0];
  return `<div class="map-page atlas"><header class="map-titlebar"><div><p class="eyebrow">Elige en el territorio</p><h1>El mapa, tu punto de partida.</h1></div><p role="status">${visible().length} destinos</p></header>${filters()}<div class="atlas-layout">${mapCanvas()}<button class="button map-fit" data-action="fit">Encuadrar resultados ↗</button>${d ? `<article class="atlas-detail">${photo(d)}<div><p class="eyebrow">${countries[d.country]} · ${d.theme}</p><h2>${d.name}</h2><p>${d.summary}</p><div class="card-footer">${destinationLink(d, true)}${button('Siguiente →', 'next')}</div></div></article>` : `<div class="atlas-empty"><h2>Sin resultados</h2><p>Cambia los filtros para seguir explorando.</p>${button('Limpiar filtros', 'clear', 'primary')}</div>`}</div><p class="muted small">Toca un destino para ver su ficha. Al alejarte, los puntos se agrupan por país.</p></div>`;
}
