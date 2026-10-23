const profiles = {
  ES: {
    en: "Spain",
    es: "Costa, pueblos, ciudades y montaña. Encuentra un destino que encaje con tu forma de viajar y recórrelo a tu ritmo.",
    description:
      "Coast, villages, cities and mountains. Find a destination that suits your way of travelling and explore at your own pace.",
    currency: ["Euro", "Euro"],
    languages: [
      "Español y lenguas cooficiales",
      "Spanish and co-official languages",
    ],
    bbox: [-9.5, 35.5, 4.4, 43.8],
  },
  PT: {
    en: "Portugal",
    es: "Ciudades para caminar, patrimonio y una costa que invita a parar. Explora sus destinos y encuentra tu siguiente viaje.",
    description:
      "Walkable cities, heritage and a coast that invites you to slow down. Explore its destinations and find your next trip.",
    currency: ["Euro", "Euro"],
    languages: ["Portugués", "Portuguese"],
    bbox: [-9.7, 36.8, -6.1, 42.2],
  },
  FR: {
    en: "France",
    es: "Arte, ciudades y paisajes con personalidad propia. Elige una región y descubre los destinos de esta guía.",
    description:
      "Art, cities and landscapes with a personality of their own. Choose a region and discover the destinations in this guide.",
    currency: ["Euro", "Euro"],
    languages: ["Francés", "French"],
    bbox: [-5.2, 41.3, 9.6, 51.2],
  },
  MA: {
    en: "Morocco",
    es: "Patrimonio, jardines y ciudades junto al Atlántico. Encuentra un punto de partida para conocer Marruecos.",
    description:
      "Heritage, gardens and Atlantic cities. Find a starting point for discovering Morocco.",
    currency: ["Dírham marroquí", "Moroccan dirham"],
    languages: ["Árabe y amazig", "Arabic and Amazigh"],
    bbox: [-13.2, 27.2, -0.8, 35.9],
  },
};
function countryPracticalInfo(code, locale = "es") {
  const profile = profiles[code];
  if (!profile) return null;
  const index = locale === "en" ? 1 : 0;
  return {
    currency: profile.currency[index],
    languages: profile.languages[index],
  };
}
module.exports = { profiles, countryPracticalInfo };
