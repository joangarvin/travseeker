const photo =
  'https://res.cloudinary.com/dq5npqrdd/image/upload/v1784293418/travseeker/destinos/e544b90a-8cc4-4020-bd2f-4bb032f88c32.jpg';
const destination = '/destino/e544b90a-8cc4-4020-bd2f-4bb032f88c32?lang=es#bases';
const paths = {
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  pin: '<path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  heart: '<path d="M20 5c-3-3-7-1-8 2-1-3-5-5-8-2-4 4 1 10 8 15 7-5 12-11 8-15Z"/>',
  plus: '<path d="M12 4v16M4 12h16"/>',
  map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2ZM9 3v16m6-14v16"/>',
  waves: '<path d="M2 8q3-3 5 0t5 0 5 0 5 0M2 13q3-3 5 0t5 0 5 0 5 0M2 18q3-3 5 0t5 0 5 0 5 0"/>',
  landmark: '<path d="m3 9 9-6 9 6H3Zm2 2v7m5-7v7m4-7v7m5-7v7M3 21h18"/>',
  bed: '<path d="M3 7v14m18-14v14M3 17h18M3 13h18v4H3Zm3 0V8h5v5m2 0V8h5v5"/>',
  food: '<path d="M4 3v7m4-7v7M6 3v18m-2-11h4M17 3v18m0-18c-4 5-4 10 0 10"/>',
  train:
    '<rect x="5" y="3" width="14" height="15" rx="4"/><path d="M5 10h14M9 3v7m6-7v7M8 18l-3 4m11-4 3 4"/><circle cx="8" cy="14" r="1"/><circle cx="16" cy="14" r="1"/>',
  walk: '<circle cx="13" cy="4" r="2"/><path d="m8 12 3-4 4 5h4M11 8l-1 9-4 5m4-5 6 5"/>',
  car: '<path d="m4 10 2-6h12l2 6M3 10h18v8H3Zm2 8v3m14-3v3M6 14h2m8 0h2"/>',
};
paths.expand = '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>';
const icon = (name) =>
  `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.pin}</svg>`;
