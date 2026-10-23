import { state, visible, filters, card, mapCanvas, countries, button } from './shared.js';
export default function () {
  const ds = visible();
  return `<div class="map-page list-first"><header class="map-titlebar"><div><p class="eyebrow">Explora sin perder el contexto</p><h1>Encuentra tu próxima parada.</h1></div><p role="status">${ds.length} destinos</p></header>${filters()}<div class="list-first-layout"><section aria-label="Destinos por país">${
    ds.length
      ? Object.entries(countries)
          .filter(([c]) => ds.some((d) => d.country === c))
          .map(
            ([code, name]) =>
              `<section class="country-group"><div class="section-head"><h2>${name}</h2><button class="text-button" data-country="${code}">Enfocar país ↗</button></div>${ds
                .filter((d) => d.country === code)
                .map((d) => card(d, true))
                .join('')}</section>`,
          )
          .join('')
      : `<div class="empty"><h2>No hay destinos con estos filtros</h2>${button('Limpiar filtros', 'clear', 'primary')}</div>`
  }</section><aside class="context-map"><h2>Tu selección, situada</h2><p class="muted">El mapa acompaña a la lista.</p>${mapCanvas()}${button('Encuadrar resultados', 'fit')}</aside></div></div>`;
}
