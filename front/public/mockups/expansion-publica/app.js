import continuidad from './continuidad.js';
import atlas from './atlas.js';
import inspiracion from './inspiracion.js';
import { scenarios, countries, destinations } from './data.js';
import { detail, credits, savedIds, mapBoxes } from './shared.js';
function readState() {
  const p = new URLSearchParams(location.search);
  const value = {
    v: p.get('v') || '1',
    pagina: p.get('pagina') === 'pais' ? 'pais' : 'descubrir',
    pais: p.get('pais') || 'ES',
    escenario: Object.hasOwn(scenarios, p.get('escenario')) ? p.get('escenario') : 'ampliado',
    q: p.get('q') || '',
    tema: p.get('tema') || 'todos',
    region: p.get('region') || 'todas',
    presupuesto: p.get('presupuesto') || 'todos',
    oscuro: p.get('oscuro') === '1' ? '1' : '0',
    mas: p.get('mas') === '1' ? '1' : '0',
    filtros: p.get('filtros') === '1' ? '1' : '0',
  };
  if (value.pagina === 'descubrir') value.pais = 'todos';
  return value;
}
let state = readState();
const variants = [() => continuidad(state), () => atlas(state), () => inspiracion(state)];
let returnFocus = null,
  feedbackTimer;
function navigate(values, { focus = false } = {}) {
  const active = document.activeElement;
  const restore = active?.id
    ? '#' + CSS.escape(active.id)
    : active?.dataset.themeFilter
      ? '[data-theme-filter="' + CSS.escape(active.dataset.themeFilter) + '"]'
      : active?.dataset.region
        ? '[data-region="' + CSS.escape(active.dataset.region) + '"]'
        : active?.dataset.action
          ? '[data-action="' + CSS.escape(active.dataset.action) + '"]'
          : null;
  if (values.pagina === 'descubrir' && state.pagina === 'pais')
    values = {
      ...values,
      pais: 'todos',
      region: 'todas',
      q: '',
      tema: 'todos',
      presupuesto: 'todos',
    };
  state = { ...state, ...values };
  if (state.pagina === 'descubrir') state.pais = 'todos';
  const url = new URL(location);
  url.search = new URLSearchParams(state);
  url.hash = '';
  history.pushState(null, '', url);
  mount(current);
  if (focus)
    requestAnimationFrame(() => {
      document.querySelector('h1')?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
  else if (restore)
    requestAnimationFrame(() => document.querySelector(restore)?.focus({ preventScroll: true }));
}
function announce(message) {
  const el = document.getElementById('feedback');
  el.textContent = message;
  el.classList.add('visible');
  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => el.classList.remove('visible'), 2600);
}
function showDialog(html, trigger) {
  returnFocus = trigger;
  const dialog = document.getElementById('detail-dialog');
  document.getElementById('dialog-content').innerHTML = html;
  dialog.showModal();
}
document.addEventListener('submit', (e) => {
  if (e.target.id !== 'search-form') return;
  e.preventDefault();
  navigate({ q: new FormData(e.target).get('q') || '' });
  requestAnimationFrame(() =>
    document.getElementById('destinos')?.scrollIntoView({ behavior: 'auto', block: 'start' }),
  );
});
document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.id === 'scenario') {
    const next = el.value;
    const available = countries.find((c) => scenarios[next][c.code] === 'public');
    navigate(
      {
        escenario: next,
        pais:
          state.pagina === 'pais' ||
          scenarios[next][state.pais] === 'public' ||
          state.pais === 'todos'
            ? state.pais
            : available.code,
        region: 'todas',
        q: '',
        tema: 'todos',
        presupuesto: 'todos',
      },
      { focus: true },
    );
  } else if (el.id === 'country-select') {
    navigate(
      { pais: el.value, region: 'todas', tema: 'todos', q: '', presupuesto: 'todos' },
      { focus: true },
    );
  } else if (el.id === 'region') navigate({ region: el.value });
  else if (el.id === 'budget') navigate({ presupuesto: el.value });
});
document.addEventListener('click', (e) => {
  const nav = e.target.closest('a[data-go]');
  if (nav) {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    document.querySelector('dialog[open]')?.close();
    const p = new URL(nav.href).searchParams;
    navigate(Object.fromEntries(p), { focus: true });
    return;
  }
  const el = e.target.closest('button');
  if (!el) return;
  if (el.dataset.themeFilter) {
    navigate({ tema: el.dataset.themeFilter });
    return;
  }
  if (el.dataset.region) {
    navigate({ region: el.dataset.region });
    return;
  }
  if (el.dataset.detail) {
    showDialog(detail(el.dataset.detail, state), el);
    return;
  }
  if (el.dataset.save) {
    let ids = savedIds(),
      id = el.dataset.save,
      remove = ids.includes(id);
    ids = remove ? ids.filter((x) => x !== id) : [...ids, id];
    try {
      localStorage.setItem('trav-expansion-public-prototype-saved', JSON.stringify(ids));
      el.setAttribute('aria-pressed', String(!remove));
      el.setAttribute(
        'aria-label',
        `${remove ? 'Guardar' : 'Quitar'} ${destinations.find((d) => d.id === id).name}`,
      );
      el.textContent = remove ? '♡' : '♥';
      announce(remove ? 'Quitado de tus favoritos de prueba.' : 'Guardado en este prototipo.');
    } catch {
      announce('No se pudo guardar en este navegador.');
    }
    return;
  }
  if (el.classList.contains('dialog-close')) {
    document.getElementById('detail-dialog').close();
    returnFocus?.focus();
    return;
  }
  switch (el.dataset.action) {
    case 'theme':
      navigate({ oscuro: state.oscuro === '1' ? '0' : '1' });
      break;
    case 'more':
      navigate({ mas: '1' });
      break;
    case 'reset':
      navigate({ q: '', tema: 'todos', region: 'todas', presupuesto: 'todos' });
      break;
    case 'credits':
      showDialog(credits(), el);
      break;
  }
});
document.addEventListener('close', () => returnFocus?.focus(), true);
window.addEventListener('popstate', () => {
  state = readState();
  setActive(Math.max(0, Math.min(2, Number(state.v) - 1)));
});
// `variants` is an array of render functions, one per variant, in picker order.
const stage = document.getElementById('stage');
const picker = document.querySelector('.proto-picker');
const highlight = picker.querySelector('.proto-picker-highlight');
const items = [...picker.querySelectorAll('.proto-picker-item:not(.proto-picker-replay)')];
const replay = picker.querySelector('.proto-picker-replay');
let current = 0;

