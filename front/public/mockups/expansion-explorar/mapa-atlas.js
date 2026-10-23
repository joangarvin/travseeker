import {
  state,
  visible,
  photo,
  mapCanvas,
  icon,
  countries,
  destinationLink,
  esc,
  options,
} from './shared.js';
export function atlasSaved(id) {
  try {
    return JSON.parse(localStorage.getItem('trav-expansion-atlas-saved') || '[]').includes(id);
  } catch {
    return false;
  }
}
export function atlasCompared() {
  try {
    return JSON.parse(localStorage.getItem('trav-expansion-atlas-compare') || '[]');
  } catch {
    return [];
  }
}
export function filterCount() {
  return ['country', 'region', 'theme'].filter((k) => state[k]).length;
}
export function atlasDetail() {
  const ds = visible(),
    d = ds.find((d) => d.id === state.selected);
  if (!d || state.detailClosed)
    return `<div class="atlas-selection-hint"><span>${icon('pin')} Selecciona un destino en el mapa</span><button class="text-button" data-action="atlas-list">Ver la lista →</button></div>`;
  const i = ds.indexOf(d),
    expanded = state.detailExpanded;
  return `<article class="atlas-card ${expanded ? 'is-expanded' : ''}" aria-label="Destino seleccionado"><div class="atlas-card-photo">${photo(d)}<button class="icon-button atlas-save ${atlasSaved(d.id) ? 'is-saved' : ''}" data-action="atlas-save:${d.id}" aria-label="${atlasSaved(d.id) ? 'Quitar de guardados' : 'Guardar destino'}" aria-pressed="${atlasSaved(d.id)}">${icon('heart')}</button></div><div class="atlas-card-content"><div class="atlas-card-label"><p class="eyebrow">${countries[d.country]} · ${d.theme}</p><button class="icon-button" data-action="atlas-close" aria-label="Cerrar detalle">×</button></div><h2 id="selected-destination-name">${esc(d.name)}</h2><p class="atlas-region">${esc(d.region)}</p><div class="atlas-card-more" ${expanded ? '' : 'hidden'}><p>${esc(d.summary)}</p><div class="atlas-extra-actions"><button class="text-button" data-action="atlas-compare:${d.id}" aria-pressed="${atlasCompared().includes(d.id)}">${atlasCompared().includes(d.id) ? 'Quitar de comparación' : 'Comparar destino'}</button><button class="text-button" data-action="atlas-share">Compartir enlace ↗</button></div><p class="small muted">Muestra de diseño · no modifica tus viajes ni guardados reales.</p></div><div class="atlas-card-actions">${destinationLink(d, true)}<button class="text-button" data-action="atlas-expand" aria-expanded="${!!expanded}">${expanded ? 'Menos' : 'Más información'} <span aria-hidden="true">${expanded ? '↑' : '↓'}</span></button></div><div class="atlas-stepper"><button class="icon-button" data-action="atlas-prev" aria-label="Destino anterior" ${i <= 0 ? 'disabled' : ''}>←</button><span>${i + 1} de ${ds.length} ${ds.length === 1 ? 'destino' : 'destinos'}</span><button class="icon-button" data-action="atlas-next" aria-label="Destino siguiente" ${i === ds.length - 1 ? 'disabled' : ''}>→</button></div></div></article>`;
}
export function atlasList() {
  const ds = visible();
  return `<div class="atlas-results-heading"><h2>Resultados en el mapa</h2><span>${ds.length === 1 ? '1 destino' : `${ds.length} destinos`}</span></div>${ds.length ? ds.map((d) => `<article class="atlas-result ${state.selected === d.id ? 'is-selected' : ''}">${photo(d)}<div><p class="eyebrow">${countries[d.country]}</p><h3>${esc(d.name)}</h3><p>${esc(d.region)}</p><button class="text-button" data-select="${d.id}">Mostrar en el mapa ${icon('pin')}</button></div></article>`).join('') : `<div class="empty"><h2>No hay destinos con estos filtros</h2><p>Prueba otra búsqueda o limpia las preferencias.</p><button class="button primary" data-action="atlas-clear">Limpiar filtros</button></div>`}`;
}
export function atlasFilters() {
  return `<form id="atlas-filter-form"><p class="muted">Elige dónde y qué te apetece descubrir.</p><div class="atlas-filter-fields">${options().replaceAll('data-filter', 'data-draft')}<label>Tipo de viaje<select name="theme" data-draft="theme"><option value="">Todos los planes</option>${['Cultural', 'Costa', 'Naturaleza'].map((t) => `<option ${state.theme === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label></div><p class="small muted">El escenario ampliado incluye ejemplos de Portugal y Francia. No cambia el catálogo real.</p><div class="atlas-filter-actions"><button class="button secondary" type="button" data-action="atlas-reset-draft">Restablecer</button><button class="button primary" type="submit">Aplicar filtros</button></div></form>`;
}
export default function () {
  const ds = visible(),
    chips = [
      ['country', state.country && countries[state.country]],
      ['region', state.region],
      ['theme', state.theme],
      ['query', state.query],
    ].filter(([, v]) => v);
  return `<div class="map-page atlas atlas-refined"><div class="atlas-top"><a class="atlas-back" href="/">← <span>Volver a descubrir</span></a><div><p class="eyebrow">Explorar destinos</p><h1>Tu próxima parada.</h1></div><button class="icon-button" data-action="atlas-comparison" aria-label="Ver comparación de prueba">⇄<b class="atlas-compare-count">${atlasCompared().length}</b></button></div><div class="atlas-searchbar"><form id="atlas-search" role="search" aria-label="Buscar en el mapa">${icon('search')}<input type="search" name="q" value="${esc(state.query)}" aria-label="Buscar destinos en el mapa" placeholder="Destino o región" autocomplete="off"><button type="submit" class="button dark">Buscar <span aria-hidden="true">→</span></button></form><button class="button secondary atlas-filter-trigger" data-action="atlas-filters" aria-haspopup="dialog">${icon('filter')} Filtros ${filterCount() ? `<b>${filterCount()}</b>` : ''}</button></div><div class="atlas-status"><p role="status">${ds.length === 1 ? '1 destino' : `${ds.length} destinos`}${state.country ? ` en ${countries[state.country]}` : ''}<span> · datos de demostración</span></p><div class="atlas-view-switch" role="group" aria-label="Vista de Atlas"><button data-action="atlas-map" aria-pressed="${state.atlasView !== 'lista'}">${icon('map')} Mapa</button><button data-action="atlas-list" aria-pressed="${state.atlasView === 'lista'}">☷ Lista</button></div></div>${chips.length ? `<div class="atlas-chips" aria-label="Filtros aplicados">${chips.map(([key, value]) => `<button data-action="atlas-remove:${key}" aria-label="Quitar filtro ${esc(value)}">${esc(value)} <span aria-hidden="true">×</span></button>`).join('')}</div>` : ''}<div class="atlas-layout atlas-workspace ${state.atlasView === 'lista' ? 'show-list' : ''}"><div class="atlas-map-area">${mapCanvas()}<div class="atlas-map-controls"><button class="button" data-action="atlas-fit" aria-label="Encuadrar todos los resultados">${icon('pin')} <span>Ver todos</span></button></div>${!ds.length ? `<div class="atlas-no-results"><h2>No hay resultados</h2><p>Cambia los filtros para seguir explorando.</p><button class="button primary" data-action="atlas-clear">Limpiar filtros</button></div>` : ''}</div><section class="atlas-results" aria-label="Lista de resultados" ${state.atlasView === 'lista' ? '' : 'hidden'}>${atlasList()}</section><div class="atlas-detail-slot" ${state.atlasView === 'lista' ? 'hidden' : ''}>${ds.length ? atlasDetail() : ''}</div></div></div>`;
}
