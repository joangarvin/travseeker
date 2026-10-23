import { value, priorities } from './model.js';
export const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
export const photo = (d) =>
  `<img src="${esc(d.image)}" alt="Paisaje de ${esc(d.name)}" width="640" height="420" loading="lazy"><span class="photo-fallback" aria-hidden="true">${esc(d.name)}</span>`;
export const country = (d) =>
  `<span class="country">${d.code} <span aria-hidden="true">·</span> ${d.country}</span>`;
export function metric(d, s, key = s.priority) {
  const v = value(d, key, s);
  if (v === null)
    return '<strong class="metric pending">Pendiente</strong><span>Sin estimación disponible</span>';
  if (key === 'quiet')
    return `<strong class="metric">${v}<small>%</small></strong><span>Afluencia estimada · menos es más tranquilo</span><span class="meter" aria-hidden="true"><i style="--fill:${v}%"></i></span>`;
  if (key === 'activities')
    return `<strong class="metric">${s.wishes.length ? `${v}<small> / ${s.wishes.length}</small>` : '—'}</strong><span>${s.wishes.length ? 'Tipos de plan que coinciden' : 'Selecciona tus planes'}</span>`;
  if (key === 'budget')
    return `<strong class="metric words">${d.budget}</strong><span>Nivel de gasto orientativo · ${d.currency}</span>`;
  return `<strong class="metric words">${d.currency}</strong><span>${d.languages}</span>`;
}
export const chips = (d, s) =>
  d.types
    .map(
      (t) =>
        `<span class="tag ${s.wishes.includes(t) ? 'match' : ''}">${esc(t)}${s.priority === 'activities' && s.wishes.includes(t) ? ' ✓' : ''}</span>`,
    )
    .join('');
export const choice = (d, s) =>
  `<button class="choice ${s.chosen === d.id ? 'selected' : ''}" data-choose="${d.id}" aria-pressed="${s.chosen === d.id}">${s.chosen === d.id ? '✓ Mi opción' : 'Marcar opción'}<span aria-hidden="true">↗</span></button>`;
export const practical = (d) =>
  `<dl class="facts"><div><dt>País</dt><dd>${d.country}</dd></div><div><dt>Moneda</dt><dd>${d.currency}</dd></div><div><dt>Idiomas</dt><dd>${d.languages}</dd></div></dl>`;
export const empty = () =>
  `<section class="empty"><span class="empty-symbol" aria-hidden="true">↔</span><h2>Tu próxima decisión empieza con dos destinos.</h2><p>Añade las opciones que te interesan para comparar sus diferencias.</p><button class="primary" data-manage>Añadir destinos <span aria-hidden="true">＋</span></button></section>`;
export const guide = (d) =>
  `<button class="text-button" data-guide="${d.id}">Ver ficha del ejemplo <span aria-hidden="true">↗</span></button>`;
export const priorityLabel = (s) => priorities[s.priority];
