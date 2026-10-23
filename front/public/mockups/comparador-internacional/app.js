import {
  catalogue,
  byId,
  normalize,
  insight,
  types,
  priorities,
  search,
  changePair,
} from './model.js';
import { esc, photo, practical } from './shared.js';
import { render as cara } from './cara.js';
import { render as criterios } from './criterios.js';
import { render as duelo } from './duelo.js';
const $ = (s) => document.querySelector(s);
const stage = $('#stage'),
  picker = $('.proto-picker'),
  highlight = $('.proto-picker-highlight'),
  items = [...picker.querySelectorAll('.proto-picker-item:not(.proto-picker-replay)')];
const views = [cara, criterios, duelo];
let current = 0,
  state = read(),
  undo = null,
  feedbackTimer,
  renderFrame;
function read() {
  const p = new URLSearchParams(location.search);
  return normalize({
    ids: p.has('ids') ? p.get('ids').split(',') : undefined,
    priority: p.get('prioridad'),
    season: p.get('epoca'),
    pair: p.get('pareja')?.split(','),
    wishes: p.has('planes') ? p.get('planes').split(',') : undefined,
    chosen: p.get('opcion'),
    missing: p.get('pendiente') === '1',
    differences: p.get('diferencias') === '1',
  });
}
function sync() {
  const u = new URL(location.href);
  for (const [k, v] of Object.entries({
    v: current + 1,
    ids: state.ids.join(','),
    prioridad: state.priority,
    epoca: state.season,
    pareja: state.pair.join(','),
    planes: state.wishes.join(','),
    opcion: state.chosen ?? '',
    pendiente: state.missing ? '1' : '0',
    diferencias: state.differences ? '1' : '0',
  }))
    u.searchParams.set(k, v);
  history.replaceState(null, '', u);
}
function tell(message) {
  clearTimeout(feedbackTimer);
  $('#feedback').textContent = message;
  $('#feedback').classList.add('visible');
  feedbackTimer = setTimeout(() => $('#feedback').classList.remove('visible'), 4400);
}
function update(patch, message) {
  state = normalize({ ...state, ...patch });
  sync();
  render();
  if (message) tell(message);
}
function render() {
  const note = insight(state, current === 2);
  $('#insight-title').textContent = note.title;
  $('#insight-body').textContent = note.body;
  $('#season').value = state.season;
  $('#scenario').value = state.missing ? 'missing' : 'complete';
  document.querySelectorAll('[data-priority]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.priority === state.priority));
  });
  $('#wishes').hidden = state.priority !== 'activities';
  $('#wishes div').innerHTML = types
    .map(
      (t) =>
        `<label class="wish"><input type="checkbox" value="${t}" ${state.wishes.includes(t) ? 'checked' : ''}>${t}</label>`,
    )
    .join('');
  stage.innerHTML = views[current](state);
  wireImages(stage);
  $('#variant-number').textContent = current + 1;
  const picked = byId(state.chosen);
  $('#selection').hidden = !picked;
  $('#selection').innerHTML = picked
    ? `<div><span class="eyebrow">TU OPCIÓN, POR AHORA</span><strong>✓ ${picked.name}</strong><span>Guardada en el enlace de demostración.</span></div><button class="secondary" data-reset-choice>Cambiar mi elección</button>`
    : '';
  if ($('#manager').open) renderCatalogue();
}
function wireImages(root) {
  root.querySelectorAll('img').forEach((img) => {
    img.addEventListener(
      'error',
      () => {
        img.closest('.photograph')?.classList.add('image-error');
      },
      { once: true },
    );
  });
}
function renderCatalogue() {
  const ds = search($('#catalogue-search').value);
  $('#catalogue-results').innerHTML = ds.length
    ? ds
        .map((d) => {
          const added = state.ids.includes(d.id),
            full = state.ids.length >= 4;
          return `<div class="catalogue-row"><div><strong>${d.name}</strong><span>${d.country} · ${d.currency}</span></div><button class="${added ? 'secondary' : 'primary'}" data-toggle="${d.id}" ${!added && full ? 'disabled' : ''}>${added ? 'Quitar' : 'Añadir'} <span aria-hidden="true">${added ? '−' : '＋'}</span><span class="sr-only"> ${d.name}</span></button></div>`;
        })
        .join('')
    : '<p class="no-results">No hay coincidencias en estos cuatro destinos de ejemplo.</p>';
  $('#manager-status').textContent =
    `${state.ids.length} de 4 destinos seleccionados${state.ids.length < 2 ? ' · Añade al menos dos para comparar.' : state.ids.length === 4 ? ' · Quita uno si quieres cambiarlo.' : '.'}`;
  $('#clear').disabled = !state.ids.length;
  $('#undo').hidden = !undo;
}
function open(dialog) {
  dialog.showModal();
}
function moveHighlight(i) {
  const el = items[i];
  highlight.style.width = el.offsetWidth + 'px';
  highlight.style.transform = `translateX(${el.offsetLeft}px)`;
}
function mount(i) {
  cancelAnimationFrame(renderFrame);
  stage.innerHTML = '';
  renderFrame = requestAnimationFrame(() => {
    current = i;
    render();
  });
}
function setActive(i) {
  current = i;
  items.forEach((el, j) => {
    el.toggleAttribute('data-active', j === i);
    if (j === i) el.setAttribute('aria-current', 'true');
    else el.removeAttribute('aria-current');
  });
  moveHighlight(i);
  sync();
  mount(i);
}
items.forEach((el, i) => el.addEventListener('click', () => setActive(i)));
$('.proto-picker-replay').addEventListener('click', () => {
  mount(current);
  tell('Animación reiniciada');
});
window.addEventListener('resize', () => moveHighlight(current));
window.addEventListener('keydown', (e) => {
  if (
    e.altKey ||
    e.ctrlKey ||
    e.metaKey ||
    e.shiftKey ||
    e.target.closest('input,select,textarea,[contenteditable="true"],dialog')
  )
    return;
  if (document.querySelector('dialog[open]')) return;
  let next;
  if (/^[123]$/.test(e.key)) next = Number(e.key) - 1;
  else if (e.key === 'ArrowRight') next = (current + 1) % 3;
  else if (e.key === 'ArrowLeft') next = (current + 2) % 3;
  else if (e.key.toLowerCase() === 'r') {
    mount(current);
    return;
  }
  if (next !== undefined) {
    e.preventDefault();
    setActive(next);
  }
});
window.addEventListener('popstate', () => {
  state = read();
  const v = Number(new URLSearchParams(location.search).get('v'));
  setActive([1, 2, 3].includes(v) ? v - 1 : 0);
});
document.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.hasAttribute('data-manage')) {
    renderCatalogue();
    open($('#manager'));
  }
  if (b.hasAttribute('data-close')) b.closest('dialog').close();
  if (b.dataset.priority)
    update(
      { priority: b.dataset.priority },
      `Comparando ${priorities[b.dataset.priority].toLowerCase()}`,
    );
  if (b.dataset.choose) {
    const id = b.dataset.choose;
    update(
      { chosen: state.chosen === id ? null : id },
      state.chosen === id
        ? 'Elección desmarcada'
        : `${byId(id).name} es tu opción. Puedes seguir comparando.`,
    );
    stage.querySelector(`[data-choose="${id}"]`)?.focus({ preventScroll: true });
  }
  if (b.hasAttribute('data-reset-choice')) {
    update({ chosen: null }, 'Puedes marcar otra opción');
    $('#priorities button').focus({ preventScroll: true });
  }
  if (b.dataset.remove) {
    const id = b.dataset.remove;
    undo = { ...state };
    update(
      { ids: state.ids.filter((x) => x !== id) },
      `${byId(id).name} se ha quitado. Puedes recuperarlo en Editar destinos.`,
    );
    document.querySelector('[data-manage]').focus({ preventScroll: true });
  }
  if (b.dataset.toggle) {
    const id = b.dataset.toggle;
    undo = { ...state };
    const removing = state.ids.includes(id);
    update(
      { ids: removing ? state.ids.filter((x) => x !== id) : [...state.ids, id] },
      `${byId(id).name} ${removing ? 'quitado' : 'añadido'}`,
    );
    $('#catalogue-results').querySelector(`[data-toggle="${id}"]`)?.focus({ preventScroll: true });
  }
  if (b.dataset.cycle) {
    const keys = Object.keys(priorities);
    update({
      priority:
        keys[(keys.indexOf(state.priority) + Number(b.dataset.cycle) + keys.length) % keys.length],
    });
    stage.querySelector(`[data-cycle="${b.dataset.cycle}"]`)?.focus({ preventScroll: true });
  }
  if (b.dataset.guide) {
    const d = byId(b.dataset.guide);
    $('#detail-title').textContent = d.name;
    $('#detail-body').innerHTML =
      `<div class="photograph detail-photo">${photo(d)}</div><p>${d.note}</p>${practical(d)}<p class="demo-note">Vista de demostración. Esta propuesta no crea ni modifica fichas.</p>${d.id === 'garraf' ? `<a class="primary link-button" href="${d.source}">Abrir la ficha actual ↗</a>` : ''}`;
    wireImages($('#detail-body'));
    open($('#detail'));
  }
});
$('#season').addEventListener('change', (e) =>
  update({ season: Number(e.target.value) }, 'Época actualizada; comparación recalculada'),
);
$('#scenario').addEventListener('change', (e) =>
  update(
    { missing: e.target.value === 'missing' },
    e.target.value === 'missing'
      ? 'Mostrando el caso de información pendiente'
      : 'Mostrando los datos completos del ejemplo',
  ),
);
$('#wishes').addEventListener('change', () => {
  const focused = document.activeElement.value;
  update(
    { wishes: [...$('#wishes input:checked')].map((e) => e.value) },
    'Tus planes se han actualizado',
  );
  [...$('#wishes input')].find((e) => e.value === focused)?.focus({ preventScroll: true });
});
$('#stage').addEventListener('change', (e) => {
  if (e.target.hasAttribute('data-differences')) {
    update(
      { differences: e.target.checked },
      e.target.checked
        ? 'Solo se muestran los criterios con diferencias'
        : 'Se muestran todos los criterios',
    );
    $('#stage [data-differences]').focus({ preventScroll: true });
  }
  if (e.target.hasAttribute('data-pair')) {
    const side = Number(e.target.dataset.pair);
    state = changePair(state, side, e.target.value);
    sync();
    render();
    stage.querySelector(`[data-pair="${side}"]`)?.focus({ preventScroll: true });
    tell('Pareja actualizada');
  }
});
$('#catalogue-search').addEventListener('input', renderCatalogue);
$('#clear').addEventListener('click', () => {
  undo = { ...state };
  update({ ids: [] }, 'Selección vaciada. Pulsa Deshacer para recuperarla.');
  $('#undo').focus();
});
$('#undo').addEventListener('click', () => {
  if (undo) {
    state = normalize(undo);
    undo = null;
    sync();
    render();
    tell('Selección anterior recuperada');
    $('#catalogue-search').focus();
  }
});
$('#mobile').addEventListener('click', (e) => {
  const on = document.body.classList.toggle('mock-mobile');
  e.currentTarget.setAttribute('aria-pressed', String(on));
  e.currentTarget.textContent = on ? 'Vista escritorio' : 'Vista móvil';
  tell(on ? 'Vista de teléfono: 390 píxeles' : 'Vista adaptada a tu pantalla');
});
$('#theme').addEventListener('click', (e) => {
  const dark = document.documentElement.dataset.theme !== 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  e.currentTarget.setAttribute('aria-pressed', String(dark));
  e.currentTarget.textContent = dark ? 'Tema claro' : 'Tema oscuro';
});
$('#credits-body').innerHTML = catalogue
  .map(
    (d) =>
      `<article class="credit"><h3>${d.name}</h3><p>${d.author} · ${d.licenseUrl ? `<a href="${esc(d.licenseUrl)}" target="_blank" rel="noopener noreferrer">${d.license}</a>` : d.license}</p><a href="${esc(d.source)}" target="_blank" rel="noopener noreferrer">Ver origen de la imagen ↗</a><small>Recorte visual mediante CSS; archivo original sin modificar.</small></article>`,
  )
  .join('');
$('#credits').addEventListener('click', () => open($('#credits-dialog')));
$('#share').addEventListener('click', async () => {
  sync();
  try {
    await navigator.clipboard.writeText(location.href);
    tell('Enlace copiado con tus destinos y preferencias');
  } catch {
    $('#share-url').value = location.href;
    open($('#link-dialog'));
    $('#share-url').select();
  }
});
const initial = new URLSearchParams(location.search);
if (initial.get('movil') === '1') {
  document.body.classList.add('mock-mobile');
  $('#mobile').setAttribute('aria-pressed', 'true');
  $('#mobile').textContent = 'Vista escritorio';
}
const v = Number(initial.get('v'));
setActive([1, 2, 3].includes(v) ? v - 1 : 0);
requestAnimationFrame(() => requestAnimationFrame(() => picker.setAttribute('data-ready', '')));