const items = [
  {
    id: 'paseo',
    category: 'actividades',
    title: 'Paseo por el casco antiguo',
    kind: 'Patrimonio',
    meta: '1–2 h · A pie · Gratis',
    description: 'Una ruta tranquila entre calles pequeñas, plazas y miradores junto al mar.',
    art: 'heritage',
    icon: 'landmark',
    x: 49,
    y: 49,
  },
  {
    id: 'playa',
    category: 'actividades',
    title: 'Una mañana junto al mar',
    kind: 'Costa',
    meta: '2–3 h · Al aire libre',
    description: 'Un plan de playa para combinar con un paseo por el frente marítimo.',
    art: 'water',
    icon: 'waves',
    x: 65,
    y: 63,
  },
  {
    id: 'ruta',
    category: 'actividades',
    title: 'Ruta de arquitectura y cultura',
    kind: 'Cultura',
    meta: '2 h · A pie · Ejemplo desde 12 €',
    description:
      'Un recorrido de ejemplo por el patrimonio y los espacios culturales del municipio.',
    art: 'heritage',
    icon: 'landmark',
    x: 38,
    y: 37,
  },
  {
    id: 'hotel',
    category: 'alojamientos',
    title: 'Hotel junto al paseo',
    kind: 'Hotel · Ejemplo ficticio',
    meta: 'Desde 110 €/noche · Precio de ejemplo',
    description:
      'Habitación doble, recepción y ubicación junto al paseo. Un ejemplo de cómo presentar un hotel.',
    art: 'bed',
    icon: 'bed',
    x: 54,
    y: 56,
  },
  {
    id: 'apartamento',
    category: 'alojamientos',
    title: 'Apartamento en el centro',
    kind: 'Apartamento · Ejemplo ficticio',
    meta: 'Desde 95 €/noche · Precio de ejemplo',
    description:
      'Cocina, dos plazas y una ubicación céntrica. Una alternativa para quedarse varias noches.',
    art: 'bed',
    icon: 'bed',
    x: 43,
    y: 44,
  },
  {
    id: 'casa',
    category: 'alojamientos',
    title: 'Casa de huéspedes',
    kind: 'Alojamiento · Ejemplo ficticio',
    meta: 'Desde 75 €/noche · Precio de ejemplo',
    description: 'Una opción sencilla con zonas comunes y habitaciones privadas.',
    art: 'bed',
    icon: 'bed',
    x: 30,
    y: 31,
  },
  {
    id: 'restaurante',
    category: 'restaurantes',
    title: 'Cocina marinera',
    kind: 'Mediterránea · Ejemplo ficticio',
    meta: '25–40 €/persona · Precio de ejemplo',
    description:
      'Un restaurante de ejemplo para presentar cocina, presupuesto y opciones de reserva verificadas.',
    art: 'food',
    icon: 'food',
    x: 59,
    y: 53,
  },
  {
    id: 'tapas',
    category: 'restaurantes',
    title: 'Tapas en el casco antiguo',
    kind: 'Tapas · Ejemplo ficticio',
    meta: '15–25 €/persona · Precio de ejemplo',
    description: 'Platos para compartir y mesas pequeñas en una zona céntrica.',
    art: 'food',
    icon: 'food',
    x: 47,
    y: 40,
  },
  {
    id: 'vegetal',
    category: 'restaurantes',
    title: 'Mesa vegetal',
    kind: 'Vegetariana · Ejemplo ficticio',
    meta: '20–30 €/persona · Precio de ejemplo',
    description:
      'Un establecimiento de ejemplo con opciones vegetarianas para comparar lugares donde comer.',
    art: 'food',
    icon: 'food',
    x: 33,
    y: 47,
  },
];
const directions = {
  guia: 'Guía del municipio · Fotografía protagonista, contexto y secciones para explorar con calma.',
  base: 'Tu base de viaje · Ficha compacta y lugares organizados en una lista para planificar.',
  mapa: 'Lugares en el mapa · Selecciona un lugar y consulta su posición; en móvil alterna entre mapa y lista.',
};
let view = new URLSearchParams(location.search).get('vista') || 'guia';
if (!directions[view]) view = 'guia';
let mobile = new URLSearchParams(location.search).get('movil') === '1',
  category = 'actividades',
  panel = 'lista',
  selected = 'paseo',
  expanded = false;
let state = { saved: [], activities: {}, bases: {} };
try {
  const restored = JSON.parse(sessionStorage.getItem('travseeker-municipio-demo') || 'null');
  if (restored && Array.isArray(restored.saved)) state = { ...state, ...restored };
} catch {
  /* Demo works without storage. */
}
const site = document.querySelector('#site'),
  main = document.querySelector('#contenido'),
  dialog = document.querySelector('#dialog');
let opener = null,
  toastTimer;
function persist() {
  try {
    sessionStorage.setItem('travseeker-municipio-demo', JSON.stringify(state));
  } catch {
    /* Keep the in-memory demo. */
  }
}
function toast(message) {
  const node = document.querySelector('#status');
  node.textContent = message;
  node.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('visible'), 4200);
}
function saved(id) {
  return state.saved.includes(id);
}
const button = (text, action, style = '') =>
  `<button class="button ${style}" ${action}>${text}</button>`;