function moveHighlight() {
  const el = items[current];
  highlight.style.width = el.offsetWidth + 'px';
  highlight.style.transform = `translateX(${el.offsetLeft}px)`;
}

function mount(i) {
  stage.innerHTML = '';
  // Clear first, render next frame, so entrance animations re-run.
  requestAnimationFrame(() => {
    stage.innerHTML = variants[i]();
    document.documentElement.dataset.theme = state.oscuro === '1' ? 'dark' : 'light';
    if (location.hash === '#paises')
      document.getElementById('paises')?.scrollIntoView({ behavior: 'instant' });
  });
}

function setActive(i) {
  if (i < 0 || i >= variants.length) return;
  current = i;
  state.v = String(i + 1);
  items.forEach((el, j) => {
    el.toggleAttribute('data-active', j === i);
    if (j === i) el.setAttribute('aria-current', 'true');
    else el.removeAttribute('aria-current');
  });
  moveHighlight();
  const url = new URL(location);
  url.search = new URLSearchParams(state);
  history.replaceState(null, '', url);
  mount(i);
}

items.forEach((el, i) => el.addEventListener('click', () => setActive(i)));
replay?.addEventListener('click', () => mount(current));
window.addEventListener('resize', moveHighlight);

document.addEventListener('keydown', (e) => {
  if (document.querySelector('dialog[open]')) return;
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const num = parseInt(e.key, 10);
  if (num >= 1 && num <= variants.length) setActive(num - 1);
  else if (e.key === 'ArrowRight') setActive((current + 1) % variants.length);
  else if (e.key === 'ArrowLeft') setActive((current - 1 + variants.length) % variants.length);
  else if (e.key === 'r' || e.key === 'R') mount(current);
});

setActive((parseInt(new URLSearchParams(location.search).get('v'), 10) || 1) - 1);
// Enable the slide only after first paint, so load doesn't animate.
requestAnimationFrame(() => requestAnimationFrame(() => picker.setAttribute('data-ready', '')));

document.addEventListener(
  'toggle',
  (e) => {
    const el = e.target;
    if (!el.matches?.('details[data-map-code]') || !el.open || el.querySelector('iframe')) return;
    const box = mapBoxes[el.dataset.mapCode];
    const c = countries.find((c) => c.code === el.dataset.mapCode);
    const iframe = document.createElement('iframe');
    iframe.title = 'Mapa de ' + c.name;
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer';
    iframe.src =
      'https://www.openstreetmap.org/export/embed.html?bbox=' + box.join('%2C') + '&layer=mapnik';
    el.querySelector('.map-frame').append(iframe);
  },
  true,
);

document.addEventListener(
  'toggle',
  (e) => {
    if (!e.target.matches?.('.home-filter-details')) return;
    state.filtros = e.target.open ? '1' : '0';
    const u = new URL(location);
    u.searchParams.set('filtros', state.filtros);
    history.replaceState(null, '', u);
  },
  true,
);
