import { destinations } from './model.js';
import { photo, country, metric, chips, choice, practical, empty, guide, esc } from './shared.js';
export function render(s) {
  const ds = destinations(s);
  if (ds.length < 2) return empty();
  return `<div class="section-label"><h2>Tus destinos, cara a cara</h2><span>${ds.length} opciones · un mismo criterio</span></div><div class="destination-grid" style="--columns:${ds.length}">${ds.map((d) => `<article class="destination-card ${s.chosen === d.id ? 'is-chosen' : ''}"><div class="photograph">${photo(d)}<button class="remove" data-remove="${d.id}" aria-label="Quitar ${esc(d.name)}">×</button>${s.chosen === d.id ? '<span class="chosen-badge">✓ Tu opción</span>' : ''}</div><div class="card-body">${country(d)}<h3>${d.name}</h3><p class="intro">${d.note}</p><div class="metric-block">${metric(d, s)}</div><div class="tags">${chips(d, s)}</div><details><summary>Lo práctico <span aria-hidden="true">＋</span></summary>${practical(d)}</details>${choice(d, s)}${guide(d)}</div></article>`).join('')}</div>`;
}