function saveButton(id) {
  return `<button class="icon-button" data-save="${id}" aria-label="${saved(id) ? 'Quitar de guardados' : 'Guardar'}: ${items.find((i) => i.id === id)?.title || 'Sitges'}" aria-pressed="${saved(id)}">${icon('heart')}</button>`;
}
function municipalityCover() {
  return `<header class="municipio-cover municipio-cover--${view}">
    <nav class="cover-topline" aria-label="Ruta del municipio"><a href="${destination}">← Costa del Garraf</a><span>Destinos / Municipios / Sitges</span></nav>
    <figure class="cover-media"><img src="${photo}" alt="Litoral de la Costa del Garraf, fotografía de referencia" fetchpriority="high"><button class="cover-photo-open" data-photo aria-haspopup="dialog">${icon('expand')} Ver foto completa</button></figure>
    <div class="cover-shade" aria-hidden="true"></div>
    <div class="cover-layout"><div class="cover-intro"><p class="cover-location">${icon('pin')} Costa del Garraf · Barcelona</p><h1>Sitges</h1><div class="cover-tags"><span>${icon('landmark')} Patrimonio</span><span>${icon('waves')} Costa</span><span>${icon('food')} Gastronomía</span></div><p class="cover-caption">Ficha de municipio</p></div>
    <aside class="cover-card"><p class="eyebrow">Organiza tu estancia</p><h2>Tu base en el Garraf</h2><p>Elige dónde quedarte y reúne los lugares que quieres visitar.</p><div class="cover-links"><button data-cover-category="actividades">Qué hacer ${icon('arrow')}</button><button data-cover-category="alojamientos">Dónde dormir ${icon('arrow')}</button><button data-cover-category="restaurantes">Dónde comer ${icon('arrow')}</button></div><div class="actions">${button(icon('plus') + ' Elegir como base', 'data-base', 'sun')}${saveButton('sitges')}</div></aside></div>
  </header>`;
}
function description() {
  return `<p id="descripcion">${expanded ? 'Una propuesta de estancia entre patrimonio, paseos y planes junto al mar. Esta ficha reúne actividades, alojamientos y restaurantes para que puedas elegir una base y organizar el día sin perder el contexto del destino. La versión definitiva incluirá la descripción editorial verificada del municipio.' : 'Una propuesta de estancia entre patrimonio, paseos y planes junto al mar. Encuentra qué hacer, dónde dormir y dónde comer desde una misma ficha.'}</p><button class="text-button" data-description aria-expanded="${expanded}" aria-controls="descripcion">${expanded ? 'Leer menos' : 'Leer más sobre el municipio'}</button>`;
}
function chips() {
  return '<div class="chips"><span class="chip">Patrimonio</span><span class="chip">Costa</span><span class="chip">Gastronomía</span></div>';
}
function facts() {
  return '<div class="facts"><div><b>A pie</b><span>Para explorar el centro</span></div><div><b>1–3 días</b><span>Estancia de ejemplo</span></div><div><b>Tren</b><span>Consultar conexiones</span></div></div>';
}
function mapMarkup(full = false) {
  const visible = full
    ? items.filter((item) => category === 'todos' || item.category === category)
    : items.filter((item) => item.category === 'actividades');
  const current = items.find((item) => item.id === selected);
  return `<div class="mapbox"><svg viewBox="0 0 600 500" preserveAspectRatio="none" aria-hidden="true"><rect width="600" height="500" fill="#edf0e4"/><path d="M0 340 110 348 205 320 290 338 395 302 600 255V500H0Z" fill="#b8dce5"/><path d="M0 330 110 338 205 310 290 328 395 292 600 245" fill="none" stroke="#fff0be" stroke-width="18"/><g stroke="#fff" stroke-width="13" fill="none"><path d="M-20 170 170 175 285 247 450 174 630 175M70 -10 150 140 170 340M300 -10 275 180 290 330M520 0 435 150 410 293M0 275 240 270 360 242 600 200"/></g><path d="M0 90 190 105 335 91 600 80" fill="none" stroke="#777c87" stroke-width="5" stroke-dasharray="6 5"/><g fill="#d4dfc1"><rect x="20" y="195" width="60" height="40" rx="10"/><rect x="335" y="140" width="50" height="65" rx="12"/></g><g font-family="Manrope,sans-serif" font-size="13" fill="#567078"><text x="83" y="124">Estación</text><text x="225" y="203">Centro</text><text x="295" y="394">Mediterráneo</text></g></svg><span class="map-title">Sitges · Mapa de demostración</span>${visible.map((item) => `<button class="pin" style="left:${item.x}%;top:${item.y}%" data-pin="${item.id}" aria-label="Ver en mapa: ${item.title}" aria-pressed="${selected === item.id}">${items.indexOf(item) + 1}</button>`).join('')}${full && visible.some((item) => item.id === selected) ? `<div class="map-selection"><h3>${current.title}</h3><div class="meta">${current.meta}</div>${button('Ver ficha ' + icon('arrow'), `data-detail="${current.id}"`, 'small')} ${saveButton(current.id)}</div>` : ''}<span class="map-caption">Esquema ilustrativo · Posiciones de ejemplo · No válido para navegar</span></div>`;
}
function art(item, tag = true) {
  return `<div class="card-art art-${item.art}">${icon(item.icon)}${tag ? `<span class="art-tag">${item.kind}</span>` : ''}</div>`;
}
function card(item, row = false) {
  if (row)
    return `<article class="list-card ${selected === item.id && view === 'mapa' ? 'selected' : ''}">${art(item, false)}<div><div class="eyebrow">${item.kind}</div><h3>${item.title}</h3><p>${item.description}</p><div class="meta">${item.meta}</div></div><div class="row-actions">${button('Ver ficha ' + icon('arrow'), `data-detail="${item.id}"`, 'small')}${view === 'mapa' ? button(icon('pin'), `data-pin="${item.id}" aria-label="Situar ${item.title} en el mapa"`, 'small') : saveButton(item.id)}</div></article>`;
  return `<article class="card">${art(item)}<div class="card-body"><h3>${item.title}</h3><div class="meta">${item.meta}</div><p>${item.description}</p><div class="card-foot">${button(item.category === 'actividades' ? 'Ver actividad ' + icon('arrow') : 'Ver ficha ' + icon('arrow'), `data-detail="${item.id}"`, 'small')}${saveButton(item.id)}</div></div></article>`;
}
function tabs(all = false) {
  const names = {
    actividades: 'Qué hacer',
    alojamientos: 'Dónde dormir',
    restaurantes: 'Dónde comer',
    ...(all ? { todos: 'Todos' } : {}),
  };
  return `<div class="filter-tabs" role="group" aria-label="Tipo de lugar">${Object.entries(names)
    .map(
      ([key, name]) =>
        `<button data-category="${key}" aria-pressed="${category === key}">${name}</button>`,
    )
    .join('')}</div>`;
}
function transport() {
  return `<section class="section" id="conexiones"><div class="section-head"><div><div class="eyebrow">Llegar y moverse</div><h2>Una base bien conectada</h2></div></div><div class="transport"><div>${icon('train')}<h3>Transporte público</h3><p>Conexiones, estación y enlaces oficiales reunidos en un mismo lugar.</p>${button('Consultar ejemplo', 'data-connections', 'small')}</div><div>${icon('walk')}<h3>Dentro del municipio</h3><p>Información sobre recorridos a pie, accesibilidad y desplazamientos locales.</p></div><div>${icon('car')}<h3>Si vienes en coche</h3><p>Ubicación de aparcamientos y recomendaciones editoriales verificadas.</p></div></div></section>`;
}
function guide() {
  return `${municipalityCover()}<div class="wrap"><nav class="jump" aria-label="Secciones del municipio"><a href="#sobre">Sobre Sitges</a><a href="#actividades">Qué hacer</a><a href="#alojamientos">Dónde dormir</a><a href="#restaurantes">Dónde comer</a><a href="#conexiones">Cómo llegar</a></nav><section class="intro-grid" id="sobre"><div><div class="eyebrow">El municipio</div><h2>Sobre Sitges</h2>${description()}${chips()}${facts()}</div><div class="map-preview">${mapMarkup()}${button(icon('map') + ' Explorar los lugares en el mapa', 'data-explore', 'small')}</div></section>${[
    ['actividades', 'Qué hacer en Sitges', 'Patrimonio, paseos y planes junto al mar.'],
    [
      'alojamientos',
      'Encuentra dónde quedarte',
      'Opciones de ejemplo para comparar zonas y tipos de alojamiento.',
    ],
    ['restaurantes', 'Una mesa para cada plan', 'Cocina, presupuesto y ubicación antes de elegir.'],
  ]
    .map(
      ([key, title, subtitle]) =>
        `<section class="section" id="${key}"><div class="section-head"><div><div class="eyebrow">${key === 'actividades' ? 'Explorar' : key === 'alojamientos' ? 'Descansar' : 'Saborear'}</div><h2>${title}</h2><p>${subtitle}</p></div></div><div class="cards">${items
          .filter((item) => item.category === key)
          .map((item) => card(item))
          .join('')}</div></section>`,
    )
    .join('')}${transport()}</div>`;
}
function base() {
  return `${municipalityCover()}<div class="wrap"><div class="base-grid"><aside class="base-aside"><div class="eyebrow">El municipio</div><h2>Sobre Sitges</h2><div class="lead">${description()}</div>${facts()}<div class="map-preview" style="margin-top:24px">${mapMarkup()}${button('Ver los lugares en el mapa', 'data-explore', 'small')}</div></aside><div class="base-main"><div class="eyebrow">Organiza tu estancia</div><h2>Todo alrededor de tu base</h2><p class="muted">Elige qué necesitas y guarda tus opciones para el viaje.</p>${tabs()}<p class="count-label">${items.filter((item) => item.category === category).length} propuestas · Datos de ejemplo</p>${items
    .filter((item) => item.category === category)
    .map((item) => card(item, true))
    .join(
      '',
    )}<section class="base-callout"><h3>¿Te quedas en Sitges?</h3><p>Asigna esta base a un día de tu viaje. Las actividades elegidas se añaden por separado.</p>${button('Elegir los días ' + icon('arrow'), 'data-base', 'sun')}</section><div style="margin-top:42px">${transport()}</div></div></div></div>`;
}
function atlas() {
  const visible = items.filter((item) => category === 'todos' || item.category === category);
  return `${municipalityCover()}<div class="wrap"><section class="atlas-heading"><div><p class="eyebrow">Explora el municipio</p><h2>Lugares en Sitges</h2><p class="muted">Relaciona lo que quieres hacer con dónde está.</p></div></section><div class="atlas-mobile-toggle" role="group" aria-label="Modo de exploración"><button data-panel="lista" aria-pressed="${panel === 'lista'}">${icon('walk')} Lista de lugares</button><button data-panel="mapa" aria-pressed="${panel === 'mapa'}">${icon('map')} Ver mapa</button></div><div class="atlas-layout" data-panel="${panel}">${mapMarkup(true)}<section class="atlas-list" aria-label="Lugares del municipio">${tabs(true)}<p class="count-label">${visible.length} lugares · Categorías y ubicaciones de ejemplo</p>${visible.map((item) => card(item, true)).join('')}</section></div></div>`;
}
function syncChrome() {
  site.classList.toggle('phone', mobile);
  document.querySelector('[data-mobile]').setAttribute('aria-pressed', String(mobile));
  document.querySelector('[data-mobile]').textContent = mobile ? 'Vista completa' : 'Vista móvil';
  document
    .querySelectorAll('[data-view]')
    .forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
  document.querySelector('#direction').textContent = directions[view];
  document.querySelector('#saved-count').textContent = state.saved.length;
  const url = new URL(location);
  url.searchParams.set('vista', view);
  if (mobile) url.searchParams.set('movil', '1');
  else url.searchParams.delete('movil');
  history.replaceState(null, '', url);
}
function render() {
  main.innerHTML = view === 'guia' ? guide() : view === 'base' ? base() : atlas();
  syncChrome();
}
function switchView(next) {
  view = next;
  category = 'actividades';
  panel = 'lista';
  render();
  scrollTo({ top: 0, behavior: 'instant' });
}
function openDialog(content, trigger) {
  opener = trigger;
  document.querySelector('#dialog-content').innerHTML = content;
  dialog.showModal();
}
function details(item, trigger) {
  openDialog(
    `<div class="eyebrow">${item.kind}</div><h2 id="dialog-title">${item.title}</h2><div class="meta">${item.meta}</div><p style="margin-top:22px">${item.description}</p><p>Ficha de demostración. En la versión final se mostrarán dirección, información verificada y enlaces oficiales cuando estén disponibles.</p><div class="dialog-actions">${item.category === 'actividades' ? button(icon('plus') + ' Añadir a un día', `data-plan="${item.id}"`, 'primary') : button(icon('heart') + ' ' + (saved(item.id) ? 'Quitar de guardados' : 'Guardar este lugar'), `data-save="${item.id}"`, 'primary')}${button(icon('pin') + ' Ver ubicación', `data-locate="${item.id}"`)}</div>`,
    trigger,
  );
}
function chooseDay(id, isBase, trigger) {
  if (dialog.open) dialog.close();
  openDialog(
    `<div class="eyebrow">Viaje de demostración</div><h2 id="dialog-title">${isBase ? 'Elegir Sitges como base' : 'Añadir al itinerario'}</h2><p>${isBase ? 'Asigna el municipio como base para el día elegido.' : items.find((item) => item.id === id).title}</p><label for="demo-day">Día de «Escapada al Garraf»</label><select id="demo-day"><option value="1">Día 1 · Costa del Garraf</option><option value="2">Día 2 · Costa del Garraf</option><option value="3">Día 3 · Costa del Garraf</option></select><p>Se guarda únicamente en esta demostración.</p><div class="dialog-actions">${button('Cancelar', 'data-close')}${button(isBase ? 'Asignar base' : 'Añadir actividad', `data-confirm="${id}" data-is-base="${isBase}"`, 'primary')}</div>`,
    trigger,
  );
}
function savedDialog(trigger) {
  openDialog(
    `<h2 id="dialog-title">Tus ideas para Sitges</h2><p>Guardados y planificación de esta demostración.</p>${state.saved.length ? state.saved.map((id) => `<div class="saved-row"><div><b>${id === 'sitges' ? 'Sitges' : items.find((item) => item.id === id).title}</b><br><span>${id === 'sitges' ? 'Municipio' : items.find((item) => item.id === id).kind}</span></div>${button('Quitar', `data-save="${id}"`, 'small')}</div>`).join('') : '<p class="empty">Todavía no has guardado lugares. Usa el corazón de una ficha para añadirlos aquí.</p>'}${Object.entries(
      state.activities,
    )
      .map(
        ([day, ids]) =>
          `<div class="saved-row"><div><b>Día ${day}</b><br><span>${ids.map((id) => items.find((item) => item.id === id).title).join(' · ')}</span></div></div>`,
      )
      .join('')}${Object.keys(state.bases)
      .map((day) => `<p class="meta">Día ${day} · Base: Sitges</p>`)
      .join('')}`,
    trigger,
  );
}
document.addEventListener('click', (event) => {
  const target = event.target.closest('button');
  if (!target) return;
  if (target.hasAttribute('data-photo')) {
    openDialog(
      `<h2 id="dialog-title">Fotografía del destino</h2><p>Costa del Garraf · Imagen de referencia para esta propuesta.</p><img class="full-photo" src="${photo}" alt="Fotografía de referencia de la Costa del Garraf sin recorte">`,
      target,
    );
    dialog.classList.add('photo-viewer');
    return;
  }
  if (target.dataset.coverCategory) {
    const key = target.dataset.coverCategory;
    if (view === 'guia') document.getElementById(key).scrollIntoView();
    else {
      category = key;
      selected = items.find((item) => item.category === key).id;
      panel = 'lista';
      render();
      main.querySelector(view === 'base' ? '.base-main' : '.atlas-heading').scrollIntoView();
    }
    return;
  }
  if (target.dataset.view) {
    switchView(target.dataset.view);
    return;
  }
  if (target.hasAttribute('data-mobile')) {
    mobile = !mobile;
    syncChrome();
    return;
  }
  if (target.hasAttribute('data-theme')) {
    const dark = document.documentElement.dataset.theme !== 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    target.textContent = dark ? 'Tema claro' : 'Tema oscuro';
    return;
  }
  if (target.hasAttribute('data-description')) {
    const top = scrollY;
    expanded = !expanded;
    render();
    scrollTo(0, top);
    main.querySelector('[data-description]')?.focus({ preventScroll: true });
    return;
  }
  if (target.dataset.category) {
    category = target.dataset.category;
    const first = items.find((item) => category === 'todos' || item.category === category);
    selected = first.id;
    render();
    main.querySelector(`[data-category="${category}"]`)?.focus({ preventScroll: true });
    return;
  }
  if (target.dataset.panel) {
    panel = target.dataset.panel;
    render();
    main.querySelector(`[data-panel="${panel}"]`)?.focus({ preventScroll: true });
    return;
  }
  if (target.hasAttribute('data-explore')) {
    switchView('mapa');
    panel = 'mapa';
    render();
    main.scrollIntoView();
    return;
  }
  if (target.dataset.save) {
    const id = target.dataset.save;
    state.saved = saved(id) ? state.saved.filter((value) => value !== id) : [...state.saved, id];
    persist();
    const top = scrollY;
    if (dialog.open) dialog.close();
    render();
    scrollTo(0, top);
    main.querySelector(`[data-save="${id}"]`)?.focus({ preventScroll: true });
    toast(saved(id) ? 'Guardado en esta demostración.' : 'Quitado de guardados.');
    return;
  }
  if (target.dataset.detail) {
    details(
      items.find((item) => item.id === target.dataset.detail),
      target,
    );
    return;
  }
  if (target.dataset.pin) {
    selected = target.dataset.pin;
    if (view === 'mapa') {
      panel = 'mapa';
      render();
      main.querySelector(`.pin[data-pin="${selected}"]`)?.focus({ preventScroll: true });
    } else
      details(
        items.find((item) => item.id === selected),
        target,
      );
    return;
  }
  if (target.dataset.locate) {
    dialog.close();
    view = 'mapa';
    selected = target.dataset.locate;
    category = items.find((item) => item.id === selected).category;
    panel = 'mapa';
    render();
    main.scrollIntoView();
    return;
  }
  if (target.dataset.plan) {
    chooseDay(target.dataset.plan, false, target);
    return;
  }
  if (target.hasAttribute('data-base')) {
    chooseDay('sitges', true, target);
    return;
  }
  if (target.dataset.confirm) {
    const day = document.querySelector('#demo-day').value,
      id = target.dataset.confirm,
      isBase = target.dataset.isBase === 'true';
    if (isBase) state.bases[day] = 'sitges';
    else state.activities[day] = [...new Set([...(state.activities[day] || []), id])];
    persist();
    dialog.close();
    toast(
      isBase
        ? `Sitges asignado como base del día ${day} · Demostración.`
        : `Actividad añadida al día ${day} · Demostración.`,
    );
    return;
  }
  if (target.dataset.action === 'saved') {
    savedDialog(target);
    return;
  }
  if (target.hasAttribute('data-connections')) {
    openDialog(
      '<h2 id="dialog-title">Conexiones del municipio</h2><p>La ficha final reunirá los enlaces oficiales de transporte, las estaciones y los aparcamientos verificados.</p><div class="facts"><div><b>Tren</b><span>Estación del municipio</span></div><div><b>A pie</b><span>Recorridos locales</span></div><div><b>Coche</b><span>Aparcamientos</span></div></div><p>Esta propuesta no muestra horarios ni conexiones en tiempo real.</p>',
      target,
    );
    return;
  }
  if (target.hasAttribute('data-close')) dialog.close();
});
dialog.addEventListener('close', () => {
  dialog.classList.remove('photo-viewer');
  if (opener?.isConnected) opener.focus({ preventScroll: true });
});
render();
