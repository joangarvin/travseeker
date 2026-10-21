import {
  country,
  destinationHome,
  countryCards,
  mapPanel,
  shell,
  link,
  search,
  themes,
  results,
  countryIntro,
  regions,
  facts,
  countryGate,
  countrySwitch,
} from './shared.js';
export default function atlas(s) {
  const c = country(s);
  return shell(
    s,
    s.pagina === 'pais'
      ? countryGate(s) ||
          `<div class="wrap page-breadcrumb">${link(s, { pagina: 'descubrir' }, '← Todos los países')}${countrySwitch(s)}</div><div class="atlas-country wrap"><section class="atlas-story">${countryIntro(s, c)}${facts(c)}${mapPanel(c)}</section><div class="atlas-content">${regions(s, c)}${search(s)}${themes(s)}${results(s, `Tu siguiente parada en ${c.name}`)}</div></div>`
      : destinationHome(s, countryCards(s)),
  );
}
