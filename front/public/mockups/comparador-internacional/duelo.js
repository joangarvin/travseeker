import { destinations, priorities } from './model.js';
import { photo, country, metric, chips, choice, empty, esc, guide } from './shared.js';
export function render(s) {
  const all = destinations(s),
    ds = destinations(s, true);
  if (ds.length < 2) return empty();
  const keys = Object.keys(priorities),
    index = keys.indexOf(s.priority);
  return `<div class="section-label"><div><p class="eyebrow">UNA DECISIÓN CADA VEZ</p><h2>¿Con cuál te quedas?</h2></div><span>${all.length > 2 ? 'Cambia las parejas para revisar todas tus opciones' : 'Dos destinos, sin tabla interminable'}</span></div><div class="duel-selectors">${ds.map((d, i) => `<label>Opción ${i + 1}<select data-pair="${i}">${all.map((x) => `<option value="${x.id}" ${x.id === d.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>`).join('')}</div><div class="duel-photos">${ds.map((d) => `<article><div class="photograph">${photo(d)}</div>${country(d)}<h3>${d.name}</h3></article>`).join('')}</div><div class="duel-criterion"><button class="round" data-cycle="-1" aria-label="Criterio anterior">←</button><div><span class="eyebrow">CRITERIO ${index + 1} DE ${keys.length}</span><h3>${priorities[s.priority]}</h3></div><button class="round" data-cycle="1" aria-label="Criterio siguiente">→</button></div><div class="duel-values">${ds.map((d) => `<section aria-label="${esc(d.name)}"><span class="duel-name">${d.name}</span><div class="metric-block">${metric(d, s)}</div>${s.priority === 'activities' ? `<div class="tags">${chips(d, s)}</div>` : ''}${choice(d, s)}${guide(d)}</section>`).join('')}</div><p class="duel-hint">Tu elección se conserva al cambiar de pareja. Puedes seguir comparando antes de decidir.</p>`;
}
