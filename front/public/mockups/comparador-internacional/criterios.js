import { destinations, priorities, value } from './model.js';
import { photo, country, metric, chips, choice, practical, empty } from './shared.js';
export function render(s) {
  const ds = destinations(s);
  if (ds.length < 2) return empty();
  const keys = ['quiet', 'activities', 'budget', 'practical'];
  const different = (k) =>
    new Set(
      ds.map((d) =>
        k === 'activities'
          ? d.types.join(',')
          : k === 'practical'
            ? d.currency + '|' + d.languages
            : String(value(d, k, s)),
      ),
    ).size > 1;
  return `<div class="section-label"><h2>Compara lo que te importa</h2><label class="check"><input type="checkbox" data-differences ${s.differences ? 'checked' : ''}> Solo diferencias</label></div><div class="criteria-head" style="--columns:${ds.length}">${ds.map((d) => `<article class="mini-destination"><div class="photograph">${photo(d)}</div><div>${country(d)}<h3>${d.name}</h3></div></article>`).join('')}</div><div class="criteria-list">${keys
    .filter((k) => !s.differences || different(k))
    .map(
      (k) =>
        `<details class="criterion" ${k === s.priority ? 'open' : ''}><summary><span>${priorities[k]}</span><span class="criterion-caption">${different(k) ? 'Ver diferencias' : 'En común'} <b aria-hidden="true">＋</b></span></summary><div class="criteria-values" style="--columns:${ds.length}">${ds.map((d) => `<section><h4>${d.name}</h4>${k === 'practical' ? practical(d) : `<div class="metric-block">${metric(d, s, k)}</div>`}${k === 'activities' ? `<div class="tags">${chips(d, s)}</div>` : ''}</section>`).join('')}</div>${k === 'budget' ? '<p class="criterion-note">Los niveles son editoriales, no importes equivalentes entre países.</p>' : ''}</details>`,
    )
    .join(
      '',
    )}</div><div class="criteria-choices" style="--columns:${ds.length}">${ds.map((d) => `<div><span>${d.name}</span>${choice(d, s)}</div>`).join('')}</div>`;
}
