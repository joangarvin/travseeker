export const params = new URLSearchParams(location.search);
export const mode = 'mapa';
export const media = await fetch('./expansion-explorar/media.json').then((r) => r.json());
const spanish = await fetch('./expansion-explorar/spanish.json').then((r) => r.json());
export const countries = { ES: 'España', PT: 'Portugal', FR: 'Francia', MA: 'Marruecos' };
export const destinations = [
  {
    id: 'lisboa',
    name: 'Lisboa',
    country: 'PT',
    region: 'Área de Lisboa',
    theme: 'Cultural',
    lat: 38.7223,
    lng: -9.1393,
    image: media.Lisbon.image,
    summary: 'Miradores, barrios junto al Tajo y paseos sin prisa.',
    currency: 'Euro · EUR',
    language: 'Portugués',
    arrival: 'Aeropuerto de Lisboa y conexiones ferroviarias.',
    plans: ['Pasear por Alfama', 'Descubrir Belém', 'Ver el Tajo desde un mirador'],
  },
  {
    id: 'porto',
    name: 'Oporto',
    country: 'PT',
    region: 'Norte',
    theme: 'Cultural',
    lat: 41.1579,
    lng: -8.6291,
    image: media.Porto.image,
    summary: 'La Ribeira, puentes sobre el Duero y calles para perderse.',
  },
  {
    id: 'paris',
    name: 'París',
    country: 'FR',
    region: 'Île-de-France',
    theme: 'Cultural',
    lat: 48.8566,
    lng: 2.3522,
    image: media.Paris.image,
    summary: 'Museos, jardines y barrios a orillas del Sena.',
  },
  {
    id: 'nice',
    name: 'Niza',
    country: 'FR',
    region: 'Provenza-Alpes-Costa Azul',
    theme: 'Costa',
    lat: 43.7102,
    lng: 7.262,
    image: media.Nice.image,
    summary: 'Paseos mediterráneos y plazas en el casco antiguo.',
  },
  ...spanish.map((d) => {
    const i = ['Costa Blanca', 'Costa del Sol', 'Pinares de Soria y Burgos'].indexOf(d.name);
    return {
      ...d,
      originalId: d.id,
      id: ['blanca', 'sol', 'soria'][i],
      country: 'ES',
      region: ['Comunidad Valenciana', 'Andalucía', 'Castilla y León'][i],
      theme: i === 2 ? 'Naturaleza' : 'Costa',
      lat: [38.3452, 36.7213, 41.9][i],
      lng: [-0.481, -4.4214, -2.9][i],
      summary: [
        'Calas y paseos junto al Mediterráneo.',
        'Pueblos y ciudades junto al mar.',
        'Bosques, lagunas y pueblos de sierra.',
      ][i],
    };
  }),
];
export let state = {
  country: params.get('pais') || '',
  region: params.get('region') || '',
  theme: params.get('tema') || '',
  query: params.get('q') || '',
  selected: 'lisboa',
  view: 'mapa',
  tab: 'planes',
  scenario: params.get('escenario') || 'ampliado',
};
export function esc(v = '') {
  return String(v).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
}
export function icon(name) {
  const paths = {
    arrow: '<path d="M7 17 17 7M7 7h10v10"/>',
    pin: '<path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z"/><path d="M9 3v15m6-12v15"/>',
    heart:
      '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
    search: '<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>',
    filter: '<path d="M4 6h16M4 12h16M4 18h16M8 3v6m8 0v6m-6 0v6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    train:
      '<rect x="5" y="3" width="14" height="15" rx="4"/><path d="M5 11h14M9 18l-3 4m9-4 3 4M9 7h6"/>',
    globe:
      '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.arrow}</svg>`;
}
export function button(text, action, cls = 'secondary') {
  return `<button class="button ${cls}" data-action="${action}">${text}</button>`;
}
export function photo(d, cls = '') {
  return `<img class="${cls}" src="${esc(d.image)}" alt="${esc(d.name)}" decoding="async">`;
}
export function currentDestination() {
  return destinations.find((d) => d.id === state.selected) || destinations[0];
}
export function visible() {
  return destinations.filter(
    (d) =>
      (state.scenario !== 'espana' || d.country === 'ES') &&
      (!state.country || d.country === state.country) &&
      (!state.region || d.region === state.region) &&
      (!state.theme || d.theme === state.theme) &&
      (!state.query ||
        `${d.name} ${d.region} ${d.summary}`
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .includes(
            state.query
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, ''),
          )),
  );
}
export function options() {
  const allowed = state.scenario === 'espana' ? ['ES'] : ['ES', 'PT', 'FR'];
  return `<label>País<select data-filter="country"><option value="">Todos los países</option>${allowed.map((c) => `<option value="${c}" ${state.country === c ? 'selected' : ''}>${countries[c]}</option>`).join('')}</select></label><label>Región<select data-filter="region"><option value="">Todas las regiones</option>${[...new Set(destinations.filter((d) => (!state.country || state.country === d.country) && (state.scenario !== 'espana' || d.country === 'ES')).map((d) => d.region))].map((r) => `<option ${state.region === r ? 'selected' : ''}>${r}</option>`).join('')}</select></label>`;
}
export function filters() {
  return `<form class="explore-filters" id="map-filters"><div class="search">${icon('search')}<input aria-label="Buscar destinos" name="q" placeholder="Destino o región" value="${esc(state.query)}"><button class="button dark" type="submit">Buscar →</button></div><div class="filter-row">${options()}<label>Tipo de viaje<select data-filter="theme"><option value="">Todos los planes</option>${['Cultural', 'Costa', 'Naturaleza'].map((t) => `<option ${state.theme === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label><button class="text-button" type="button" data-action="clear">Limpiar</button></div></form>`;
}
export function card(d, compact = false) {
  return `<article class="destination-card ${compact ? 'compact' : ''} ${state.selected === d.id ? 'selected' : ''}">${photo(d)}<div><p class="eyebrow">${countries[d.country]} · ${d.region}</p><h3>${esc(d.name)}</h3><p>${esc(d.summary)}</p><div class="card-footer"><span>${d.theme}</span><button class="text-button" data-select="${d.id}">Ver en el mapa ${icon('pin')}</button>${destinationLink(d)}</div></div></article>`;
}
export function results() {
  const ds = visible();
  return ds.length
    ? ds.map((d) => card(d, true)).join('')
    : `<div class="empty"><h3>No hay destinos con estos filtros</h3><p>Prueba con otra región o elimina alguna preferencia.</p>${button('Limpiar filtros', 'clear', 'primary')}</div>`;
}
export function mapCanvas(cls = '') {
  return `<div class="map-wrap ${cls}"><div class="map-canvas" data-map></div><div class="map-request"><div>${icon('map')}<h3>Explora los destinos en el mapa</h3><p>Carga cartografía de OpenStreetMap para acercarte y elegir una parada. El proveedor recibirá tu IP y la zona consultada.</p>${button('Cargar mapa', 'load-map', 'primary')}</div></div><p class="map-error" hidden>No se ha podido cargar la cartografía. La lista sigue disponible. ${button('Reintentar', 'retry-map')}</p></div>`;
}
export function destinationLink(d, primary = false) {
  const cls = primary ? 'button primary' : 'text-button';
  return d.originalId
    ? `<a class="${cls}" href="/destino/${d.originalId}?lang=es#resumen">Ver ficha ${icon('arrow')}</a>`
    : `<button class="${cls}" data-action="destination:${d.id}">Ver detalles ${icon('arrow')}</button>`;
}
