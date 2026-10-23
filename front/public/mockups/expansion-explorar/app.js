import {
  mode,
  state,
  params,
  destinations,
  countries,
  media,
  visible,
  esc,
  button,
} from './shared.js';
import split from './mapa-dividido.js';
import atlas from './mapa-atlas.js';
import list from './mapa-lista.js';
const variants = [split, atlas, list];
const names = ['Dividido', 'Atlas', 'Lista'];
const stage = document.getElementById('stage');
const picker = document.querySelector('.proto-picker');
const highlight = picker.querySelector('.proto-picker-highlight');
const items = [...picker.querySelectorAll('.proto-picker-item:not(.proto-picker-replay)')];
const replay = picker.querySelector('.proto-picker-replay');
let current = 0;
let mountVersion = 0;
let maps = [],
  tilePermission = sessionStorage.getItem('trav-expansion-explore-maps') === 'yes',
  toastTimer;
let storedView = null;
let pendingFocus = null;
const dialog = document.getElementById('dialog');
if (params.get('destino') && destinations.some((d) => d.id === params.get('destino')))
  state.selected = params.get('destino');
if (state.scenario === 'espana' && state.country && state.country !== 'ES') state.country = '';
if (state.scenario === 'espana' && mode === 'ficha') state.selected = 'blanca';
items.forEach((el, i) => (el.textContent = names[i]));
document.querySelectorAll('.site-header nav a').forEach((a) => {
  if (a.href.includes(`pagina=${mode}`)) a.setAttribute('aria-current', 'page');
});
if (mode === 'mapa') {
  document
    .querySelectorAll('#scenario option[value="incompleto"], #scenario option[value="proximo"]')
    .forEach((el) => el.remove());
  if (['incompleto', 'proximo'].includes(state.scenario)) state.scenario = 'ampliado';
}
document.getElementById('scenario').value = state.scenario;
try {
  if (localStorage.getItem('trav-expansion-explore-theme') === 'dark')
    document.documentElement.dataset.theme = 'dark';
} catch {}
function moveHighlight() {
  const el = items[current];
  highlight.style.width = el.offsetWidth + 'px';
  highlight.style.transform = `translateX(${el.offsetLeft}px)`;
}
function mount(i) {
  const version = ++mountVersion;
  maps.forEach((m) => {
    m.off();
    m.stop();
    m.remove();
  });
  maps = [];
  stage.innerHTML = '';
  requestAnimationFrame(() => {
    if (version !== mountVersion) return;
    stage.innerHTML = variants[i]();
    initMaps();
    if (pendingFocus) {
      stage.querySelector(pendingFocus)?.focus();
      pendingFocus = null;
    }
  });
}
function setActive(i) {
  if (i < 0 || i >= variants.length) return;
  current = i;
  items.forEach((el, j) => {
    el.toggleAttribute('data-active', j === i);
    if (j === i) el.setAttribute('aria-current', 'true');
    else el.removeAttribute('aria-current');
  });
  moveHighlight();
  const url = new URL(location);
  url.searchParams.set('v', i + 1);
  history.replaceState(null, '', url);
  picker.dataset.position = mode === 'mapa' && i === 1 ? 'top' : '';
  storedView = null;
  mount(i);
}
items.forEach((el, i) => el.addEventListener('click', () => setActive(i)));
replay?.addEventListener('click', () => mount(current));
window.addEventListener('resize', moveHighlight);
document.addEventListener('keydown', (e) => {
  if (
    /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) ||
    e.target.isContentEditable ||
    dialog.open
  )
    return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const num = parseInt(e.key, 10);
  if (num >= 1 && num <= variants.length) setActive(num - 1);
  else if (e.key === 'ArrowRight') setActive((current + 1) % variants.length);
  else if (e.key === 'ArrowLeft') setActive((current - 1 + variants.length) % variants.length);
  else if (e.key === 'r' || e.key === 'R') mount(current);
});
function announce(text) {
  const el = document.getElementById('feedback');
  clearTimeout(toastTimer);
  el.textContent = text;
  el.classList.add('visible');
  toastTimer = setTimeout(() => el.classList.remove('visible'), 3200);
}
let dialogOrigin = null;
function showDialog(title, html) {
  dialogOrigin = document.activeElement;
  document.getElementById('dialog-title').textContent = title;
  document.getElementById('dialog-content').innerHTML = html;
  if (!dialog.open) dialog.showModal();
}
dialog.addEventListener('close', () => {
  if (dialogOrigin?.isConnected) dialogOrigin.focus();
});
document.getElementById('close-dialog').onclick = () => dialog.close();
dialog.addEventListener('click', (e) => {
  if (e.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
      dialog.close();
  }
});
function persistURL() {
  const u = new URL(location);
  for (const [key, value] of Object.entries({
    pais: state.country,
    escenario: state.scenario,
    q: state.query,
    region: state.region,
    tema: state.theme,
  })) {
    if (value) u.searchParams.set(key, value);
    else u.searchParams.delete(key);
  }
  history.replaceState(null, '', u);
}
function refresh(resetView = false) {
  if (mode === 'mapa' && visible().length && !visible().some((d) => d.id === state.selected))
    state.selected = visible()[0].id;
  if (resetView) storedView = null;
  persistURL();
  mount(current);
}
function selectDestination(id) {
  state.selected = id;
  if (mode === 'mapa' && current === 1) {
    refresh();
    return;
  }
  stage
    .querySelectorAll('.destination-card')
    .forEach((c) =>
      c.classList.toggle('selected', c.querySelector('[data-select]')?.dataset.select === id),
    );
  maps.forEach((m) => {
    m.eachLayer((layer) => {
      if (layer.options?.destinationId)
        layer.setIcon(markerIcon(destinations.find((d) => d.id === layer.options.destinationId)));
    });
  });
  const d = destinations.find((d) => d.id === id);
  maps.forEach((m) =>
    m.setView([d.lat, d.lng], 8, {
      animate: !matchMedia('(prefers-reduced-motion:reduce)').matches,
    }),
  );
  if (innerWidth <= 760 && current === 0) {
    state.view = 'mapa';
    refresh();
  }
  announce(`${d.name} seleccionado en el mapa`);
}
function markerIcon(d, group = false) {
  return L.divIcon({
    className: `map-marker ${group ? 'group' : state.selected === d.id ? 'active' : ''}`,
    html: group ? `${countries[d.country]} · ${d.count}` : esc(d.name),
    iconSize: null,
    iconAnchor: [0, 16],
  });
}
function initMaps() {
  stage.querySelectorAll('[data-map]').forEach((el) => {
    const wrap = el.closest('.map-wrap');
    if (!tilePermission) return;
    wrap.querySelector('.map-request').hidden = true;
    const ds = visible();
    const map = L.map(el, {
      scrollWheelZoom: false,
      zoomControl: true,
      keyboard: true,
      zoomAnimation: !matchMedia('(prefers-reduced-motion:reduce)').matches,
    });
    maps.push(map);
    const tile = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
      maxZoom: 18,
    });
    tile.addTo(map);
    tile.on('tileerror', () => {
      wrap.querySelector('.map-error').hidden = false;
    });
    const markerLayer = L.layerGroup().addTo(map);
    function markers() {
      markerLayer.clearLayers();
      if (mode === 'mapa' && map.getZoom() <= 5) {
        Object.keys(countries).forEach((country) => {
          const group = ds.filter((d) => d.country === country);
          if (!group.length) return;
          const center = [
            group.reduce((n, d) => n + d.lat, 0) / group.length,
            group.reduce((n, d) => n + d.lng, 0) / group.length,
          ];
          L.marker(center, {
            icon: markerIcon({ country, count: group.length }, true),
            title: `${countries[country]}: ${group.length} destinos`,
            keyboard: true,
          })
            .addTo(markerLayer)
            .on('click', () => {
              state.country = country;
              state.region = '';
              refresh(true);
            });
        });
      } else {
        ds.forEach((d) =>
          L.marker([d.lat, d.lng], {
            icon: markerIcon(d),
            title: `Seleccionar ${d.name}`,
            keyboard: true,
            destinationId: d.id,
          })
            .addTo(markerLayer)
            .on('click', () => selectDestination(d.id)),
        );
      }
    }
    map.on('zoomend', markers);
    map.on('moveend', () => {
      if (mode === 'mapa') storedView = { center: map.getCenter(), zoom: map.getZoom() };
    });
    if (storedView && mode === 'mapa') map.setView(storedView.center, storedView.zoom);
    else if (ds.length === 1) map.setView([ds[0].lat, ds[0].lng], mode === 'ficha' ? 11 : 8);
    else if (ds.length)
      map.fitBounds(
        ds.map((d) => [d.lat, d.lng]),
        { padding: mode === 'mapa' && current === 1 ? [70, 85] : [45, 45], maxZoom: 9 },
      );
    else map.setView([42, -2], 4);
    markers();
    requestAnimationFrame(() => {
      if (el.isConnected && maps.includes(map)) map.invalidateSize();
    });
  });
}
document.addEventListener('change', (e) => {
  const key = e.target.dataset.filter;
  if (key) {
    state[key] = e.target.value;
    pendingFocus = `[data-filter="${key}"]`;
    if (key === 'country') state.region = '';
    refresh(true);
  }
});
document.addEventListener('submit', (e) => {
  if (e.target.id === 'map-filters') {
    e.preventDefault();
    state.query = new FormData(e.target).get('q').trim();
    pendingFocus = 'input[name=q]';
    refresh(true);
  }
});
document.addEventListener('click', (e) => {
  const select = e.target.closest('[data-select]');
  if (select) {
    selectDestination(select.dataset.select);
    return;
  }
  const country = e.target.closest('[data-country]');
  if (country) {
    state.country = country.dataset.country;
    state.region = '';
    refresh(true);
    return;
  }
  const tab = e.target.closest('[data-tab]');
  if (tab) {
    state.tab = tab.dataset.tab;
    refresh();
    return;
  }
  const trigger = e.target.closest('[data-action]');
  if (!trigger) return;
  const [action, value] = trigger.dataset.action.split(':');
  if (action === 'destination') {
    const d = destinations.find((d) => d.id === value);
    showDialog(
      d.name,
      `<p class="eyebrow">${countries[d.country]} · ${d.region}</p><p>${d.summary}</p><p>Vista previa de demostración. Este destino utilizará la misma ficha que los actuales, con sus datos prácticos cuando se publique.</p>`,
    );
  }
  if (action === 'load-map' || action === 'retry-map') {
    tilePermission = true;
    sessionStorage.setItem('trav-expansion-explore-maps', 'yes');
    refresh();
  }
  if (action === 'fit') {
    storedView = null;
    refresh(true);
    announce('Mapa ajustado a los resultados visibles');
  }
  if (action === 'clear') {
    state.country = '';
    state.region = '';
    state.theme = '';
    state.query = '';
    refresh(true);
  }
  if (action === 'view') {
    state.view = value;
    refresh();
  }
  if (action === 'next') {
    const ds = visible(),
      i = ds.findIndex((d) => d.id === state.selected);
    state.selected = ds[(i + 1) % ds.length].id;
    refresh();
  }
});
document.getElementById('scenario').addEventListener('change', (e) => {
  state.scenario = e.target.value;
  if (state.scenario === 'espana') {
    state.country = mode === 'mapa' ? 'ES' : '';
    state.selected = 'blanca';
  } else if (mode === 'ficha') state.selected = params.get('destino') || 'lisboa';
  state.region = '';
  refresh(true);
});
document.getElementById('theme').onclick = () => {
  const dark = document.documentElement.dataset.theme !== 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  localStorage.setItem('trav-expansion-explore-theme', dark ? 'dark' : 'light');
  announce(dark ? 'Vista oscura del prototipo' : 'Vista clara del prototipo');
};
document.getElementById('credits').onclick = () =>
  showDialog(
    'Fotografías y datos',
    `<p>Prototipos aislados: los textos internacionales y los escenarios son ejemplos de diseño. Los nombres y ubicaciones corresponden a lugares reales. No cambian la publicación del catálogo.</p><p>Las imágenes españolas proceden del catálogo existente de TravSeeker. Las internacionales se enlazan desde Wikimedia, sin descargarlas ni subirlas.</p><ul>${Object.entries(
      media,
    )
      .filter(([key]) => ['Lisbon', 'Porto', 'Paris', 'Nice'].includes(key))
      .map(([name, m]) => {
        const filename = decodeURIComponent(new URL(m.image).pathname.split('/').at(-2));
        return `<li>${name}: <a href="https://commons.wikimedia.org/wiki/File:${encodeURIComponent(filename)}" target="_blank" rel="noopener">Archivo, autor y licencia en Wikimedia Commons ↗</a></li>`;
      })
      .join(
        '',
      )}</ul><p>Cartografía: OpenStreetMap. Su carga es voluntaria dentro de esta demostración.</p><p><a href="https://www.visitlisboa.com/" target="_blank" rel="noopener">Turismo de Lisboa ↗</a> · <a href="https://visitporto.travel/" target="_blank" rel="noopener">Turismo de Oporto ↗</a></p>`,
  );
setActive(
  Math.min(2, Math.max(0, (parseInt(new URLSearchParams(location.search).get('v'), 10) || 1) - 1)),
);
requestAnimationFrame(() => requestAnimationFrame(() => picker.setAttribute('data-ready', '')));
