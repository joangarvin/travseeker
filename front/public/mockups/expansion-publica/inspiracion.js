import {
  country,
  destinationHome,
  countryList,
  mapPanel,
  shell,
  link,
  image,
  themes,
  results,
  regions,
  facts,
  countryGate,
  countrySwitch,
} from './shared.js';
export default function inspiracion(s) {
  const c = country(s);
  return shell(
    s,
    s.pagina === 'pais'
      ? countryGate(s) ||
          `<div class="wrap page-breadcrumb">${link(s, { pagina: 'descubrir' }, '← Buscar inspiración')}${countrySwitch(s)}</div><section class="editorial-country">${image(c.image, c.alt)}<div class="wrap editorial-country-title"><span class="eyebrow">UNA GUÍA PARA ENCONTRAR TU VIAJE</span><h1 tabindex="-1">${c.name}<em>${c.headline}</em></h1></div></section><div class="wrap editorial-body"><section class="editorial-summary"><h2>Una idea de ${c.name}.</h2><p>${c.description}</p>${facts(c)}${mapPanel(c)}</section><section class="editorial-plans"><span class="eyebrow">ELIGE QUÉ QUIERES HACER</span><h2>Un país. Muchas formas de vivirlo.</h2>${themes(s)}${regions(s, c)}</section></div><div class="wrap">${results(s, `Encuentra tu lugar en ${c.name}`)}</div>`
      : destinationHome(s, countryList(s)),
  );
}
