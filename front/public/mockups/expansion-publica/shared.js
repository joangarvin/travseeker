import { countries, destinations, scenarios, sources } from './data.js';
export const esc = (s = '') =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
export const arrow = '<span aria-hidden="true">↗</span>';
export const country = (s) => countries.find((c) => c.code === s.pais) || countries[0];
export const status = (code, s) => scenarios[s.escenario]?.[code] || 'hidden';
export const published = (s) => countries.filter((c) => status(c.code, s) === 'public');
export function url(s, values = {}) {
  const p = new URLSearchParams({ ...s, ...values });
  return '/mockups/expansion-publica.html?' + p;
}
export function link(s, values, label, classes = '') {
  return `<a data-go class="${classes}" ${['active', 'selected'].includes(classes) ? 'aria-current="page"' : ''} href="${url(s, values)}">${label}</a>`;
}
export function image(src, alt, extra = '') {
  return `<img src="${esc(src)}" alt="${esc(alt)}" ${extra} onerror="this.onerror=null;this.src='/brand/travseeker-logo.svg';this.classList.add('image-failed')">`;
}
export function shell(s, body) {
  return `<a class="skip" href="#main">Saltar al contenido</a><header class="site-header"><a data-go class="logo" aria-label="TravSeeker, inicio del prototipo" href="${url(s, { pagina: 'descubrir', region: 'todas', q: '' })}"><img src="/brand/travseeker-logo.svg" alt=""><strong>TravSeeker</strong></a><nav aria-label="Principal del prototipo">${link(s, { pagina: 'descubrir' }, 'Descubrir', s.pagina === 'descubrir' ? 'selected' : '')}<a href="#destinos">Destinos</a></nav><button class="icon-button" data-action="theme" aria-label="${s.oscuro === '1' ? 'Activar modo claro' : 'Activar modo oscuro'}">${s.oscuro === '1' ? '☀' : '☾'}</button></header><aside class="lab-bar" aria-label="Controles de demostración"><span><b>PROTOTIPO 3 + 4</b> · Datos de muestra</span><label>Escenario<select id="scenario"><option value="inicial" ${s.escenario === 'inicial' ? 'selected' : ''}>Inicio: solo España</option><option value="ampliado" ${s.escenario === 'ampliado' ? 'selected' : ''}>Expansión: 3 países</option><option value="completo" ${s.escenario === 'completo' ? 'selected' : ''}>Futuro: 4 países</option></select></label></aside><main id="main" tabindex="-1">${body}</main><footer class="site-footer"><p>El lugar correcto.<br><em>En el momento justo.</em></p><div><span>Exploración visual · sin cambios en el catálogo real.</span><button data-action="credits">Fotografías y datos ${arrow}</button></div></footer><dialog id="detail-dialog"><button class="dialog-close icon-button" aria-label="Cerrar ventana">×</button><div id="dialog-content"></div></dialog><p id="feedback" role="status" aria-live="polite"></p>`;
}
export function countriesTabs(s) {
  return `<nav class="country-tabs" aria-label="Seleccionar país">${link(s, { pais: 'todos', pagina: 'descubrir', region: 'todas', q: '' }, 'Todos los países', s.pais === 'todos' ? 'active' : '')}${published(
    s,
  )
    .map((c) =>
      link(s, { pais: c.code, region: 'todas', q: '' }, c.name, s.pais === c.code ? 'active' : ''),
    )
    .join('')}${countries
    .filter((c) => status(c.code, s) === 'upcoming')
    .map((c) => `<span class="soon-chip">${c.name}<small>Próximamente</small></span>`)
    .join('')}</nav>`;
}
export function search(s) {
  return `<form class="search" id="search-form"><label for="search-query" class="sr-only">Buscar un destino o región en la muestra</label><span aria-hidden="true">⌕</span><input id="search-query" name="q" value="${esc(s.q)}" placeholder="Destino o región" autocomplete="off"><button type="submit">Buscar <span aria-hidden="true">→</span></button></form>`;
}
export function themes(s) {
  return `<div class="theme-options" aria-label="Tipo de viaje">${['todos', 'Cultura', 'Costa', 'Naturaleza', 'Gastronomía'].map((v) => `<button data-theme-filter="${v}" aria-pressed="${s.tema === v}">${v === 'todos' ? 'Todos los planes' : v}</button>`).join('')}</div>`;
}
export function filterRows(s, countrySpecific = false) {
  const c = country(s);
  return `<div class="filters"><label>Región<select id="region"><option value="todas">Todas las regiones</option>${(countrySpecific ? c.regions : [...new Set(destinations.filter((d) => status(d.country, s) === 'public' && (s.pais === 'todos' || d.country === s.pais)).map((d) => d.region))]).map((r) => `<option ${s.region === r ? 'selected' : ''}>${esc(r)}</option>`).join('')}</select></label><label>Presupuesto orientativo<select id="budget">${['todos', 'Bajo', 'Medio', 'Alto'].map((x) => `<option value="${x}" ${s.presupuesto === x ? 'selected' : ''}>${x === 'todos' ? 'Cualquier presupuesto' : x}</option>`).join('')}</select></label><button data-action="reset" class="text-button">Limpiar filtros</button></div>`;
}
export function filtered(s) {
  return destinations.filter(
    (d) =>
      status(d.country, s) === 'public' &&
      (s.pais === 'todos' || d.country === s.pais) &&
      (s.tema === 'todos' || d.theme === s.tema) &&
      (s.region === 'todas' || d.region === s.region) &&
      (s.presupuesto === 'todos' || d.budget === s.presupuesto) &&
      (!s.q ||
        `${d.name} ${d.region} ${countries.find((c) => c.code === d.country).name}`
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .includes(
            s.q
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase(),
          )),
  );
}
export function card(d, s) {
  const saved = savedIds().includes(d.id);
  return `<article class="destination-card">${image(d.image, `Vista de ${d.name}`, 'loading="lazy"')}<button class="save icon-button" data-save="${d.id}" aria-label="${saved ? 'Quitar' : 'Guardar'} ${esc(d.name)}" aria-pressed="${saved}">${saved ? '♥' : '♡'}</button><div class="card-body"><span class="eyebrow">${countries.find((c) => c.code === d.country).name} · ${esc(d.region)}</span><h3><button class="card-title" data-detail="${d.id}">${esc(d.name)} ${arrow}</button></h3><p>${d.description}</p><div class="card-meta"><span>${d.theme}</span><span>Presupuesto ${d.budget.toLowerCase()}</span></div></div></article>`;
}
export function results(s, title = 'Lugares para tu próximo viaje') {
  const rows = filtered(s);
  const shown = s.pagina === 'descubrir' && s.mas !== '1' ? rows.slice(0, 6) : rows;
  return `<section id="destinos" class="results"><header class="section-heading"><div><span class="eyebrow">ELIGE TU PRÓXIMA PARADA</span><h2>${title}</h2></div><p role="status">${rows.length} ${rows.length === 1 ? 'destino de muestra' : 'destinos de muestra'}</p></header>${rows.length ? `<div class="destination-grid">${shown.map((d) => card(d, s)).join('')}</div>` : `<div class="empty"><h3>No hay resultados con esta combinación.</h3><p>Prueba con otro país, tipo de viaje o presupuesto.</p><button class="button primary" data-action="reset">Ver todos los planes</button></div>`}${shown.length < rows.length ? `<button class="button more-button" data-action="more">Mostrar ${rows.length - shown.length} destinos más ↓</button>` : ''}</section>`;
}
export function savedIds() {
  try {
    return JSON.parse(localStorage.getItem('trav-expansion-public-prototype-saved') || '[]');
  } catch {
    return [];
  }
}
export function upcoming(s) {
  const rows = countries.filter((c) => status(c.code, s) === 'upcoming');
  return rows.length
    ? `<aside class="upcoming"><span class="eyebrow">EL VIAJE CONTINÚA</span><h2>Estamos preparando ${rows.map((c) => c.name).join(' y ')}.</h2><p>Próximamente. Publicaremos sus guías cuando estén listas.</p><span class="status-label">Todavía sin fichas disponibles</span></aside>`
    : '';
}
export function countryCards(s, classes = '') {
  return `<div class="country-grid ${classes}">${countries
    .filter((c) => status(c.code, s) !== 'hidden')
    .map((c) =>
      status(c.code, s) === 'public'
        ? link(
            s,
            { pais: c.code, pagina: 'pais', region: 'todas', tema: 'todos', q: '' },
            `${image(c.image, c.alt)}<div><span class="eyebrow">${c.themes.join(' · ')}</span><h3>${c.name} ${arrow}</h3><span>Explorar el país</span></div>`,
            'country-card',
          )
        : `<article class="country-card country-soon">${image(c.image, c.alt)}<div><span class="status-label">Próximamente</span><h3>${c.name}</h3><p>Estamos preparando su guía.</p></div></article>`,
    )
    .join('')}</div>`;
}
export function countrySwitch(s) {
  return `<label class="country-select">Estás explorando<select id="country-select">${published(s)
    .map(
      (c) => `<option value="${c.code}" ${s.pais === c.code ? 'selected' : ''}>${c.name}</option>`,
    )
    .join('')}</select></label>`;
}
export function facts(c) {
  return `<dl class="facts"><div><dt>Para orientarte</dt><dd>${c.regions.length} regiones en esta muestra</dd></div><div><dt>Moneda</dt><dd>${c.currency}</dd></div><div><dt>Idiomas</dt><dd>${c.language}</dd></div></dl>`;
}
export function countryIntro(s, c) {
  return `<div class="country-photo">${image(c.image, c.alt)}<small>${c.caption}</small></div><div class="country-intro"><div><span class="eyebrow">${c.eyebrow}</span><h1 tabindex="-1">${c.name}<span>${c.headline}</span></h1></div><div><p>${c.description}</p><a class="button primary" href="#destinos">Explorar destinos <span aria-hidden="true">↓</span></a></div></div>`;
}
export function regions(s, c) {
  return `<section class="regions"><div class="section-heading"><h2>¿Por dónde empezamos?</h2><p>Elige una región de ${c.name}.</p></div><div class="region-options"><button data-region="todas" aria-pressed="${s.region === 'todas'}">Todas las regiones</button>${c.regions.map((r) => `<button data-region="${esc(r)}" aria-pressed="${s.region === r}">${esc(r)} ${arrow}</button>`).join('')}</div></section>`;
}
export function countryGate(s) {
  const c = country(s),
    state = status(c.code, s);
  if (state === 'public') return null;
  return `<section class="country-gate"><span class="eyebrow">${state === 'upcoming' ? 'PRÓXIMAMENTE' : 'CONTENIDO NO DISPONIBLE'}</span><h1 tabindex="-1">${state === 'upcoming' ? `Estamos preparando ${c.name}.` : 'Este país todavía no está disponible.'}</h1><p>${state === 'upcoming' ? 'Su ficha y sus destinos aparecerán cuando hayamos terminado la guía.' : 'Explora los países que ya tienen guías publicadas.'}</p>${link(s, { pagina: 'descubrir', pais: 'todos' }, 'Explorar países disponibles →', 'button primary')}</section>`;
}
export function detail(id, s) {
  const d = destinations.find((x) => x.id === id);
  if (!d || status(d.country, s) !== 'public') return '<h2>Esta ficha no está disponible.</h2>';
  return `${image(d.image, `Vista de ${d.name}`)}<span class="eyebrow">${countries.find((c) => c.code === d.country).name} · ${d.theme}</span><h2>${d.name}</h2><p>${d.description}</p><p class="muted">Vista de ejemplo. Los filtros, favoritos y la navegación funcionan dentro del prototipo.</p>${d.sample ? `<p>La ficha completa de este destino internacional aún no está implementada.</p>${link(s, { pagina: 'pais', pais: d.country, q: '', region: 'todas', tema: 'todos' }, 'Explorar el país →', 'button primary')}` : `<a class="button primary" href="/destino/${d.id}?lang=es" target="_blank" rel="noopener">Abrir la ficha actual ↗</a>`}`;
}
export function credits() {
  return `<h2>Fotografías y datos</h2><p>Prototipo aislado. Los estados de países, las fichas internacionales y sus categorías son ejemplos para evaluar la interfaz; no son publicaciones del catálogo real.</p><p>Las imágenes españolas proceden del catálogo actual. Fotografías internacionales enlazadas desde Wikimedia Commons; puedes consultar autoría y licencia desde las imágenes de estas páginas:</p><ul>${sources.map((p) => `<li><a href="${p.source}" target="_blank" rel="noopener">${p.name} · fuente de la fotografía ↗</a></li>`).join('')}</ul><p>Los favoritos se guardan únicamente en este navegador, bajo una clave exclusiva del prototipo.</p>`;
}
export const mapBoxes = {
  ES: [-9.5, 35.5, 4.4, 43.8],
  PT: [-9.7, 36.8, -6.1, 42.2],
  FR: [-5.2, 41.3, 9.6, 51.2],
  MA: [-13.2, 27.2, -0.8, 35.9],
};
export function mapPanel(c) {
  return `<details class="country-map" data-map-code="${c.code}"><summary><span>Ubicar ${c.name}<small>OpenStreetMap · se carga al abrir</small></span><b>Ver mapa <span aria-hidden="true">↗</span></b></summary><div class="map-frame"></div></details>`;
}
export function destinationHome(s, section) {
  const featured = destinations[0];
  return `<section class="discovery-hero wrap"><div><span class="eyebrow">GUÍA DE VIAJEROS</span><h1 tabindex="-1">TravSeeker,<br><em>Donde empieza<br>tu viaje.</em></h1><p class="lead">Compara afluencia, presupuesto y mejor momento. El viaje empieza tomando una buena decisión.</p>${search(s)}</div><div class="hero-photo">${image(featured.image, 'Vista de la Costa Blanca')}<div class="photo-caption"><span>Costa Blanca</span><button class="button light" data-detail="${featured.id}">Ver destino ↗</button></div></div></section><div class="wrap destination-first"><header class="section-heading"><div><span class="eyebrow">¿QUÉ QUIERES QUE PASE?</span><h2>Encuentra tu forma de viajar.</h2></div></header>${themes(s)}<details class="home-filter-details" ${s.filtros === '1' ? 'open' : ''}><summary>Afinar búsqueda <span>Región y presupuesto</span></summary>${filterRows(s)}</details>${results(s, 'Sitios que merecen el viaje')}</div><section id="paises" class="country-secondary wrap" tabindex="-1"><header class="section-heading"><div><span class="eyebrow">OTRA FORMA DE EXPLORAR</span><h2>¿Prefieres empezar por un país?</h2></div><p>Encuentra sus destinos, regiones y planes.</p></header>${section}<p class="country-secondary-note">Seguimos ampliando las guías para que encuentres más destinos.</p></section>`;
}
export function countryList(s) {
  return `<div class="country-list">${countries
    .filter((c) => status(c.code, s) !== 'hidden')
    .map((c, i) =>
      status(c.code, s) === 'public'
        ? link(
            s,
            { pais: c.code, pagina: 'pais', region: 'todas', tema: 'todos', q: '' },
            `<span class="country-list-number">0${i + 1}</span>${image(c.image, c.alt)}<div><h3>${c.name}</h3><p>${c.themes.join(' · ')}</p></div><span class="country-list-action">Explorar destinos ${arrow}</span>`,
            'country-list-row',
          )
        : `<article class="country-list-row"><span class="country-list-number">0${i + 1}</span>${image(c.image, c.alt)}<div><h3>${c.name}</h3><p>Estamos preparando su guía.</p></div><span class="status-label">Próximamente</span></article>`,
    )
    .join('')}</div>`;
}
