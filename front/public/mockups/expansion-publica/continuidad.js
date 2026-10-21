import {
  country,
  destinationHome,
  countryCards,
  mapPanel,
  shell,
  link,
  themes,
  results,
  countryIntro,
  regions,
  facts,
  countryGate,
} from './shared.js';
export default function continuidad(s) {
  const c = country(s);
  return shell(
    s,
    s.pagina === 'pais'
      ? countryGate(s) ||
          `<div class="wrap page-breadcrumb">${link(s, { pagina: 'descubrir', region: 'todas' }, '← Descubrir')} ${c.name}</div><section class="panorama wrap">${countryIntro(s, c)}</section><div class="wrap">${facts(c)}${mapPanel(c)}${regions(s, c)}${themes(s)}${results(s, `Destinos de ${c.name}`)}</div>`
      : destinationHome(s, countryCards(s, 'country-strip')),
  );
}
